import { Router } from "express";
import { ldapService } from "../service/ldap.service";

export const groupRouter = Router();

groupRouter.get("/", async (req, res) => {
  try {
    const groups = await ldapService.listGroups();
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
