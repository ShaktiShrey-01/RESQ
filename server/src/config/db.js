import mongoose from "mongoose";
import dotenv from "dotenv";
import emergency from "../models/emergency.model.js"; 

dotenv.config();

async function connectdb(){
    try{
        // 🟢 THE FIX: Use MONGO_URI (matches docker-compose), fallback to localhost
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resq";
        
        await mongoose.connect(uri);
        console.log("MongoDB connected");
    }
    catch(err){ 
        console.log("ERROR:", err.message); 
    }
}

export default connectdb;