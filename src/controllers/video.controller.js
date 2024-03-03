import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
     const pipeline=[];
     if(query){
        pipeline.push({
            $search:{
                index:"search-videos",
                text:{
                    query:query,
                    path:["title","description"]
                }
            }
        });
     }
     if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: userId  //different from source.
            }
        });
    }
    pipeline.push({$match:{isPublished:true}});
        //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if(sortBy&&sortType){
        pipeline.push({
            $sort:{
                [sortBy]:sortType==="asc"?1:-1
            }
        });
    }else{
        pipeline.push({$sort:{createdAt:-1}});
    }
    pipeline.push(
        {
            $lookup:{
                from:"users",
                localFiled:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                              username:1,
                              "avatar.url":1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"ownerDetails"
        }
    )
      const videoAggregate=Video.aggregate(pipeline);

      const option={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
      };
      const video=await Video.aggregatePaginate(videoAggregate,option);

      return res
      .status(200)
      .json(new ApiResponse(200,video,"Video fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required");
    }
    const videoFileLocalPath=req.files?.videoFile[0].path;
    const thumbnailLocalPath=req.files?.thumbnail[0].path;
    if(!videoFileLocalPath){
        throw new ApiError(400,"VideoFileLocalPath is required");
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required");
    }
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);
    if(!videoFile){
        throw new ApiError(400,"Video file not found");
    }
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail not found");
    }
    const video= await Video.create({
        title,
        description,
        duration:videoFile.duration,
        videoFile:{
            url:videoFile.url,
            public_id:videoFile.public_id,
        },
        thumbnail:{
            url:thumbnail.url,
            public_id:thumbnail.public_id
        },
        owner:req.User?._id,
        isPublished:false
    })
    const videoUploaded=await Video.findById(video._id);
    if(!videoUploaded){
        throw new ApiError(500,"VideoUpload failed try again");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video uploded successfully"))
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