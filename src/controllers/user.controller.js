import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/User.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const genterateAccessAndRefereshToken= async(userId)=>{
  try{
    const user= await User.findById(userId)
   const accessToken= user.generateRefreshToken()
   const refereshToken= user.generateAccessToken()

   user.refereshToken=refereshToken
   await user.save({validateBeforeSave:false})

   return {accessToken,refereshToken}
  }
  catch(e){
    throw new ApiError(500,"Something went worng while generating referesh and access token")
  }
}

const registerUser =asyncHandler( async(req,res)=>{
      // res.status(200).json({
      //   message:"my server is ready for launching"
      // })

      // get user details from frontend
      // validation --- not empty
      // check if user is already exists: username, email
      // check for images, check for acatar
      // upload them cloudinary, check avatar
      // create user object- create entry in db
      // remove password and refresh token field from response
      //check for user creation
      // return response


     const {username, email, fullname, password}= req.body
     //console.log("email : ",email)
//we check all field using if condition but here we use some different apporch , i am using array with .some() method which is check all field using single line of code.

     if([fullname,email,username,password].some((field)=>
     field?.trim()==="")
     ){
      throw new ApiError(400,"Alll fields are required")
     }
     const existedUser=await User.findOne({
      $nor:[{username},{email}]
     })
     if(existedUser){
      throw new ApiError(409,"User with email or username already exists")
     }
    const avatarLocalPath= req.files?.avatar[0]?.path;
   // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required")
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length >0){
         coverImageLocalPath=req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

    if(!avatar){
      throw new ApiError(400,"Avatar file is required")
    }
   const user= await User.create({
      fullname,
      avatar:avatar.url,
      coverImage:coverImage?.url||"",
      email,
      password,
      username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
      "-password -refreshToken"
    )
    if(!createdUser){
      throw new ApiError(500,"Someting went wrong while registering the user")
    }

    return res.status(201).json(
      new ApiResponse(200,createdUser,"user registerd Successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
     //req body -data
     //username or email
     //password check
     //access and refersh token
     //send cookie

     const {email,username,password}=req.body
     if(!username||!email){
      throw new ApiError(400,"username or email is required")
     }

    const user= await User.findOne({
        $nor:[{username},{email}]
    })
    if(!user){
      throw new ApiResponse(404,"User doen't exist")
    }

  const isPasswordVaild=  await user.isPasswordCorrect(password)
  if(!isPasswordVaild){
    throw new ApiResponse(401,"Invaild user credentials")
  }
  
 const {accessToken,refereshToken}= await genterateAccessAndRefereshToken(user._id)

const loggedInUser= await User.findById().select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refereshToken",refereshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,accessToken,refereshToken
      },
      "User logged In SuccessFuly"
    )
  )
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refereshToken: undefined
        }
      },
      {
        new:true
      }
    )
    const options={
      httpOnly:true,
      secure:true
    }
    return res
  .status(200)
  .cookie("accessToken",options)
  .cookie("refereshToken",options)
  .json(
    new ApiResponse(
      200,
      {},
      "User logged out"
    )
  )
})


export {registerUser,loginUser,logoutuser};