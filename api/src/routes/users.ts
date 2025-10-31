import { Router } from "express";
import { LdapService } from "../service/ldap.service";
import { logger } from "../utils/logger";

const ldapService = new LdapService();
export const userRouter = Router();

userRouter.get("/", async (req, res, next) => {
  try {
    const users: any[] = await ldapService.getUsers() as any[];
    const response = { count: users.length, values: users };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// userRouter.get("/:username", async (req, res, next) => {
//   try {
//     const user = await ldapService.getUser(req.params.username);
//     if (!user) return res.status(404).json({ error: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// });

// userRouter.post("/", async (req, res, next) => {
//   try {
//     const { username, displayName, email } = req.body;
//     const created = await ldapService.createUser({ username, displayName, email });
//     logger.info(`User created: ${username}`);
//     res.status(201).json(created);
//   } catch (err) {
//     next(err);
//   }
// });