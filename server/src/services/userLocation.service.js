import redis from "../config/redis.js";


// ======================================================
// REDIS GEO KEY
//
// Every active user's current location is stored here.
//
// Example:
//
// resq:users:locations
//
// user:123 -> longitude + latitude
// user:456 -> longitude + latitude
// ======================================================

const USER_LOCATION_KEY = "resq:users:locations";


// ======================================================
// ACTIVE USER KEY
//
// This tells us whether a user's location is still
// considered fresh.
//
// Example:
//
// resq:user:123:active
//
// The key expires automatically after 15 seconds.
// ======================================================

function getActiveKey(userId) {
  return `resq:user:${userId}:active`;
}


// ======================================================
// UPDATE USER LOCATION
//
// Called whenever a user sends a new GPS position.
//
// IMPORTANT:
// We store the current location in Redis only.
// We DO NOT update MongoDB for every GPS movement.
// ======================================================

export async function updateUserLocation({
  userId,
  lat,
  lng,
}) {

  // ----------------------------------------------------
  // Validate user ID
  // ----------------------------------------------------

  if (!userId) {
    throw new Error("userId is required");
  }


  // ----------------------------------------------------
  // Convert coordinates to numbers
  // ----------------------------------------------------

  const latitude = Number(lat);
  const longitude = Number(lng);


  // ----------------------------------------------------
  // Validate coordinates
  // ----------------------------------------------------

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error(
      "Latitude and longitude must be valid numbers"
    );
  }


  if (
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "Latitude must be between -90 and 90"
    );
  }


  if (
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Longitude must be between -180 and 180"
    );
  }


  // ====================================================
  // STORE USER'S CURRENT LOCATION IN REDIS GEO
  //
  // Redis expects:
  //
  // longitude
  // latitude
  // member
  //
  // ====================================================

  await redis.sendCommand([
    "GEOADD",
    USER_LOCATION_KEY,
    String(longitude),
    String(latitude),
    `user:${userId}`,
  ]);


  // ====================================================
  // MARK USER AS ACTIVE
  //
  // Every new location update refreshes this 15-second
  // expiration.
  //
  // If the user stops sending location updates, the
  // active key expires.
  // ====================================================

  await redis.set(
    getActiveKey(userId),
    "1",
    {
      EX: 15,
    }
  );


  return {
    userId,
    lat: latitude,
    lng: longitude,
  };
}


// ======================================================
// FIND ACTIVE USERS NEAR A LOCATION
//
// Used when a new emergency is created.
//
// Example:
//
// "Find users within 5 km of this emergency."
//
// ======================================================

export async function getNearbyUsers({
  lat,
  lng,
  radiusInMeters = 5000,
}) {

  const latitude = Number(lat);
  const longitude = Number(lng);
  const radius = Number(radiusInMeters);


  // ====================================================
  // VALIDATE INPUT
  // ====================================================

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(radius)
  ) {
    throw new Error(
      "Invalid location or radius"
    );
  }


  // ====================================================
  // REDIS GEOSEARCH
  //
  // Search the Redis geographic index.
  //
  // It returns user IDs located within the radius.
  // ====================================================

  const nearbyMembers =
    await redis.sendCommand([
      "GEOSEARCH",
      USER_LOCATION_KEY,

      "FROMLONLAT",

      String(longitude),
      String(latitude),

      "BYRADIUS",

      String(radius),

      "m",
    ]);


  // ====================================================
  // NO USERS FOUND
  // ====================================================

  if (!nearbyMembers.length) {
    return [];
  }


  // ====================================================
  // CHECK ACTIVE STATUS
  //
  // GEO entries may still exist after a user stops
  // sending location, so we separately check whether
  // each user has an active key.
  // ====================================================

  const activeKeys = nearbyMembers.map(
    (member) => {

      const userId =
        member.replace("user:", "");

      return getActiveKey(userId);
    }
  );


  const activeResults =
    await redis.mGet(activeKeys);


  // ====================================================
  // RETURN ONLY ACTIVE USERS
  // ====================================================

  const activeUsers = [];


  for (
    let i = 0;
    i < nearbyMembers.length;
    i++
  ) {

    if (activeResults[i] === "1") {

      activeUsers.push(
        nearbyMembers[i].replace(
          "user:",
          ""
        )
      );

    }
  }


  return activeUsers;
}


// ======================================================
// REMOVE USER LOCATION
//
// Called when you explicitly want to remove a user's
// temporary location.
//
// ======================================================

export async function removeUserLocation(userId) {

  if (!userId) return;


  // ----------------------------------------------------
  // Remove the user from Redis GEO index
  // ----------------------------------------------------

  await redis.sendCommand([
    "ZREM",
    USER_LOCATION_KEY,
    `user:${userId}`,
  ]);


  // ----------------------------------------------------
  // Remove active key
  // ----------------------------------------------------

  await redis.del(
    getActiveKey(userId)
  );
}