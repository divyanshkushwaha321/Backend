import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({                         // app.use(cors): Applies the CORS middleware to all routes
    origin: process.env.CORS_ORIGIN,   // process.env.CORS_ORIGIN: Defines which frontend origin is allowed
    credentials: true                  // Allows sending credentials such as: Cookies, Authorization headers, Sessions
}))

app.use(express.json({limit:"16kb"}))  // limit to set data, earlier for this we have to install body-parser, now it is In-build.
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))  // used to store data like images, pdf etc. in public folder.
app.use(cookieParser())



import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// Routes declaration
app.use("/api/users", userRouter)
app.use("/api/tweets", tweetRouter)
app.use("/api/subscriptions", subscriptionRouter)
app.use("/api/videos", videoRouter)
app.use("/api/comments", commentRouter)
app.use("/api/likes", likeRouter)
app.use("/api/playlist", playlistRouter)
app.use("/api/dashboard", dashboardRouter)


export {app}