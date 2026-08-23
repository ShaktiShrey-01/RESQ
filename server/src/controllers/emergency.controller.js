import mongoose from "mongoose";
import emergency from '../models/emergency.model.js';



import {
  updateUserLocation,
  getNearbyUsers,
} from "../services/userLocation.service.js";

// 🟢 RAW MATH: Haversine Formula for flawless distance calculation

// ======================================
// CREATE EMERGENCY
// ======================================
export async function createEmergency(req, res) {
  try {
    const { type, description, location, address, priority } = req.body || {};

    if (!type || !description || !location || !address) {
      return res.status(400).json({ success: false, message: "type, description, location and address are required" });
    }

    const locationValidation = validateCoordinates(location.lat, location.lng);
    if (!locationValidation.valid) {
      return res.status(400).json({ success: false, message: locationValidation.message });
    }

    const allowedTypes = ["Medical", "Transportation", "Fire", "Accident", "Crime/Safety", "Natural Disaster", "Other"];
    const normalizedType = normalizeEnum(type, allowedTypes, "Other");
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const normalizedPriority = normalizeEnum(priority, allowedPriorities, "HIGH");

    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, message: "Unauthorized: missing user id in token" });
    }

  // ... (Top half of createEmergency stays the same) ...

    const newEmergency = await emergency.create({
      type: normalizedType,
      description,
      location: {
        type: "Point",
        coordinates: [Number(location.lng), Number(location.lat)],
        address,
      },
      priority: normalizedPriority,
      address,
      createdBy: creatorId,
      status: "SEARCHING",
    });

    const populatedEmergency = await emergency.findById(newEmergency._id).populate('createdBy', 'name');
    const creatorName = populatedEmergency.createdBy?.name || "User in need";

    const io = req.app.get("io");
    if (io) {
      // 🟢 FIX 3: BROADCAST GLOBALLY! 
      // We skip the Redis query. We ping EVERY active user instantly.
      // Our React Frontend Gatekeeper will mathematically block it if they are > 5km away.
      io.emit("NEW_EMERGENCY", {
        emergencyId: newEmergency._id,
        creatorId: creatorId, // Send creator ID so they don't notify themselves
        creatorName: creatorName,
        type: newEmergency.type,
        description: newEmergency.description,
        location: newEmergency.location,
        address: newEmergency.address,
        priority: newEmergency.priority,
        status: newEmergency.status,
      });
    }

    return res.status(201).json({ success: true, message: "Emergency created successfully", data: newEmergency });
  } catch (error) {
    console.error("Create emergency error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}


function validateCoordinates(lat, lng) {
  // Check that values exist
  if (lat === undefined || lng === undefined) {
    return {
      valid: false,
      message: "Latitude and longitude are required",
    };
  }

  // Convert numeric strings if your API allows them
  const latitude = Number(lat);
  const longitude = Number(lng);

  // Check for NaN, Infinity, etc.
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      valid: false,
      message: "Latitude and longitude must be valid numbers",
    };
  }

  // Latitude range
  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      message: "Latitude must be between -90 and 90",
    };
  }

  // Longitude range
  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      message: "Longitude must be between -180 and 180",
    };
  }
  // All checks passed
  return { valid: true };
}

function normalizeEnum(value, allowedValues, fallback) {
  if (!value) return fallback;
  const lower = String(value).toLowerCase();
  const found = allowedValues.find((v) => v.toLowerCase() === lower);
  return found || fallback;
}





export async function acceptEmergency(req, res) {
   // route: POST /api/emergencies/:emergencyId/accept
try {
  const { emergencyId } = req.params;

  const emergencyToAccept = await emergency.findOneAndUpdate(
    {
      _id: emergencyId,
      status: "SEARCHING",
      helper: null,
    },
    {
      $set: {
        helper: req.user.id,
        status: "ASSIGNED",
        acceptedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );

  if (!emergencyToAccept) {
    return res.status(400).json({
      success: false,
      message: "Emergency not found or already accepted",
    });
  }


const helperId = req.user.id;
    const io =
      req.app.get("io");


    if (io) {

      // Notify requester
      io.to(
        `user:${emergencyToAccept.createdBy}`
      )
      .emit(
        "EMERGENCY_ACCEPTED",
        {

          emergencyId:
            emergencyToAccept._id,

          helperId:
            helperId,

          status:
            "ASSIGNED"

        }
      );


      // Notify helper too
      io.to(
        `user:${helperId}`
      )
      .emit(
        "EMERGENCY_ACCEPTED",
        {

          emergencyId:
            emergencyToAccept._id,

          helperId:
            helperId,

          status:
            "ASSIGNED"

        }
      );

    }

  return res.status(200).json({
    success: true,
    message: "Emergency accepted successfully",
    data: emergencyToAccept,
  });
} catch (error) {
  console.error("Accept emergency error:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong while accepting the emergency",
    error: error.message,
  });
}
}

export async function getemergency(req,res){
    const{id}=req.params;
    try{
        const emergencydata=await emergency.findById(id).populate("createdBy","name email phone").populate("helper","name email phone");
        if(!emergencydata){
            return res.status(404).json({success:false,message:"Emergencydetails not found"});
        }
        return res.status(200).json({success:true,message:"Emergencydetails fetched successfully",data:emergencydata});
    } catch (error) {
        console.error("Get emergency error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching the emergency details",
            error: error.message,
        });
    }
}



