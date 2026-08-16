import {verifyJWT} from "../middlewares/verifyjwt.js";    
import { Router } from "express";
import { getemergency,updateEmergencyStatus,createEmergency  ,acceptEmergency} from "../controllers/emergency.controller.js";
const router = Router();

router.post("/create", verifyJWT,  createEmergency);
router.patch("/accept/:emergencyId", verifyJWT, acceptEmergency);
router.get("/:id", verifyJWT, getemergency);
router.patch(
  "/:id/status",
  verifyJWT,
  updateEmergencyStatus
);
export default router;