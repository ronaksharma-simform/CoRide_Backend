import "dotenv/config";
import app from "./app";
import { logger } from "./utils/logger";
// import { config } from "./utils/config";
app.listen(process.env.PORT || 3000, () => {
  logger.debug("Server running on port " + process.env.PORT);
});
