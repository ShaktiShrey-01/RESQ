import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

export async function createuser(req, res) {
  try {
    const { name, email, password, location, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, and password are required",
      });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.create({ name, email, password, location, role });
    const refreshtoken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    if (redis.status === "ready") {
      await redis.set(
        `refreshtoken:${user._id}`,
        refreshtoken,
        "EX",
        7 * 24 * 60 * 60
      );
    }

    res.cookie("refreshtoken", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const refreshtoken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    if (redis.status === "ready") {
      await redis.set(
        `refreshtoken:${user._id}`,
        refreshtoken,
        "EX",
        7 * 24 * 60 * 60
      );
    }

    res.cookie("refreshtoken", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function refreshtoken(req, res) {
  const oldrefreshtoken = req.cookies.refreshtoken;

  if (!oldrefreshtoken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  try {
    if (redis.status !== "ready") {
      return res.status(503).json({
        success: false,
        message: "Redis is not available",
      });
    }

    const decoded = jwt.verify(oldrefreshtoken, process.env.JWT_SECRET);
    const storedrefreshtoken = await redis.get(`refreshtoken:${decoded.id}`);

    if (storedrefreshtoken !== oldrefreshtoken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newrefreshtoken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await redis.set(
      `refreshtoken:${decoded.id}`,
      newrefreshtoken,
      "EX",
      7 * 24 * 60 * 60
    );

    res.cookie("refreshtoken", newrefreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const accessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
export async function logoutall(req, res) {
    try{
       const refreshtoken=req.cookies.refreshtoken;
       if(!refreshtoken){
        return res.status(401).json({
            success:false,
            message:"Refresh token not found"
        });
       }
       const decoded=jwt.verify(refreshtoken,process.env.JWT_SECRET);
       const keys=await redis.keys(`refreshtoken:${decoded.id}`);
       if(keys.length>0){
        await redis.del(keys);
       }
       res.clearCookie("refreshtoken");
       res.status(200).json({
        success:true,
        message:"Logged out from all devices"
       });
    }
    catch(err){
        res.status(500).json({success:false,message:err.message});
    }
}

export async function getme(req,res){
    try{
        const user=await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        res.status(200).json({
            success:true,
            user
        });     
    }
    catch(err){
        res.status(500).json({success:false,message:err.message});
    }
}