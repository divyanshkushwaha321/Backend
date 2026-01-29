import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {user} from "../models/user.models.js"


export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // req.cookies → contains cookies sent by the browser
        // accessToken → contain token
        // ?. (optional chaining) → cookies can have access token or cannot have access token
        console.log("Cookies: ", req.cookies); // request
        console.log("Token: ", token); 

        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) // Token can be verified(decoded) only with ACCESS_TOKEN_SECRET
    
        const User = await user.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!User){
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = User
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})