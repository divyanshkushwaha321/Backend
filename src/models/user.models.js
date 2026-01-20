import mongoose, { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            unique:true,
            lowercase: true,
            trim: true,
            index: true          // makes searching true
        },
        email:{
            type: String,
            required: true,
            unique:true,
            lowercase: true,
            trim: true,
        },
        fullname:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String,   // cloudinary
            required: true
        },
        coverImage:{
            type: String
        },
        watchHistory:{
            type: Schema.Types.ObjectId,
            ref:"Video"
        },
        password:{
            type: String,
            required: [true, "Password is Required"]
        },
        refreshToken:{
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", function(next){   // pre hook
    if(!this.isModified("password")) return next();  // if password is not modified then return next()

    this.password = bcrypt.hash(this.password, 10)   // if password is modified then encrypt the password and save the password.
    next()
})

// custom method
userSchema.methods.isPasswordCorrect = async function(password){  
    return await bcrypt.compare(password, this.password)   // checks the user passoword
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
} 
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
} 

export const user = model("User", userSchema)