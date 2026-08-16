import mongoose from "mongoose";
const userschema=mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    role:{type:String,enum:["user","helper"],default:"user"},
  location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      // [longitude, latitude] Note: MongoDB requires Longitude FIRST
      coordinates: {
        type: [Number],
      },
    },
    
   
},{timestamps:true})

userschema.index({ location: '2dsphere' });
const User=mongoose.model("User",userschema);
export default User;