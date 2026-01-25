import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {user} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const generateAccessAndRefreshToken = (userId) => {
   try{

   }
   catch(error){

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

   if(!username || !email){
      throw new ApiError(400, "Email and password is required")
   }

   const user = await user.findOne({
      $or: [{username}, {email}]
   })

   if(!user){
      throw new ApiError(404, "User does not exist")
   }

   const isPasswordValid = await User.isPasswordCorrect(password)  // Password taken from Frontend

   if(!isPasswordValid){
      throw new ApiError(401, "Invalid User Credentials")
   }


})


export {registerUser, loginUser}