import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({                         // app.use(cors): Applies the CORS middleware to all routes
    origin: process.env.CORS_ORIGIN,   // process.env.CORS_ORIGIN: Defines which frontend origin is allowed
    credentials: true                  // Allows sending credentials such as: Cookies, Authorization headers, Sessions
}))

app.use(express.json({limit:"30kb"}))  // limit to set data, earlier for this we have to install body-parser, now it is In-build.
app.use(express.urlencoded({extended: true, limit:"30kb"}))
app.use(express.static("public"))  // used to store data like images, pdf etc. in public folder.
app.use(cookieParser())

export {app}