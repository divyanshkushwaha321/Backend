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
    
    // vslidate pagination
    const currentPage = Math.max(1, Number(page))
    const perPage = Math.min(100, Math.max(1, Number(limit)));

    if(!userId){
        throw new ApiError(400, "Invalid User ID")
    }

    // create filter
    const filter = {
        isPublished: true
    };

    if(userId){
        filter.owner = userId;
    }

    // Search by title or description
    if (!title || !description){
        throw new ApiError(400, "Video must contain title and description")
    }

    if(query){
        filter.$or = [
            {title: { $regex: query.trim(), $options:"i"} },
            {description:{ $regex: query.trim(), $options:"i" }}
        ]
    }

    // sorting
    const allowedSortFields = ["createdAt", "views", "title", "description"];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const sortOrder = sortType === "asc" ? 1 : -1;

    // Add _id as a secondary sort for consistent pagination
    const sortOptions = {
        [sortField]: sortOrder,
        _id: sortOrder
    };

    // pagination
    const skip = (currentPage - 1) * perPage;

    // 7. Fetch videos and total count
    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .select("__v")
            .populate("owner", "fullname username avatar")
            .sort(sortOptions)
            .skip(skip)
            .limit(perPage)
            .lean(),

        Video.countDocuments(filter)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalVideos / perPage);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    totalPages,
                    currentPage,
                    perPage,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            },
            "Videos fetched successfully"
        )
    );

})


const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title and Description are required.")
    }
    
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required.")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is required.")
    }

    let uploadedVideo;
    let uploadedThumbnail;

    try{
        // upload video to cloudinary
        uploadedVideo = await uploadOnCloudinary(videoLocalPath, "video");

        if(!uploadedVideo?.secure_url || !uploadedVideo?.duration){
            throw new ApiError(500, "Video upload failed")    
        }

        // upload thumbnail to cloudinart
        uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");
        
        if(!uploadedThumbnail?.secure_url){
            throw new ApiError(500, "Thumbnail upload failed")
        }

        // save document in mongodb
        const video = await Video.create({
            videoFile: uploadedVideo?.secure_url,
            thumbnail: uploadedThumbnail?.secure_url,
            title: title.trim(),
            description: description.trim(),
            duration: uploadedThumbnail?.duration,
            owner: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(201, video, "Video published successfully")
        )

    }
    catch(err){

        if (uploadedVideo?.public_id) {
            await cloudinary.uploader.destroy(
                uploadedVideo.public_id,
                { resource_type: "video" }
            );
        }

        if (uploadedThumbnail?.public_id) {
            await cloudinary.uploader.destroy(
                uploadedThumbnail.public_id,
                { resource_type: "image" }
            );
        }

        throw err;
    }
    
})


const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    //TODO: get video by id
    
    const video = await Video.findOne({
        _id: videoId,
        isPublished: true
    })
    .populate("owner", "fullname username avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Videos fetched successfully") 
    )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.bdy
    
    


    

    
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
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
    togglePublishStatus,
    publishAVideo
}