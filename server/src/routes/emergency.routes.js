import { verifyJWT } from "../middlewares/verifyjwt.js";    
import { Router } from "express";
import { 
  cancelEmergency,
  getemergency,
  updateEmergencyStatus,
  createEmergency,
  acceptEmergency,
  getNearbyEmergencies // <-- Import this!
  
} from "../controllers/emergency.controller.js";

const router = Router();

// 🟢 THIS MUST BE AT THE TOP!
router.get("/nearby", verifyJWT, getNearbyEmergencies); 

router.post("/", verifyJWT, createEmergency); // Notice I changed /create to /
router.post("/:emergencyId/accept", verifyJWT, acceptEmergency); // Notice I changed patch to post
router.get("/:id", verifyJWT, getemergency);
router.patch("/:id/status", verifyJWT, updateEmergencyStatus);
router.patch("/:id/cancel", verifyJWT, cancelEmergency);
export default router;