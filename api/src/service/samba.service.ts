import { execFile } from "child_process";
import util from "util";
import { config } from "../config";
import { logger } from "../utils/logger";
import fs from "fs";
const execFileAsync = util.promisify(execFile);

const ALLOWED_CMDS = new Set([
  "user",
  "group",
  "computer",
  "dns",
  "domain",
  "dbcheck",
]);

const ALLOWED_USER_ACTIONS = new Set([
  "create",
  "delete",
  "disable",
  "enable",
  "setpassword",
  "change",
  "password",
  "resetpassword",
  "modify",
]);

function validateUsername(username: string) {
  if (typeof username !== "string") throw new Error("Invalid username");
  // only allow a restricted charset (AD sAMAccountName style)
  const re = /^[A-Za-z0-9_.-]{1,20}$/;
  if (!re.test(username)) throw new Error("username invalid");
}

function validatePassword(password: string) {
  if (typeof password !== "string" || password.length < 8)
    throw new Error("password too weak");
}

function buildSambaToolArgs(
  cmd: string,
  subcmd: string,
  params: string[] = []
): string[] {
  if (!ALLOWED_CMDS.has(cmd)) throw new Error("command not allowed");
  if (cmd === "user" && !ALLOWED_USER_ACTIONS.has(subcmd))
    throw new Error("user action not allowed");

  // Example mapping:
  // samba-tool user create username password --must-change-at-next-login=no
  const args: string[] = [cmd, subcmd, ...params];
  return args;
}

export class SambaService {
  private sambaPath = config.smbToolPath;
  private enabled = config.smbToolEnabled;
  private backupPath = config.smbBackupPath;

  private async run(args: string[]) {
    if (!this.enabled) {
      logger.info(`[DRY-RUN] sudo ${this.sambaPath} ${args.join(" ")}`);
      return {
        stdout: `[DRY-RUN] sudo ${this.sambaPath} ${args.join(" ")}`,
        stderr: "",
      };
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        "/usr/bin/sudo",
        [this.sambaPath, ...args],
        { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 }
      );
      return { stdout, stderr };
    } catch (e: any) {
      // rethrow with stdout/stderr if available
      logger.error(`samba-tool error: ${e.message}`);
      throw e;
    }
  }

  async createUser(
    username: string,
    password: string,
    mustChangeAtNextLogin = false
  ) {
    validateUsername(username);
    validatePassword(password);

    // safe args:
    const params = [username, password];
    if (mustChangeAtNextLogin) {
      params.push(`--must-change-at-next-login`);
    }
    const args = buildSambaToolArgs("user", "create", params);
    return this.run(args);
  }

  async deleteUser(username: string) {
    validateUsername(username);
    const args = buildSambaToolArgs("user", "delete", [username]);
    return this.run(args);
  }

  async disableUser(username: string) {
    validateUsername(username);
    const args = buildSambaToolArgs("user", "disable", [username]);
    return this.run(args);
  }

  async setUserPassword(username: string, password: string) {
    validateUsername(username);
    validatePassword(password);
    const args = buildSambaToolArgs("user", "setpassword", [
      username,
      `--newpassword=${password}`,
    ]);
    return this.run(args);
  }

  async addUserToGroup(username: string, group: string) {
    validateUsername(username);
    if (!/^[A-Za-z0-9 _.-]{1,64}$/.test(group))
      throw new Error("invalid group");
    const args = buildSambaToolArgs("group", "addmembers", [group, username]);
    return this.run(args);
  }

  async getSambaHealth() {
    const args = buildSambaToolArgs("dbcheck", "--cross-ncs", []);
    const { stdout: output } = await this.run(args);
    const result = {} as any;

    const checkedMatch = output.match(
      /Checked\s+(\d+)\s+objects\s+\((\d+)\s+errors?\)/i
    );
    if (checkedMatch) {
      result.objects_checked = parseInt(checkedMatch[1] as string);
      result.errors = parseInt(checkedMatch[2] as string);
      result.status = result.errors === 0 ? "healthy" : "issues";
    } else {
      result.raw = output;
      result.status = "unknown";
    }
    return result;
  }

  async getADInfo() {
    const args = buildSambaToolArgs("domain", "info", ["127.0.0.1"]);
    const { stdout: output } = await this.run(args);
    const lines = output.split("\n");
    const info: Record<string, string> = {};

    for (const line of lines) {
      const [key, value] = line.split(":").map((x) => x.trim());
      if (key && value) {
        const formattedKey = key.toLowerCase().replace(/\s+/g, "_");
        info[formattedKey] = value;
      }
    }

    return {
      ...info,
      status: Object.keys(info).length ? "ok" : "unknown",
    };
  }

  async getSambaStatus() {
    try {
      const { stdout, stderr } = await execFileAsync(
        "/usr/bin/sudo",
        ["systemctl", "status", "samba-ad-dc.service", "--no-pager"],
        { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 }
      );
      const serviceInfo: any = {};

      const activeMatch = stdout.match(
        /Active:\s+(\w+)\s+\((\w+)\)\s+since\s+(.+);/i
      );
      const pidMatch = stdout.match(/Main PID:\s+(\d+)/i);
      const loadedMatch = stdout.match(/Loaded:\s+loaded\s+\(([^;]+)/i);

      serviceInfo.service = "samba-ad-dc";
      serviceInfo.loaded = loadedMatch ? loadedMatch[1] : "unknown";
      serviceInfo.active = activeMatch ? activeMatch[1] === "active" : false;
      serviceInfo.state = activeMatch ? activeMatch[2] : "unknown";
      serviceInfo.since = activeMatch
        ? new Date(activeMatch[3] as string).toISOString()
        : null;
      serviceInfo.pid = pidMatch ? parseInt(pidMatch[1] as string) : null;

      return serviceInfo;
    } catch (e: any) {
      logger.error(`samba-tool error: ${e.message}`);
      throw e;
    }
  }

  async resetPassword(username: string, newPassword: string) {
    validateUsername(username);
    validatePassword(newPassword);
    const args = buildSambaToolArgs("user", "setpassword", [
      username,
      `--newpassword=${newPassword}`,
    ]);
    return this.run(args);
  }

  async lockUserAccount(username: string) {
    validateUsername(username);
    const args = buildSambaToolArgs("user", "disable", [username]);
    return this.run(args);
  }

  async unlockUserAccount(username: string) {
    validateUsername(username);
    const args = buildSambaToolArgs("user", "enable", [username]);
    return this.run(args);
  }
}

export const sambaService = new SambaService();
