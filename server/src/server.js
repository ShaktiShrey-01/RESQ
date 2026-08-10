
import connectdb from "./config/db.js";
import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();
const PORT=process.env.PORT || 8000;
const startServer = async () => {
  try {
    // Connect Databases
    await connectdb();
    
    // Start Express Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();