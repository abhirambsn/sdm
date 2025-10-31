import { NextFunction, Request, Response } from "express";
import { authService } from "../service/auth.service";
import { logger } from "../utils/logger";

export function requireAuth(req: Request, res: Response, _next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Missing Authorization Header" });
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing / Improper Token" });
    const decoded = authService.verifyToken(token);
    (req as any).user = decoded;
    _next();
  } catch (err: any) {
    logger.error(`Authentication middleware error: ${err.message}`);
    return res.status(401).json({ error: "Invalid Token: " + err.message });
  }
}