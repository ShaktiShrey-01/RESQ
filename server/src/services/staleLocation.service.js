import redis from "../config/redis.js";
import emergency from "../models/emergency.model.js";

/**
 * Checks for emergencies where the helper is ON_THE_WAY 
 * but hasn't sent a GPS update in the last 15 seconds.
 */
export const checkStaleLocations = async (io) => {
  try {
    // 1. Find all active emergencies where a helper is traveling
    const activeEmergencies = await emergency.find({
      status: "ON_THE_WAY",
      helper: { $ne: null }
    });

    if (activeEmergencies.length === 0) return;

    // 2. Check Redis for each helper's active status
    for (const em of activeEmergencies) {
      const helperId = em.helper.toString();
      const requesterId = em.createdBy.toString();
      
      const activeKey = `resq:user:${helperId}:active`;
      
      // 3. Check if key exists in Redis
      const isActive = await redis.exists(activeKey);

      // 4. If the key doesn't exist, the helper's location is stale
      if (!isActive) {
        // Emit a warning to the requester
        io.to(`user:${requesterId}`).emit("HELPER_LOCATION_STALE", {
          emergencyId: em._id,
          helperId: helperId,
          message: "Helper's live location is temporarily unavailable (Weak network).",
        });
      }
    }
  } catch (error) {
    console.error("Stale Location Checker Error:", error);
  }
};