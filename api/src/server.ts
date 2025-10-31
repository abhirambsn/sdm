import app from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

const port = config.PORT;

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});