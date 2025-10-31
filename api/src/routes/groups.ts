import { Router } from "express";
import { ldapService } from "../service/ldap.service";
import { group } from "console";

export const groupRouter = Router();

groupRouter.get("/", async (req, res) => {
  try {
    const groups = await ldapService.listGroups() as any[];
    const response = { count: groups.length, values: groups };
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

groupRouter.get("/:groupName/members", async (req, res) => {
  try {
    const groupName = req.params.groupName;
    const members = await ldapService.getGroupMembers(groupName) as any[];
    res.json({ count: members.length, groupName, members });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

groupRouter.get("/:groupName", async (req, res) => {
  try {
    const group = req.params.groupName;
    const groups = await ldapService.getGroupInformation(group);
    if (!groups) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

groupRouter.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await ldapService.createGroup(name, description);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

groupRouter.delete("/:groupName", async (req, res) => {
  try {
    const groupName = req.params.groupName;
    const result = await ldapService.deleteGroup(groupName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

groupRouter.post("/addUser", async (req, res) => {
  try {
    const { username, groupName } = req.body;
    const result = await ldapService.addUserToGroup(username, groupName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

groupRouter.post("/removeUser", async (req, res) => {
  try {
    const { username, groupName } = req.body;
    const result = await ldapService.removeUserFromGroup(username, groupName);
    if (result?.error) {
      return res.status(400).json(result);
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

