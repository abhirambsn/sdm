import { Request, Router } from "express";
import { ldapService } from "../service/ldap.service";
import { logger } from "../utils/logger";
import { sambaService } from "../service/samba.service";
import { auditService } from "../service/audit.service";

export const userRouter = Router();

userRouter.get("/", async (req, res, next) => {
  try {
    const users: any[] = (await ldapService.getUsers()) as any[];
    const response = { count: users.length, values: users };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

userRouter.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await ldapService.getUserBySAMAccountName(username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.post("/", async (req, res, next) => {
  const actor = req?.user?.username || "system"; // if you implement auth
  try {
    const { username, displayName, email, password, mustChangeAtNextLogin } =
      req.body;
    // create via samba-tool (recommended) for proper AD defaults
    const out = await sambaService.createUser(
      username,
      password,
      mustChangeAtNextLogin
    );
    await auditService.record("create_user", actor, {
      username,
      displayName,
      email,
    });
    res.status(201).json({ success: true, out: out.stdout || out });
  } catch (err: any) {
    logger.error(`create user failed: ${err.message}`);
    res
      .status(500)
      .json({ error: err.message, details: err.stderr || undefined });
  }
});

userRouter.delete("/:username", async (req, res, next) => {
  const actor = req?.user?.username || "system";
  try {
    const username = req.params.username;
    const out = await sambaService.deleteUser(username);
    await auditService.record("delete_user", actor, { username });
    res.json({ success: true, out: out.stdout || out });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.post("/:username/disable", async (req, res, next) => {
  const actor = req.user?.username || "system";
  try {
    const username = req.params.username;
    const out = await sambaService.disableUser(username);
    await auditService.record("disable_user", actor, { username });
    res.json({ success: true, out: out.stdout || out });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.post("/:username/setpassword", async (req, res, next) => {
  const actor = req.user?.username || "system";
  try {
    const username = req.params.username;
    const { password } = req.body;
    const out = await sambaService.setUserPassword(username, password);
    await auditService.record("set_password", actor, { username });
    res.json({ success: true, out: out.stdout || out });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.post("/:username/lock", async (req, res, next) => {
  const actor = req.user?.username || "system";
  try {
    const username = req.params.username;
    const out = await sambaService.lockUserAccount(username);
    await auditService.record("lock_user", actor, { username });
    res.json({ success: true, out });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.post("/:username/unlock", async (req, res, next) => {
  const actor = req.user?.username || "system";
  try {
    const username = req.params.username;
    const out = await sambaService.unlockUserAccount(username);
    await auditService.record("unlock_user", actor, { username });
    res.json({ success: true, out });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.post("/:username/resetpassword", async (req, res, next) => {
  const actor = req.user?.username || "system";
  try {
    const username = req.params.username;
    const { newPassword } = req.body;
    const out = await sambaService.resetPassword(username, newPassword);
    await auditService.record("reset_password", actor, { username });
    res.json({ success: true, out: out.stdout || out });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
