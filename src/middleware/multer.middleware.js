import multer from "multer"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {  // file: uploaded file info, cb: callback
    cb(null, './public/temp')              // null: no error
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage })