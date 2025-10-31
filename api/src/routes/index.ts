import { Router } from "express";
import { userRouter } from "./users";
import { groupRouter } from "./groups";
import { authRouter } from "./auth";
import { requireAuth } from "../middleware/auth.middleware";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", requireAuth, userRouter);
router.use("/groups", requireAuth, groupRouter);
router.get("/health", (req, res) => res.json({ status: "ok" }));
