import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export async function sendSignupOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    // 1. Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Store OTP in Redis with a 5-minute (300 seconds) expiration
    if (redis.status === "ready") {
      await redis.set(`signup_otp:${email}`, otp, "EX", 300);
    } else {
      throw new Error("Redis is not connected");
    }

    // 3. Send the Email
    const mailOptions = {
      from: `"RESQ Emergency" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email for RESQ",
      text: `Your RESQ signup verification code is ${otp}. It expires in 5 minutes.`,
      html: `<h2>Your RESQ verification code is <strong>${otp}</strong>.</h2><p>It will expire in 5 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP email" });
  }
}


export async function createuser(req, res) {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, OTP, name, and password are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // 1. Fetch OTP from Redis
    const storedOtp = await redis.get(`signup_otp:${email}`);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP has expired or is invalid" });
    }

    if (storedOtp !== otp) {
      return res.status(401).json({ success: false, message: "Incorrect OTP" });
    }

    // 2. OTP is valid! Delete it from Redis so it can't be reused
    await redis.del(`signup_otp:${email}`);

    // 3. Hash the password before saving (Best Practice)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the User
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "user" 
    });

    // 5. Generate JWTs for automatic login after signup
    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await redis.set(`refreshtoken:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    res.cookie("refreshtoken", refreshToken, {
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
      message: "Account verified and created successfully",
      user: { _id: user._id, name: user.name, email: user.email },
      accessToken,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ success: false, message: "Failed to create account" });
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


// Add this to your existing controllers in user.controller.js

export async function sendForgotPasswordOTP(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // 1. Check if user actually exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    // 2. Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Store OTP in Redis (5-minute expiration)
    if (redis.status === "ready") {
      await redis.set(`reset_otp:${email}`, otp, "EX", 300);
    } else {
      throw new Error("Redis is not connected");
    }

    // 4. Send the Email
    const mailOptions = {
      from: `"RESQ Emergency" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your RESQ Password",
      text: `Your password reset code is ${otp}. It expires in 5 minutes.`,
      html: `<h2>Your password reset code is <strong>${otp}</strong>.</h2><p>It will expire in 5 minutes. If you didn't request this, ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Reset OTP sent successfully to your email",
    });
  } catch (err) {
    console.error("Forgot Password OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to send reset email" });
  }
}

export async function resetPasswordWithOTP(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // 1. Fetch OTP from Redis
    const storedOtp = await redis.get(`reset_otp:${email}`);
    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP has expired or is invalid" });
    }
    if (storedOtp !== otp) {
      return res.status(401).json({ success: false, message: "Incorrect OTP" });
    }

    // 2. OTP is valid! Delete it from Redis
    await redis.del(`reset_otp:${email}`);

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the user's password
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
}