import redis from "../config/redis.js";

const USER_LOCATION_KEY = "resq:users:locations";

function getActiveKey(userId) {
  return `resq:user:${userId}:active`;
}

// ======================================================
// UPDATE USER LOCATION
// ======================================================
export async function updateUserLocation({ userId, lat, lng }) {
  if (!userId) throw new Error("userId is required");

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude and longitude must be valid numbers");
  }

  if (latitude < -90 || latitude > 90) throw new Error("Latitude must be between -90 and 90");
  if (longitude < -180 || longitude > 180) throw new Error("Longitude must be between -180 and 180");

  // 🟢 IOREDIS FIX: Use native .geoadd() instead of sendCommand
  await redis.geoadd(
    USER_LOCATION_KEY, 
    longitude, 
    latitude, 
    `user:${userId}`
  );

  // 🟢 IOREDIS FIX: Use string "EX" instead of object { EX: 15 }
  await redis.set(getActiveKey(userId), "1", "EX", 15);

  return { userId, lat: latitude, lng: longitude };
}


// ======================================================
// FIND ACTIVE USERS NEAR A LOCATION
// ======================================================
export async function getNearbyUsers({ lat, lng, radiusInMeters = 5000 }) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const radius = Number(radiusInMeters);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radius)) {
    throw new Error("Invalid location or radius");
  }

  // 🟢 IOREDIS FIX: Use native .geosearch() instead of sendCommand
  const nearbyMembers = await redis.geosearch(
    USER_LOCATION_KEY,
    "FROMLONLAT",
    longitude,
    latitude,
    "BYRADIUS",
    radius,
    "m"
  );

  if (!nearbyMembers.length) {
    return [];
  }

  const activeKeys = nearbyMembers.map((member) => {
    const userId = member.replace("user:", "");
    return getActiveKey(userId);
  });

  // 🟢 IOREDIS FIX: Use lowercase .mget()
  const activeResults = await redis.mget(activeKeys);

  const activeUsers = [];

  for (let i = 0; i < nearbyMembers.length; i++) {
    if (activeResults[i] === "1") {
      activeUsers.push(nearbyMembers[i].replace("user:", ""));
    }
  }

  return activeUsers;
}


// ======================================================
// REMOVE USER LOCATION
// ======================================================
export async function removeUserLocation(userId) {
  if (!userId) return;

  // 🟢 IOREDIS FIX: Use native .zrem() instead of sendCommand
  await redis.zrem(USER_LOCATION_KEY, `user:${userId}`);

  await redis.del(getActiveKey(userId));
}