import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({

    subscriber:{          // The one who is subscribing
        type: Schema.Types.ObjectId,  
        ref: "user"
    },
    channel:{             // The one whom subscriber is subscribing 
        type: Schema.Types.ObjectId,
        ref: "user"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)