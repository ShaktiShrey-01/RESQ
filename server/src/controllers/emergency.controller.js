import emergency from '../models/emergency.model.js';

import {
  updateUserLocation,
  getNearbyUsers,
} from "../services/userLocation.service.js";


export async function createEmergency(req, res) {

  try {

    const {
      type,
      description,
      location,
      address,
      priority,
    } = req.body || {};


    // ==================================================
    // VALIDATE REQUIRED DATA
    // ==================================================

    if (
      !type ||
      !description ||
      !location ||
      !address
    ) {

      return res.status(400).json({
        success: false,
        message:
          "type, description, location and address are required",
      });

    }


    // ==================================================
    // VALIDATE COORDINATES
    // ==================================================

    const locationValidation =
      validateCoordinates(
        location.lat,
        location.lng
      );


    if (!locationValidation.valid) {

      return res.status(400).json({
        success: false,
        message:
          locationValidation.message,
      });

    }


    // ==================================================
    // NORMALIZE EMERGENCY TYPE
    // ==================================================

    const allowedTypes = [
      "Medical",
      "Transportation",
      "Fire",
      "Accident",
      "Crime/Safety",
      "Natural Disaster",
      "Other",
    ];


    const normalizedType =
      normalizeEnum(
        type,
        allowedTypes,
        "Other"
      );


    // ==================================================
    // NORMALIZE PRIORITY
    // ==================================================

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];


    const normalizedPriority =
      normalizeEnum(
        priority,
        allowedPriorities,
        "HIGH"
      );


    // ==================================================
    // GET USER ID FROM JWT
    // ==================================================

    const creatorId =
      req.user?.id; // get user.id from verifyjwt file middlleware here user.id mean id of user who raised emergency


    if (!creatorId) { 

      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: missing user id in token",
      });

    }


    // ==================================================
    // CREATE EMERGENCY IN MONGODB
    // ==================================================

    const newEmergency =
      await emergency.create({

        type:
          normalizedType,

        description,

        location: {

          type: "Point",

          coordinates: [

            Number(location.lng),

            Number(location.lat),

          ],

          address,

        },

        priority:
          normalizedPriority,

        address,

        createdBy:
          creatorId,

        status:
          "SEARCHING",

      });


    // ==================================================
    // FIND ACTIVE USERS NEAR THE EMERGENCY
    //
    // Redis answers:
    //
    // "Which active users are within 5 km?"
    //
    // ==================================================

    const nearbyUsers =// array from redis of user ids of nearby users
      await getNearbyUsers({

        lat:
          location.lat,

        lng:
          location.lng,

        radiusInMeters:
          5000,

      });


    console.log(
      "Nearby active users:",
      nearbyUsers
    );


    // ==================================================
    // GET SOCKET.IO INSTANCE
    // ==================================================

    const io =
      req.app.get("io");


    // ==================================================
    // NOTIFY NEARBY USERS
    //
    // We deliberately do NOT use "helper" here.
    //
    // Every person is simply a user.
    // ==================================================

    if (io) {

      nearbyUsers.forEach( // send notification to each nearby user in array 
        (userId) => {

          // --------------------------------------------
          // Do not notify the creator about their own
          // emergency.
          // --------------------------------------------

          if (
            String(userId) ===
            String(creatorId)
          ) {
            return;
          }


          // --------------------------------------------
          // Send to that user's private Socket.IO room
          // --------------------------------------------

          io.to(
            `user:${userId}`
          ).emit(
            "NEW_EMERGENCY",
            {

              emergencyId:
                newEmergency._id,

              type:
                newEmergency.type,

              description:
                newEmergency.description,

              location:
                newEmergency.location,

              address:
                newEmergency.address,

              priority:
                newEmergency.priority,

              status:
                newEmergency.status,

            }
          );

        }
      );

    }


    // ==================================================
    // RETURN CREATED EMERGENCY
    // ==================================================

    return res.status(201).json({

      success: true,

      message:
        "Emergency created successfully",

      data:
        newEmergency,

    });


  } catch (error) {

    console.error(
      "Create emergency error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Internal server error",

      error:
        error.message,

    });

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

export async function updateEmergencyStatus (req, res) {

  try {

    const { id } = req.params;

    const { status } = req.body;


    // ----------------------------------
    // 1. Validate status
    // ----------------------------------

    const allowedStatuses = [
      "ON_THE_WAY",
      "ARRIVED",
      "RESOLVED",
    ];

    if (!allowedStatuses.includes(status)) {

      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });

    }


    // ----------------------------------
    // 2. Find emergency
    // ----------------------------------

    const emergencyaccepted =
      await emergency.findById(id);

    if (!emergencyaccepted) {

      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });

    }


    // ----------------------------------
    // 3. Check helper
    // ----------------------------------

    if (
      !emergencyaccepted.helper ||
      emergencyaccepted.helper.toString() !==
        req.user.id.toString()
    ) {

      return res.status(403).json({
        success: false,
        message:
          "You are not the assigned helper",
      });

    }


    // ----------------------------------
    // 4. Check status transition
    // ----------------------------------

    if (
      status === "ON_THE_WAY" &&
      emergencyaccepted.status !== "ASSIGNED"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Emergency must be ASSIGNED first",
      });

    }


    if (
      status === "ARRIVED" &&
      emergencyaccepted.status !== "ON_THE_WAY"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Helper must be ON_THE_WAY first",
      });

    }


    if (
      status === "RESOLVED" &&
      emergencyaccepted.status !== "ARRIVED"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Emergency must be ARRIVED first",
      });

    }


    // ----------------------------------
    // 5. Update status
    // ----------------------------------

    emergencyaccepted.status = status;


    // ----------------------------------
    // 6. Save timestamps
    // ----------------------------------

    if (status === "ARRIVED") {

      emergencyaccepted.arrivedAt =
        new Date();

    }


    if (status === "RESOLVED") {

      emergencyaccepted.resolvedAt =
        new Date();

    }


    await emergencyaccepted.save();


    // ----------------------------------
    // 7. Get Socket.IO
    // ----------------------------------
const io = req.app.get("io");// Import the io instance from server.js
  


    // ----------------------------------
    // 8. Notify requester
    // ----------------------------------

    if (io) {

      io.to(
        `user:${emergencyaccepted.createdBy}`
      ).emit(
        "EMERGENCY_STATUS_UPDATED",
        {
          emergencyId:
            emergencyaccepted._id,

          status:
            emergencyaccepted.status,
        }
      );

    }


    // ----------------------------------
    // 9. Send API response
    // ----------------------------------

    return res.status(200).json({

      success: true,

      message:
        "Emergency status updated",

      emergency: emergencyaccepted,

    });

  } catch (error) {

    console.error(
      "Status update error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to update emergency status",

    });

  }

};


