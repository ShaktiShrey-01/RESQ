import { Router } from "express";
import { getme,createuser, login, refreshtoken,logoutall } from "../controllers/user.controller.js";
import {verifyJWT} from "../middlewares/verifyjwt.js";    
import rateLimiter from "../middlewares/ratelimmiter.js";
const router = Router();

router.post("/create", createuser);
router.post("/login",rateLimiter, login);
router.post("/refreshtoken", refreshtoken);
router.post("/logoutall", verifyJWT, logoutall);
router.get("/me", verifyJWT, getme);
export default router;