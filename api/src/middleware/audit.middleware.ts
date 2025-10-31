import { Request, Response, NextFunction } from "express";
import { auditService } from "../service/audit.service";
import { logger } from "../utils/logger";

function scrub(obj: any) {
  if (!obj || typeof obj !== "object") return obj;
  const copy: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    if (/(password|pwd|secret|token|private)/i.test(k)) {
      copy[k] = "***REDACTED***";
    } else {
      copy[k] = typeof obj[k] === "object" ? scrub(obj[k]) : obj[k];
    }
  }
  return copy;
}

export async function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only log mutating operations
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  // Defer logging until after response is finished so we know status
  res.on("finish", async () => {
    try {
      // actor: from auth middleware - ensure req.user exists
      const actor = (req as any).user?.username || "unknown";
      const action = `${req.method} ${req.path}`;
      const target =
        req.params?.username || req.body?.username || req.body?.name || null;
      const details = {
        body: scrub(req.body),
        query: req.query,
        status: res.statusCode,
        note: (req as any).auditNote || null,
      };
      const ip = req.ip || (req.headers["x-forwarded-for"] as string) || null;
      const userAgent = req.headers["user-agent"] as string | undefined;

      await auditService.record(
        action,
        actor,
        { target, details },
        { ip: ip as string, userAgent: userAgent as string }
      );
    } catch (err: any) {
      logger.error("Audit logging failed: " + (err?.message || String(err)));
    }
  });

  next();
}
