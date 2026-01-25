import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localfilePath) => {
    try{
        if(!localfilePath) return null

        const response = await cloudinary.uploader.upload(  // upload file in cloudinary
           localfilePath, {
               resource_type: 'auto'
           }
        )
        console.log("File is uploaded on cloudinary: ", response.url);   // public url 
        return response;      
    }
    catch(error){
        fs.unlinkSync(localfilePath)   // remove the locally saved temporary file as the upload operation got failed. 
        return null
    }
}

export {uploadOnCloudinary}