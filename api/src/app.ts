import express from "express";
import helmet from "helmet";
import cors from "cors";
import { router as apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use("/api/v1", apiRouter);

const frontendPath = path.join(__dirname, "../../ui/dist");
app.use(express.static(frontendPath));
app.get('/*\w', (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(errorHandler);

export default app;