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





// ======================================
// ACCEPT EMERGENCY
// ======================================
export async function acceptEmergency(req, res) {
  try {
    const { emergencyId } = req.params;
    const emergencyToAccept = await emergency.findOneAndUpdate(
      { _id: emergencyId, status: "SEARCHING", helper: null },
      { $set: { helper: req.user.id, status: "ASSIGNED", acceptedAt: new Date() } },
      { new: true }
    );

    if (!emergencyToAccept) {
      return res.status(400).json({ success: false, message: "Emergency not found or already accepted" });
    }

    const helperId = req.user.id;
    const io = req.app.get("io");

    if (io) {
      // 🟢 FOOLPROOF ID EXTRACTION
      const creatorStr = emergencyToAccept.createdBy._id ? emergencyToAccept.createdBy._id.toString() : emergencyToAccept.createdBy.toString();
      const helperStr = helperId.toString();

      const payload = {
        emergencyId: emergencyToAccept._id, 
        creatorId: creatorStr,
        helperId: helperStr, 
        status: "ASSIGNED"
      };

      // 1. Try emitting to private rooms first
      io.to(`user:${creatorStr}`).emit("EMERGENCY_ACCEPTED", payload);
      io.to(`user:${helperStr}`).emit("EMERGENCY_ACCEPTED", payload);
      
      // 2. 🟢 GLOBAL FALLBACK: Broadcast globally just in case their socket temporarily dropped the room
      io.emit("EMERGENCY_ACCEPTED_GLOBAL", payload);
    }

    return res.status(200).json({ success: true, message: "Emergency accepted successfully", data: emergencyToAccept });
  } catch (error) {
    console.error("Accept emergency error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong while accepting", error: error.message });
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
    if (!emergencyaccepted) return res.status(404).json({ success: false, message: "Emergency not found" });

    if (!emergencyaccepted.helper || emergencyaccepted.helper.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "You are not the assigned helper" });
    }

    // 🟢 FIX 1: Ignore React double-fetching. If already ON_THE_WAY, just return success!
    if (status === "ON_THE_WAY" && emergencyaccepted.status === "ON_THE_WAY") {
      return res.status(200).json({ success: true, message: "Already on the way" });
    }
    if (status === "ON_THE_WAY" && emergencyaccepted.status !== "ASSIGNED") {
      return res.status(400).json({ success: false, message: "Emergency must be ASSIGNED first" });
    }

    emergencyaccepted.status = status;
    if (status === "ARRIVED" || status === "RESOLVED") emergencyaccepted.arrivedAt = emergencyaccepted.arrivedAt || new Date();
    if (status === "RESOLVED") emergencyaccepted.resolvedAt = new Date();

    await emergencyaccepted.save();

    const io = req.app.get("io");
    if (io) {
      const creatorStr = emergencyaccepted.createdBy.toString();
      const helperStr = emergencyaccepted.helper.toString();

      io.to(`user:${creatorStr}`).emit("EMERGENCY_STATUS_UPDATED", { emergencyId: emergencyaccepted._id, status: emergencyaccepted.status });
      io.to(`user:${helperStr}`).emit("EMERGENCY_STATUS_UPDATED", { emergencyId: emergencyaccepted._id, status: emergencyaccepted.status });
    }

    return res.status(200).json({ success: true, message: "Emergency status updated", emergency: emergencyaccepted });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update emergency status" });
  }
}

// ======================================
// CANCEL EMERGENCY (By Requester)
// ======================================
export async function cancelEmergency(req, res) {
  try {
    const { id } = req.params;
    const emergencyToCancel = await emergency.findById(id);

    if (!emergencyToCancel) return res.status(404).json({ success: false, message: "Emergency not found" });
    if (emergencyToCancel.createdBy.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: "Only creator can cancel" });
    if (["RESOLVED", "CLOSED", "CANCELED"].includes(emergencyToCancel.status)) return res.status(400).json({ success: false, message: "Already closed" });

    emergencyToCancel.status = "CANCELED";
    emergencyToCancel.resolvedAt = new Date();
    await emergencyToCancel.save();

    const io = req.app.get("io");
    if (io) {
      // 🟢 FIX 2: Convert helper ID to string so the socket hits them!
      if (emergencyToCancel.helper) {
        const helperStr = emergencyToCancel.helper.toString();
        io.to(`user:${helperStr}`).emit("EMERGENCY_STATUS_UPDATED", { emergencyId: emergencyToCancel._id, status: "CANCELED", message: "Requester cancelled." });
      }
      io.emit("EMERGENCY_CANCELLED", { emergencyId: emergencyToCancel._id });
    }
    return res.status(200).json({ success: true, message: "Emergency cancelled successfully" });
  } catch (error) {
    console.error("Cancel emergency error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel emergency" });
  }
}

// ==========================================
// DROP EMERGENCY (By Helper)
// ==========================================
// ==========================================
// DROP EMERGENCY (By Helper)
// ==========================================
export async function dropEmergency(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const emergencyToDrop = await emergency.findById(id);

    if (!emergencyToDrop) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }
    if (!emergencyToDrop.helper || emergencyToDrop.helper.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only assigned helper can drop." });
    }
    if (['RESOLVED', 'CLOSED', 'CANCELED'].includes(emergencyToDrop.status)) {
      return res.status(400).json({ success: false, message: "Cannot drop a closed emergency." });
    }

    // 🟢 THE FIX: Completely kill the emergency instead of putting it back to SEARCHING
    emergencyToDrop.status = 'CANCELED';
    emergencyToDrop.resolvedAt = new Date();
    await emergencyToDrop.save();

    const io = req.app.get("io");
    if (io) {
      const creatorStr = emergencyToDrop.createdBy.toString();
      
      // 1. Tell the Requester it was cancelled so they get redirected home
      io.to(`user:${creatorStr}`).emit("EMERGENCY_STATUS_UPDATED", {
        emergencyId: emergencyToDrop._id, 
        status: "CANCELED", 
        message: "Responder had to cancel. Please create a new request." 
      });

      // 2. Remove it from everyone's Radar globally
      io.emit("EMERGENCY_CANCELLED", { emergencyId: emergencyToDrop._id });
    }
    
    return res.status(200).json({ success: true, message: "Mission dropped and emergency cancelled." });
  } catch (error) {
    console.error("Drop mission error:", error);
    return res.status(500).json({ success: false, message: "Failed to drop mission." });
  }
}