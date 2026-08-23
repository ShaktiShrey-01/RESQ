import { verifyJWT } from "../middlewares/verifyjwt.js";    
import { Router } from "express";
import { 
  cancelEmergency,
  getemergency,
  updateEmergencyStatus,
  createEmergency,
  acceptEmergency,
  getNearbyEmergencies,
  getUserHistory,dropEmergency// <-- Import this!
  
} from "../controllers/emergency.controller.js";
import emergency from '../models/emergency.model.js';
const router = Router();

// 🟢 THIS MUST BE AT THE TOP!
// Make sure this is placed ABOVE routes that use /:id, 
// otherwise Express will think "history" is an emergency ID!
router.get("/history", verifyJWT, getUserHistory);
router.get("/nearby", verifyJWT, getNearbyEmergencies); 

router.post("/", verifyJWT, createEmergency); // Notice I changed /create to /
router.post("/:emergencyId/accept", verifyJWT, acceptEmergency); // Notice I changed patch to post
router.get("/:id", verifyJWT, getemergency);
router.post("/:id/drop", verifyJWT, dropEmergency);
{/* When a helper accepts an emergency but suddenly cannot make it (e.g., flat tire), the dropEmergency function acts as a safety reset. Here is exactly what it does step-by-step:
Validates the User: It checks the database to ensure the person trying to drop the emergency is actually the assigned helper.
Resets the Database: It removes the helper's ID from the emergency record and changes the status from ASSIGNED back to SEARCHING.
Notifies the Requester: It sends a Socket.io message to the original creator, telling their screen to go back to the "Searching" loading state.
Triggers the Radar Again: It calculates the GPS coordinates of the emergency, finds all active users currently within a 5km radius, and emits the NEW_EMERGENCY socket event to their phones so someone else can accept it.
*/}
router.patch("/:id/status", verifyJWT, updateEmergencyStatus);
router.patch("/:id/cancel", verifyJWT, cancelEmergency);

// 🟢 TEMPORARY WIPE ROUTE
router.get("/wipe-ghosts", async (req, res) => {
  try {
    const result = await emergency.deleteMany({ status: "SEARCHING" });
    res.json({ message: "🧹 All ghost emergencies wiped!", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;