// ======================================
// UPDATE EMERGENCY STATUS
// ======================================

// ======================================
// UPDATE EMERGENCY STATUS
// ======================================
// ======================================
// UPDATE EMERGENCY STATUS
// ======================================
// ======================================
// UPDATE EMERGENCY STATUS
// ======================================
export async function updateEmergencyStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["ON_THE_WAY", "ARRIVED", "RESOLVED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const emergencyaccepted = await emergency.findById(id);
    if (!emergencyaccepted) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }

    if (!emergencyaccepted.helper || emergencyaccepted.helper.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "You are not the assigned helper" });
    }

    // 🟢 THE FIX: We removed the strict blocking logic here. 
    // Now, if they click "Reached Location" it can instantly jump to RESOLVED.
    if (status === "ON_THE_WAY" && emergencyaccepted.status !== "ASSIGNED") {
      return res.status(400).json({ success: false, message: "Emergency must be ASSIGNED first" });
    }

    emergencyaccepted.status = status;

    if (status === "ARRIVED" || status === "RESOLVED") {
      emergencyaccepted.arrivedAt = emergencyaccepted.arrivedAt || new Date();
    }
    if (status === "RESOLVED") {
      emergencyaccepted.resolvedAt = new Date();
    }

    await emergencyaccepted.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${emergencyaccepted.createdBy}`).emit("EMERGENCY_STATUS_UPDATED", {
        emergencyId: emergencyaccepted._id,
        status: emergencyaccepted.status,
      });

      if (emergencyaccepted.helper) {
        io.to(`user:${emergencyaccepted.helper}`).emit("EMERGENCY_STATUS_UPDATED", {
          emergencyId: emergencyaccepted._id,
          status: emergencyaccepted.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Emergency status updated",
      emergency: emergencyaccepted,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update emergency status",
    });
  }
}

// ======================================
// GET NEARBY (ACTIVE) EMERGENCIES
// ======================================
// ======================================
// GET NEARBY (ACTIVE) EMERGENCIES
// ======================================
// 🟢 RAW MATH: Haversine Formula for flawless distance calculation
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ======================================
// GET NEARBY (ACTIVE) EMERGENCIES
// ======================================
export async function getNearbyEmergencies(req, res) {
  try {
    console.log("🔍 NEARBY HIT:", { lat: req.query.lat, lng: req.query.lng, user: req.user?.id || req.user?._id });
    let { lat, lng } = req.query;
    
    const userIdStr = String(req.user?.id || req.user?._id);

    // 🟢 STRICT VALIDATION 1: lat/lng must exist
    if (!lat || !lng || lat === 'undefined' || lng === 'undefined') {
      return res.status(400).json({ 
        success: false, 
        message: "lat and lng query parameters are required" 
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // 🟢 STRICT VALIDATION 2: Reject if coordinates aren't valid numbers
    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return res.status(400).json({ 
        success: false, 
        message: "Latitude and longitude must be valid numbers" 
      });
    }

    // 🟢 STRICT VALIDATION 3: Reject if coordinates are physically impossible
    if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return res.status(400).json({ 
        success: false, 
        message: "Coordinates out of valid range" 
      });
    }

    // Fetch ALL active emergencies
    const allActive = await emergency.find({ status: "SEARCHING", helper: null })
      .populate("createdBy", "name email");

    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    // 🟢 STRICT JAVASCRIPT FILTERING
    const filteredEmergencies = allActive.filter(em => {
      
      // 🛑 RULE A: Hide self-created emergencies
      if (em.createdBy) {
        const creatorId = em.createdBy._id ? String(em.createdBy._id) : String(em.createdBy);
        if (creatorId === userIdStr) return false;
      }

      // 🛑 RULE B: Hide old/ghost emergencies (older than 24 hours)
      if (new Date(em.createdAt).getTime() < twentyFourHoursAgo) {
        return false;
      }

      // 🛑 RULE C: Distance filtering (Guaranteed to have valid coordinates now)
      if (em.location && em.location.coordinates) {
        const emLng = em.location.coordinates[0];
        const emLat = em.location.coordinates[1];
        
        const distanceInKm = calculateDistanceKm(userLat, userLng, emLat, emLng);
        
        // If distance is explicitly greater than 5km, hide it
        if (distanceInKm > 5) {
          return false;
        }
        
        // Passed all checks! Within 5km ✅
        return true;  
      }

      // If emergency in database is corrupted and missing location data, hide it
      return false;
    });

    return res.status(200).json({
      success: true,
      data: filteredEmergencies,
    });

  } catch (error) {
    console.error("Get nearby emergencies error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
// ======================================
// ======================================
// CANCEL EMERGENCY
// ======================================
export async function cancelEmergency(req, res) {
  try {
    const { id } = req.params;
    const emergencyToCancel = await emergency.findById(id);

    if (!emergencyToCancel) return res.status(404).json({ success: false, message: "Emergency not found" });

    if (emergencyToCancel.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Only the creator can cancel this emergency" });
    }

    if (["RESOLVED", "CLOSED", "CANCELED"].includes(emergencyToCancel.status)) {
      return res.status(400).json({ success: false, message: "This emergency is already closed" });
    }

    emergencyToCancel.status = "CANCELED";
    emergencyToCancel.resolvedAt = new Date();
    await emergencyToCancel.save();

    const io = req.app.get("io");
    if (io) {
      if (emergencyToCancel.helper) {
        io.to(`user:${emergencyToCancel.helper}`).emit("EMERGENCY_STATUS_UPDATED", {
          emergencyId: emergencyToCancel._id,
          status: "CANCELED",
          message: "The requester has cancelled this emergency.",
        });
      }
      
      // 🟢 FIX 2: Broadcast to EVERYONE to instantly erase it from their nearby radars
      io.emit("EMERGENCY_CANCELLED", { emergencyId: emergencyToCancel._id });
    }

    return res.status(200).json({ success: true, message: "Emergency cancelled successfully" });
  } catch (error) {
    console.error("Cancel emergency error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel emergency" });
  }
}

// ==========================================
// GET USER EMERGENCY HISTORY
// ==========================================
export async function getUserHistory(req, res) {
  try {
    const userId = req.user.id;

    // Find emergencies where the user was the requester
    const createdEmergencies = await emergency.find({ createdBy: userId })
      .populate('helper', 'name phone')
      .sort({ createdAt: -1 }); // Newest first

    // Find emergencies where the user was the hero/responder
    const helpedEmergencies = await emergency.find({ helper: userId })
      .populate('createdBy', 'name phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        created: createdEmergencies,
        helped: helpedEmergencies
      }
    });
  } catch (error) {
    console.error("Fetch history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
}


// ==========================================
// HELPER CANCEL / DROP MISSION
// ==========================================
export async function dropEmergency(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id; // The ID of the helper trying to drop it

    // 1. Find the active emergency
    const emergencyToDrop = await emergency.findById(id);

    // 2. Validate it exists and the user is actually the assigned helper
    if (!emergencyToDrop) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }
    if (!emergencyToDrop.helper || emergencyToDrop.helper.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the assigned helper can drop this mission." });
    }
    if (['RESOLVED', 'CLOSED', 'CANCELED'].includes(emergencyToDrop.status)) {
      return res.status(400).json({ success: false, message: "Cannot drop a closed emergency." });
    }

    // 3. Revert the database state back to searching
    emergencyToDrop.helper = null; // Remove the helper
    emergencyToDrop.status = 'SEARCHING'; // Reset status
    await emergencyToDrop.save();

    const io = req.app.get("io");
    if (io) {
      // 4. Notify the Creator so their screen goes back to "Searching"
      io.to(`user:${emergencyToDrop.createdBy}`).emit("EMERGENCY_STATUS_UPDATED", {
        emergencyId: emergencyToDrop._id,
        status: "SEARCHING",
        message: "The responder had to cancel. Searching for a new hero...",
        helperDropped: true // Flag to tell frontend to clear helper data
      });

      // 5. RE-BROADCAST TO RADAR! Find all nearby users again
      // Coordinates array in MongoDB is [longitude, latitude]
      const nearbyUsers = await getNearbyUsers({
        lat: emergencyToDrop.location.coordinates[1],
        lng: emergencyToDrop.location.coordinates[0],
        radiusInMeters: 5000, 
      });

      // 6. Loop through nearby users and send them the emergency again
      nearbyUsers.forEach((nearbyUserId) => {
        // Do NOT notify the original creator, and do NOT notify the helper who just dropped it!
        if (String(nearbyUserId) === String(emergencyToDrop.createdBy) || String(nearbyUserId) === String(userId)) {
          return; 
        }

        // Emit to everyone else's radar
        io.to(`user:${nearbyUserId}`).emit("NEW_EMERGENCY", {
          emergencyId: emergencyToDrop._id,
          type: emergencyToDrop.type,
          description: emergencyToDrop.description,
          location: emergencyToDrop.location,
          address: emergencyToDrop.address,
          priority: emergencyToDrop.priority,
          status: emergencyToDrop.status,
        });
      });
    }

    // 7. Send success back to the helper who dropped it
    return res.status(200).json({ success: true, message: "Mission dropped successfully." });
  } catch (error) {
    console.error("Drop mission error:", error);
    return res.status(500).json({ success: false, message: "Failed to drop mission." });
  }
}