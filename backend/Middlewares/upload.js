import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/Cloudnary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "foodapp_uploads", //folder in cloudnary
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }], //optional resize
  },
});

const upload = multer({ storage });

export default upload;
