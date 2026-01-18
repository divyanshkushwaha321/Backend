import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectDB = async () => {
    try{
        const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST :${connectionInstance.connection.host}`);     
    }
    // connectionInstance.connection: Represents active MongoDB connection and contains metadata like host, port, name, state.
    // Tells which DB host is connected.
    // connectionInstance.connection.host: tells the hostname of the MongoDB server you are connected to.
    catch(error){
        console.log(`MongoDB connection error :${error}`);   
        process.exit(1)
    }
}
// process.exit(1): Global Node.js object and gives info/control over the current Node process. Immediately stops the Node.js application.
export default connectDB