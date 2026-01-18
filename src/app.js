import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"30kb"}))  // limit to set data, earlier for this we have to install body-parser, now it is In-build
app.use(express.urlencoded({extended: true, limit:"30kb"}))
app.use(express.static("public"))

export {app}