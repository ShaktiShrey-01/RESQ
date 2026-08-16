import { Router } from "express";
import { getme,createuser, login, refreshtoken,logoutall,sendSignupOTP } from "../controllers/user.controller.js";
import {verifyJWT} from "../middlewares/verifyjwt.js";    
import rateLimiter from "../middlewares/ratelimmiter.js";
const router = Router();

router.post("/signup", createuser);
router.post("/login",rateLimiter, login);
router.post("/refreshtoken", refreshtoken);
router.post("/logoutall", verifyJWT, logoutall);
router.get("/me", verifyJWT, getme);
router.post("/send-signup-otp", sendSignupOTP);
export default router;