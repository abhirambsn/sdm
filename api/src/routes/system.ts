import { Router } from "express";
import { sambaService } from "../service/samba.service";

export const systemRouter = Router();

systemRouter.get("/info", (req, res) => {
  const info = {
    appName: "Sentinel Directory Manager",
    version: "1.0.0",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.json(info);
});

systemRouter.get("/status", async (req, res) => {
  try {
    const [status, health, info] = await Promise.all([
      sambaService.getSambaStatus(),
      sambaService.getSambaHealth(),
      sambaService.getADInfo(),
    ]);
    res.json({ status, health, info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
