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
  // LOCATION UPDATE
  // ====================================================

  socket.on("LOCATION_UPDATE", async (data) => {
    try {
      if (!data) return;

      const { userId, emergencyId, lat, lng } = data;

      // =================================================
      // BASIC VALIDATION
      // =================================================
      if (!userId || lat === undefined || lng === undefined) {
        console.log("Invalid LOCATION_UPDATE");
        return;
      }

      // =================================================
      // UPDATE CURRENT USER LOCATION IN REDIS
      // =================================================
      await updateUserLocation({ userId, lat, lng });
      console.log(`Location updated for user ${userId}`);

      // =================================================
      // IF USER IS NOT HELPING AN EMERGENCY, STOP HERE
      // =================================================
      if (!emergencyId) {
        return;
      }

      // =================================================
      // FIND THE EMERGENCY
      // =================================================
      const emergencyData = await emergency.findById(emergencyId);

      if (!emergencyData) {
        console.log("Emergency not found:", emergencyId);
        return;
      }

      // =================================================
      // SECURITY CHECK
      // =================================================
      if (
        !emergencyData.helper ||
        emergencyData.helper.toString() !== String(userId)
      ) {
        console.log(`User ${userId} is not assigned to emergency ${emergencyId}`);
        return;
      }

      // =================================================
      // CHECK ACTIVE EMERGENCY STATUS
      // =================================================
      if (emergencyData.status !== "ON_THE_WAY") {
        return;
      }

      // =================================================
      // GET REQUESTER who created the emergency
      // =================================================
      const requesterId = emergencyData.createdBy.toString();

      // =================================================
      // SEND LIVE LOCATION ONLY TO REQUESTER of helper 
      // =================================================
      io.to(`user:${requesterId}`).emit("HELPER_LOCATION_UPDATED", {
        emergencyId: emergencyData._id,
        helperId: userId,
        lat: Number(lat),
        lng: Number(lng),
      });

      // =================================================
      // AUTOMATIC ARRIVED DETECTION
      // =================================================
      // MongoDB stores coordinates as [longitude, latitude]
      const [emLng, emLat] = emergencyData.location.coordinates;

      // Calculate distance in meters using Haversine formula
      const distanceInMeters = calculateDistance(
        Number(lat), Number(lng), // Helper's current location
        emLat, emLng              // Emergency's original location
      );

      // If the helper is within 50 meters, trigger ARRIVED status
      if (distanceInMeters <= 50) {
        console.log(`📍 Helper ${userId} arrived at emergency ${emergencyId}`);

        // Update MongoDB state
        emergencyData.status = "ARRIVED";
        emergencyData.arrivedAt = new Date();
        await emergencyData.save();

        // Notify Requester
        io.to(`user:${requesterId}`).emit("EMERGENCY_STATUS_UPDATED", {
          emergencyId: emergencyData._id,
          status: "ARRIVED",
          message: "The helper has arrived at your location.",
        });

        // Notify Helper
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
    // Start the Stale Location Checker (runs every 10 seconds)
      setInterval(() => {
        checkStaleLocations(io);
      }, 10000);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();