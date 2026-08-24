import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userroutes from "./routes/user.routes.js";
import emergencyroutes from "./routes/emergency.routes.js";

const app = express();

// 1. CORS MUST BE AT THE VERY TOP (Before any routes or parsers)
app.use(cors({
  origin: ["http://localhost:5173", "https://resq-01.netlify.app"], // Exact frontend URL
  credentials: true,               // Required for cookies/tokens
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Body & Cookie Parsers
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static('public'));


// 3. Routes
// NOTE: Your routes start with /api/users
app.use("/api/users", userroutes);
app.use("/api/emergencies", emergencyroutes);

app.get("/", (req, res) => {
  res.send("RESQ API Server is running!");
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "My example route is working perfectly!",
  });
});

// Error Handlers
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body. Send raw JSON with double quotes only.",
    });
  }
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;