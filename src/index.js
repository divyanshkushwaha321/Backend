import mongoose from "mongoose";
import connectDB from "./db/index.js";
import "dotenv/config";
import { app } from "./app.js";

connectDB()           // asynchronous method always return a Promise.
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on PORT : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MongoDB connection failed! :",error);
})







// import express from 'express'
// const app = express();

// ( async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (err)=>{
//             console.log("Error: ",err);
//             throw err 
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`Running on Port: ${process.env.PORT}`);           
//         })
//     }
//     catch(err){
//         console.error("Error: ",err)
//     }
// } )()


