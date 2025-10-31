import { Router } from "express";
import { userRouter } from "./users";
import { groupRouter } from "./groups";
import { authRouter } from "./auth";
import { requireAuth } from "../middleware/auth.middleware";
import { auditMiddleware } from "../middleware/audit.middleware";
import { auditRouter } from "./audit";
import { systemRouter } from "./system";

export const router = Router();

router.use("/auth", auditMiddleware, authRouter);
router.use("/users", requireAuth, auditMiddleware, userRouter);
router.use("/groups", requireAuth, auditMiddleware, groupRouter);
router.use("/system", requireAuth, auditMiddleware, systemRouter);
router.use("/audit", requireAuth, auditRouter);
router.get("/health", (req, res) => res.json({ status: "ok" }));
