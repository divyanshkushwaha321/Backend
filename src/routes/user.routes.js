import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken} from "../controllers/user.controller.js";
import {upload} from '../middleware/multer.middleware.js'
import { verifyJWT } from "../middleware/auth.middleware.js";


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

router.route("/login").post(loginUser)


// secured route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router