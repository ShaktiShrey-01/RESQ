import connectdb from "./config/db.js";
import app from "./app.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import { checkStaleLocations } from "./services/staleLocation.service.js";

import { updateUserLocation } from "./services/userLocation.service.js";
import emergency from "./models/emergency.model.js";

// IMPORT DISTANCE UTILITY
import { calculateDistance } from "./utils/geo.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

// ======================================================
// CREATE HTTP SERVER
// Express + Socket.IO use the same server.
// ======================================================
const server = http.createServer(app);

// ======================================================
// CREATE SOCKET.IO SERVER
// ======================================================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// ======================================================
// MAKE IO AVAILABLE TO CONTROLLERS
// ======================================================
app.set("io", io);

// ======================================================
// SOCKET.IO CONNECTION
// ======================================================
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ====================================================
  // USER PRIVATE ROOM
  // ====================================================
  socket.on("joinUserRoom", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room user:${userId}`);
  });

  // ====================================================
  // LOCATION UPDATE (LIVE TRACKING RELAY)
  // ====================================================
  socket.on("LOCATION_UPDATE", async (data) => {
    try {
      if (!data) return;
      const { userId, emergencyId, lat, lng } = data;

      if (!userId || lat === undefined || lng === undefined) {
        return;
      }

      // Update current user location in Redis
      await updateUserLocation({ userId, lat, lng });

      if (!emergencyId) {
        return;
      }

      const emergencyData = await emergency.findById(emergencyId);
      if (!emergencyData) {
        return;
      }

      // Security check: Make sure this user is the assigned helper
      if (!emergencyData.helper || emergencyData.helper.toString() !== String(userId)) {
        return;
      }

      // 🟢 FIX 1: Allow GPS updates even if they are just ASSIGNED or ARRIVED
      if (!["ASSIGNED", "ON_THE_WAY", "ARRIVED"].includes(emergencyData.status)) {
        return;
      }

      const requesterId = emergencyData.createdBy.toString();

      // 🟢 THE RELAY TOWER: Forward helper's live GPS to the Requester
      io.to(`user:${requesterId}`).emit("HELPER_LOCATION_UPDATED", {
        emergencyId: emergencyData._id,
        helperId: userId,
        lat: Number(lat),
        lng: Number(lng),
      });

      // 🟢 AUTOMATIC ARRIVAL DETECTION (Failsafe in Backend)
      const [emLng, emLat] = emergencyData.location.coordinates;
      const distanceInMeters = calculateDistance(
        Number(lat), Number(lng), 
        emLat, emLng              
      );

      // Trigger automatic ARRIVED status if within 50 meters
      if (distanceInMeters <= 50 && emergencyData.status !== "ARRIVED") {
        console.log(`📍 Helper ${userId} automatically arrived at emergency ${emergencyId}`);

        emergencyData.status = "ARRIVED";
        emergencyData.arrivedAt = new Date();
        await emergencyData.save();

        io.to(`user:${requesterId}`).emit("EMERGENCY_STATUS_UPDATED", {
          emergencyId: emergencyData._id,
          status: "ARRIVED",
          message: "The helper has arrived at your location.",
        });

        io.to(`user:${userId}`).emit("EMERGENCY_STATUS_UPDATED", {
          emergencyId: emergencyData._id,
          status: "ARRIVED",
          message: "You have arrived at the destination.",
        });
      }
    } catch (error) {
      console.error("LOCATION_UPDATE error:", error);
    }
  });
  // ====================================================
  // REAL-TIME CHAT RELAY
  // ====================================================
  socket.on("SEND_MESSAGE", async (data) => {
    try {
      const { emergencyId, senderId, text } = data;
      if (!emergencyId || !senderId || !text) return;

      const messageObj = { senderId, text, timestamp: new Date() };

      // 1. Save to Database so history isn't lost on refresh
      const emergencyData = await emergency.findByIdAndUpdate(
        emergencyId,
        { $push: { chat: messageObj } },
        { new: true }
      );

      if (!emergencyData) return;

      // 2. Relay the message to BOTH the Requester and the Helper instantly
      const requesterId = emergencyData.createdBy.toString();
      io.to(`user:${requesterId}`).emit("RECEIVE_MESSAGE", { emergencyId, message: messageObj });

      if (emergencyData.helper) {
        const helperId = emergencyData.helper.toString();
        io.to(`user:${helperId}`).emit("RECEIVE_MESSAGE", { emergencyId, message: messageObj });
      }

    } catch (error) {
      console.error("SEND_MESSAGE error:", error);
    }
  });

  // ====================================================
  // DISCONNECT
  // ====================================================
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ======================================================
// START SERVER
// ======================================================
const startServer = async () => {
  try {
    await connectdb();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.IO running on port ${PORT}`);
    });
    
    // Start the Stale Location Checker
    setInterval(() => {
      checkStaleLocations(io);
    }, 10000);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();