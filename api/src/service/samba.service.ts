import { execFile } from "child_process";
import util from 'util';
import { config } from "../config";
import { logger } from "../utils/logger";
const execFileAsync = util.promisify(execFile);

const ALLOWED_CMDS = new Set([
  "user",
  "group",
  "computer",
  "dns",
  "domain"
]);

const ALLOWED_USER_ACTIONS = new Set(["create", "delete", "disable", "enable", "setpassword", "change", "password", "resetpassword", "modify"]);

function validateUsername(username: string) {
  if (typeof username !== "string") throw new Error("Invalid username");
  // only allow a restricted charset (AD sAMAccountName style)
  const re = /^[A-Za-z0-9_.-]{1,20}$/;
  if (!re.test(username)) throw new Error("username invalid");
}

function validatePassword(password: string) {
  if (typeof password !== "string" || password.length < 8) throw new Error("password too weak");
}

function buildSambaToolArgs(cmd: string, subcmd: string, params: string[] = []): string[] {
  if (!ALLOWED_CMDS.has(cmd)) throw new Error("command not allowed");
  if (cmd === "user" && !ALLOWED_USER_ACTIONS.has(subcmd)) throw new Error("user action not allowed");

  // Example mapping:
  // samba-tool user create username password --must-change-at-next-login=no
  const args: string[] = [cmd, subcmd, ...params];
  return args;
}

export class SambaService {
  private sambaPath = config.smbToolPath;
  private enabled = config.smbToolEnabled;

  private async run(args: string[]) {
    if (!this.enabled) {
      logger.info(`[DRY-RUN] sudo ${this.sambaPath} ${args.join(" ")}`);
      return { stdout: `[DRY-RUN] sudo ${this.sambaPath} ${args.join(" ")}`, stderr: "" };
    }

    try {
      const { stdout, stderr } = await execFileAsync("/usr/bin/sudo", [this.sambaPath, ...args], { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 });
      return { stdout, stderr };
    } catch (e: any) {
      // rethrow with stdout/stderr if available
      logger.error(`samba-tool error: ${e.message}`);
      throw e;
    }
  }

  async createUser(username: string, password: string, mustChangeAtNextLogin = false) {
    validateUsername(username);
    validatePassword(password);

    // safe args:
    const params = [username, password, `--must-change-at-next-login=${mustChangeAtNextLogin ? "yes" : "no"}`];
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
    const args = buildSambaToolArgs("user", "setpassword", [username, `--newpassword=${password}`]);
    return this.run(args);
  }

  async addUserToGroup(username: string, group: string) {
    validateUsername(username);
    if (!/^[A-Za-z0-9 _.-]{1,64}$/.test(group)) throw new Error("invalid group");
    const args = buildSambaToolArgs("group", "addmembers", [group, username]);
    return this.run(args);
  }
}

export const sambaService = new SambaService();