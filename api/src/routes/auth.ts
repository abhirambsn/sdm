import { Request, Response, Router } from "express";
import { authService } from "../service/auth.service";

export const authRouter = Router();

authRouter.post("/token", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await authService.authenticate(username, password);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});