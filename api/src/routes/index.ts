import { Router } from "express";
import { userRouter } from "./users";

export const router = Router();

router.use("/users", userRouter);
router.get("/health", (req, res) => res.json({ status: "ok" }));
