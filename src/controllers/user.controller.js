import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {user} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
   try{
      const User = await user.findById(userId) 
      const accessToken = User.generateAccessToken()
      // console.log("Access Token:", accessToken);
      const refreshToken = User.generateRefreshToken()
      // console.log("Refresh Token:", refreshToken);

      User.refreshToken = refreshToken   // Stores the refresh token in DB
      const refresh = await User.save({validateBeforeSave: false})   // Saves updated user document. validateBeforeSave: false means skip schema validations (password, required fields, etc.)
      // console.log("Refresh: ",refresh);
      
      return {accessToken, refreshToken}
   }

   catch(error){
      throw new (500, "Something went wrong while generating refresh and access token")
   }
}


const registerUser = asyncHandler (async (req, res) => {

   // get user details from frontend
   // validation - not empty
   // check if user already exists both username and email
   // take these from user: images, avatar.
   // Upload to cloudinary
   // create user object - create entry in DB
   // remove password and refresh token field from response
   // check for user creation
   // return res

   const{fullname, email, username, password} = req.body
   if(
      [fullname, email, username, password].some((field) => field?.trim() === "")  // validation
   ){
      throw new ApiError(400, "All fields are required")
   }

   const existedUser = await user.findOne({
      $or:[{ username },{ email }]
   })
   if(existedUser){
      throw new ApiError(409, "User with email or userName already exists")
   }
   
   const avatarLocalPath =  req.files?.avatar[0]?.path;
   // req.files - we can upload files through multer. 
   // .avatar[0]? - Accesses the first avatar file
   // .path - Local file path where Multer saved the file

   // const coverImageLocalPath =  req.files?.coverImage[0]?.path
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
   }
   
   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
      throw new ApiError(400, "Avatar file is required")
   }

   const User = await user.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await user.findById(User._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){  // user not created
      throw new ApiError(500, "Something went wrong while registering User.")
   }
   
   return res.status(201).json(
      new ApiResponse(201, createdUser, "User Registered Successfully")
   )
})


const loginUser = asyncHandler (async (req, res) => {
   // take the login(username or email) details from user
   // find the user
   // password check
   // access and refresh token
   // send cookie

   const {email, username, password} = req.body

   if(!username && !email){
      throw new ApiError(400, "Email and password is required")
   }

   const User = await user.findOne({
      $or: [{username}, {email}]
   })

   if(!User){
      throw new ApiError(404, "User does not exist")
   }

   const isPasswordValid = await User.isPasswordCorrect(password)  // Password taken from Frontend

   if(!isPasswordValid){
      throw new ApiError(401, "Invalid User Credentials")
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(User._id)

   const loggedInUser = await user.findById(User._id).select("-password -refreshToken")

   const options = {  // modified by server
      httpOnly: true,
      secure: true
   }

   return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
               User: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})


const logoutUser = asyncHandler( async(req, res) => {
   await user.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined  // Removing refresh token from DB
         }
      },
      {
         new: true  
      }    
   )

   const options = {
      httpOnly: true,
      secure: true
   }

   res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User Logged Out"))

})


// compare refresh token of frontend and backend , if it matches generate new token
const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken  // Taking token from frontend

  if(!incomingRefreshToken){
      throw new ApiError(401, "Unauthorized request")
  }

 try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const User = await user.findById(decodedToken?._id)
  
    if(!User){
      throw new ApiError(401, "Invalid Refresh Token")
    }
  
    if(incomingRefreshToken !== User?.refreshToken){
        throw new ApiError(401, "Refresh Token is expired or used")
    }
  
    const options = {
     httpOnly: true,
     secure: true
    }
  
     const {accessToken, newRefreshToken} = generateAccessAndRefreshToken(User._id)
  
    return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
        new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access Token refreshed")
     )
  
 } catch (error) {
   throw new ApiError(401, error?.message || "Invalid refresh Token")
 }

})


const currentChangePassword = asyncHandler(async (req, res) => {

   const {oldPassword, newPassword} = req.body

   const User = await user.findById(req.user?._id)
   const isPasswordCorrect = await User.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
      throw new ApiError(400, "Invalid old Password")
   }

   User.password = newPassword
   await User.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password changed successfully"))

} )



const getCurrentUser = asyncHandler(async (req, res) => {
   return res
   .status(200)
   .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async (req, res) => {

   const{fullname, email} = req.body

   if(!fullname || !email){
      throw new ApiError(400, "All fields are required")
   }

   const User = await user.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullname,
            email: email
         }
      },
      {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, User, "Account details updated successfully"))

} )


const updateUserAvatar = asyncHandler(async (req, res) => {

   const avatarlocalPath = req.file?.path

   if(!avatarlocalPath){
      throw new ApiError(400, "Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarlocalPath)

   if(!avatar.url){
      throw new ApiError(400, "Error while uploading on avatar")
   }

   const User = await user.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar: avatar.url
         }
      },
      {new: true}

   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, User, "Avatar uploaded successfully"))

} )


const updateUserCoverImage = asyncHandler(async (req, res) => {

   const coverImagelocalPath = req.file?.path

   if(!coverImagelocalPath){
      throw new ApiError(400, "Cover file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImagelocalPath)

   if(!coverImage.url){
      throw new ApiError(400, "Error while uploading on Cover image")
   }

   const User = await user.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage: coverImage.url
         }
      },
      {new: true}

   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, User, "Cover Image uploaded successfully"))

} )


const getUserChannelProfile = asyncHandler(async (req, res) => {

   const {username} = req.params

   if(!username?.trim()){
      throw new ApiError(400, "Username is missing")
   }

   const channel = await user.aggregate([
      {
         $match:{
            username: username?.toLowerCase()
         },
      },
      {
         $lookup: {                 // finding subscribers of a user
            from: "subscriptions",  // name of model in mongoDB
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         $lookup: {                 // finding the subscriber who subscribed the user
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         },
      },
      { 
         $addFields: {
            subscribersCount: {
               $size: "$subscribers"
            },
            channelSubscribedToCount: {
               $size: "$subscribedTo"
            }
         }   
      },
      {
         isSubscribed: {
            $cond: {
               if: {$in: [req.user?._id, "$subscribers.subscriber"]}, 
               then: true,
               else: false
            }
         }
      },
      {
         $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
         }
      }
   ])

   if(!channel?.length){     //.length - checks how many items are inside channel.
      throw new ApiError(404, "channel does not exist")
   }

   return res
   .status(200)
   .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
   )

})

export {
   registerUser, 
   loginUser, 
   logoutUser, 
   refreshAccessToken, 
   currentChangePassword, 
   getCurrentUser, 
   updateAccountDetails, 
   updateUserAvatar, 
   updateUserCoverImage,
   getUserChannelProfile
}