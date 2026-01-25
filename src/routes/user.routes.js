import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from '../middleware/multer.middleware.js'


const router = Router()

router.route("/register").post(   
    upload.fields([                 // upload.fields([...]) - tells Multer to expect multiple file fields.
        {
            name: "avatar",         // avatar and coverImage are files.
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

export default router