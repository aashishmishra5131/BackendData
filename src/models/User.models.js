import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const UserSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required'],
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})
//hooks middlewear.............
UserSchema.pre("save",async function(next){
    if(!this.isModified("password"))return next();

    this.password=bcrypt.hash(this.password,10)
    next()
})

UserSchema.method.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}
UserSchema.method.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id:this.id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPAIRY
        }
    )
 }
 UserSchema.method.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id:this.id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPAIRY
        }
    )
 }

export const User= mongoose.model("User",UserSchema);