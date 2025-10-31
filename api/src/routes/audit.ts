import { Router } from "express";
import { auditService } from "../service/audit.service";

export const auditRouter = Router();

auditRouter.get("/", async (req, res) => {
  const { actor, action, date_from, date_to, limit, offset } = req.query;
  const parsed = await auditService.list({
    actor: actor ? String(actor) : null,
    action: action ? String(action) : null,
    date_from: date_from ? String(date_from) : null,
    date_to: date_to ? String(date_to) : null,
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
  });
  res.json(parsed);
});

auditRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const record = await auditService.get(id);
  if (!record) {
    return res.status(404).json({ error: "Audit record not found" });
  }
  res.json(record);
});
