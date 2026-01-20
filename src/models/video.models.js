import mongoose, { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// mongoose-aggregate-paginate-v2 is used to add pagination support to MongoDB aggregation queries in Mongoose.

const videoSchema = new Schema(
    {
        videoFile:{
            type: String,
            required: true
        },
        thumbmail:{
            type: String,
            required: true
        },
        title:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
        duration:{          // from cloudinary
            type: Number,     
            required: true
        },
        views:{
            type: Number,
            default: 0
        },
        isPublished:{
            type: Boolean,
            default: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }
)

videoSchema.plugin(mongooseAggregatePaginate)
// .plugin(...) -  Mongoose method to extend schema functionality. Adds extra methods to the schema.
// mongooseAggregatePaginate - A plugin from mongoose-aggregate-paginate-v2. Adds aggregatePaginate() method

export const Video = model("Video", videoSchema)