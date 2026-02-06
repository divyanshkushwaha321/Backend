import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {user} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    // Fetch videos from MongoDB based on filters, search, sorting, and pagination, using Aggregation Pipeline.
    const pageNumber = Number(page)   // converting into no beacause req.query values are strings
    const limitNumber = Number(limit)

    const matchStage = {
        isPublished: true
    }

    
    if(query){     // if query = "react", videos whose title OR description contains "react"
        matchStage.$or = [
            {title: {$regex: query, $options: "i"}},   // $regex is MongoDB’s way of doing pattern matching on strings
            {description: { $regex: query, $options: "i" }}  // "i" = case-insensitive, without "i" react" wouldn’t match "React"
        ]
    }
    
    if(userId && isValidObjectId(userId)){  // filter by userId
        matchStage.owner = new mongoose.Types.ObjectId(userId)  // new mongoose.Types.ObjectId(userId) - Converts string → ObjectId
    }
    
    
    const sortStage = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }


    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $sort: sortStage
        }
    ])
    
    const options = {
        page: pageNumber,
        limit: limitNumber
    }

    const videos = await Video.aggregatePaginate(aggregate, options)

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    console.log("req.body",req.body);
    
    const videofileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videofileLocalPath){
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFileUpload = await uploadOnCloudinary(videofileLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)


    if(!videoFileUpload || !thumbnailUpload){
        throw new ApiError(500, "Failed to upload on cloudinary")
    }

    const video = await Video.create({
      videoFile: videoFileUpload.url,
      thumbnail:thumbnailUpload.url,
      title,
      description,
      duration: videoFileUpload.duration,
      owner: req.user._id
    })

    console.log("video: ", video);

    const videoResponse = await Video.findById(video._id).select("-owner -__v")
    
    return res
    .status(201)
    .json(new ApiResponse(201, videoResponse, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}