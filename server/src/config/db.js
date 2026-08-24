import mongoose from "mongoose";
import dotenv from "dotenv";
// 🟢 IMPORT THE MODEL SO IT KNOWS WHAT TO DELETE!
// (Adjust the '../models' path if your connectdb file is in a different folder)
import emergency from "../models/emergency.model.js"; 

dotenv.config();

async function connectdb(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
        
        // 🟢 TEMPORARY WIPE COMMAND
       // const result = await emergency.deleteMany({ status: "SEARCHING" });
       // console.log(`🧹 Wiped ${result.deletedCount} old searching emergencies!`);
    }
    catch(err){ 
        // 🟢 CHANGED to err.message to show real errors!
        console.log("ERROR:", err.message); 
    }
}

export default connectdb;