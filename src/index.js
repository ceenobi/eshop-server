import app from "./app.js";
import env from "./utils/validateEnv.js";
import { connectDB } from "./config/connectToDb.js";

const port = env.PORT || 6000;

if (!port || !env.MONGO_URI) {
  throw new Error(
    "Please make sure that the file .env is in place and populated"
  );
}

connectDB()
  .then(() => startServer())
  .catch((error) => {
    console.log("Invalid database connection...!", error);
  });

function startServer() {
  app.listen(port, (error) => {
    if (error) {
      console.log("Cannot connect to the server", error);
    } else {
      console.log(`Server connected to http://localhost:${port}`);
    }
  });
}
