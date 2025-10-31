import { Router } from "express";
import { userRouter } from "./users";
import { groupRouter } from "./groups";

export const router = Router();

router.use("/users", userRouter);
router.use("/groups", groupRouter);
router.get("/health", (req, res) => res.json({ status: "ok" }));
