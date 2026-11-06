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

        if (uploadedVideo?.public_id) {   // public_id is the unique identifier assigned to the uploaded file by Cloudinary.
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
    
    const { videoId } = req.params;
    const { title, description } = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id.")
    }
    //TODO: update video details like title, description, thumbnail
    
    const thumbnailLocalPath = req.file?.path;

    const updateFields = {};

    if(title !== undefined){
        if(typeof title !== "string" || !title.trim()){
            throw new ApiError(400, "Invalid Title");
        }
        updateFields.title = title.trim();
    }

    if(description !== undefined){
        if(typeof description !== "string" || !description.trim()){
            throw new ApiError(400, "Invalid Description");
        }
        updateFields.description = description.trim();
    }

    // Check if at least one field is provided
    if(!Object.keys(updateFields).length && !thumbnailLocalPath){
        throw new ApiError(400, "Atleast provide one field to update.")
    }
    
    let uploadedThumbnail;

    try{
        if(thumbnailLocalPath){

            uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");

            if (!uploadedThumbnail?.secure_url || !uploadedThumbnail?.public_id) {
                throw new ApiError(500, "Thumbnail upload failed");
            }

            updateFields.thumbnail = uploadedThumbnail.secure_url;
            updateFields.thumbNailPublicId = uploadedThumbnail.public_id;
        }
        // update video in mongodb
        const updatedVideo = await Video.findOneAndUpdate(
            {
                _id: videoId,
                owner: req.user._id
            },
            {$set: updateFields},
            {
                new:true,
                runValidators: true
            }
        );
        
        if(!updateVideo){
            throw new ApiError(404, "Video not found");
        }
        
         //  delete old thumbnail after successful update
        if (uploadedThumbnail && video.thumbnailPublicId) {
            try {
                await cloudinary.uploader.destroy(
                    video.thumbnailPublicId,
                    { resource_type: "image" }
                );
            } 
            catch (error) {
                console.error("Old thumbnail deletion failed:", error);
            }
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video updated successfully"
            )
        );

    }
    catch(err){
        // Delete newly uploaded thumbnail if database update fails
        if (uploadedThumbnail?.public_id) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedThumbnail.public_id, 
                    { resource_type: "image" }
                );
            } 
            catch (cleanupError) {
                console.error("Thumbnail cleanup failed:", cleanupError);
            }
        }
        throw err;
    }

})


const deleteVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    // find the video using videdId and owner of video
    const video = await Video.findOne({
        _id: videoId,
        owner: req.user._id
    })

    try{

        // delete the video from cloudinary
        if(video.videoPublicId){
            cloudinary.uploader.destroy(
                video.videoPublicId,
                { resource_type: "video" }
            )
        }
        // delete the thumbnail from cloudinary
        if(video.thumbNailPublicId){
            cloudinary.uploader.destroy(
                video.thumbNailPublicId,
                { resource_type: "image" }
            )
        }
    }
    catch(err){
        console.log("Cloudinary file deletion failed:", err)
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    );
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