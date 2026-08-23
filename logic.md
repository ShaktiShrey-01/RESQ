# RESQ: Core Architecture & System Logic

This document outlines the core technical implementations, mathematical formulas, and architectural decisions behind the RESQ Emergency Response System.

---

## 1. Notification Flow & Anti-Spam Gatekeeper
**Problem:** Sending a notification on every GPS tick (every 2 seconds) freezes the user's device and ruins the UX.
**Solution:** A Milestone-Based Notification Tracker combined with a Native OS Bridge.

**The Flow:**
1. **Permission:** On load, React requests `Notification.requestPermission()`.
2. **Global Broadcast (Backend):** When an emergency is created, the Node.js server broadcasts a global `NEW_EMERGENCY` socket event. It *does not* do the heavy distance filtering itself to save server CPU.
3. **Frontend Gatekeeper (Math Validation):** The receiving client's React app calculates the exact distance using the Haversine formula. If `distance > 5km` or `creatorId === self`, it silently drops the event. If `< 5km`, it triggers a native OS Push Notification.
4. **Milestone Tracking (Live Tracking):** 
   - We store an array: `distanceMilestones.current = [2.0, 1.0, 0.5, 0.1]`.
   - As the responder's live GPS streams in, we compare the distance to `distanceMilestones[0]`.
   - If distance drops below the milestone (e.g., `< 2.0km`), we fire **one** push notification ("Responder is 2km away") and `.shift()` that milestone out of the array. This guarantees zero notification spam while keeping the user perfectly updated.

---

## 2. Live GPS Tracking & Map Rendering
**Problem:** Seamlessly rendering a moving responder and drawing the fastest road route between two dynamic points.

**The Flow:**
1. **Data Capture:** `navigator.geolocation.watchPosition` grabs the Responder's coordinates every 2-10 seconds.
2. **The Socket Relay:** The Helper emits `LOCATION_UPDATE` to the Node.js backend. The backend verifies their assignment and instantly relays `HELPER_LOCATION_UPDATED` directly to the Requester's private Socket room (`user:<id>`).
3. **Map Re-Rendering:** The frontend uses **Leaflet.js** and **React-Leaflet**. `MapUpdater` automatically calculates the bounding box (`L.latLngBounds`) to keep both the Requester and Responder perfectly centered on the screen.
4. **Dynamic Routing (OSRM):** Whenever the Responder's GPS changes, the app pings the Open Source Routing Machine (OSRM) API. It returns a GeoJSON array of road coordinates, which React-Leaflet renders as a `<Polyline>` (the blue dotted path).

---

## 3. Why We Use Redis (Caching & Speed)
In a live-tracking app, writing GPS coordinates to a MongoDB database every 2 seconds for thousands of users will cause massive database lag (I/O bottlenecks).

**How Redis solves this:**
- **In-Memory Speed:** Redis stores data in RAM, meaning reading/writing GPS coordinates takes less than a millisecond.
- **Geospatial Commands:** Redis has built-in commands like `GEOADD` and `GEOSEARCH`. This allows the backend to instantly query "Who is within a 5km radius of this point?" without scanning a massive database table.
- **Transient Data:** Live locations expire quickly. If a user closes the app, their location is useless after 5 minutes. Redis handles temporary state efficiently, leaving MongoDB solely for persistent, permanent records (User Profiles, Emergency History).

---

## 4. Spatial Mathematics: The Haversine Formula
**Interview Question:** *"Why not just use the Pythagorean theorem (a² + b² = c²) to find the distance between users?"*
**Answer:** Because the Earth is not flat; it is a sphere. 

To calculate the exact distance between two GPS coordinates, we use the **Haversine Formula**, which calculates the great-circle distance between two points on a spherical surface.

```javascript
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

5. MongoDB TTL Indexes (Ghost Data Cleanup)
Problem: If a user tests the app, creates a "SEARCHING" emergency, and closes their phone, that emergency stays in the database forever, cluttering everyone's radar.
Solution: MongoDB Time-To-Live (TTL) Indexes.
JavaScript
emergencySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7200, partialFilterExpression: { status: "SEARCHING" } }
);
How it works: We instructed the MongoDB engine to run a background thread. If an emergency has the status "SEARCHING" and is older than 7,200 seconds (2 hours), MongoDB automatically deletes the document. This ensures production databases never accumulate abandoned ghost data.