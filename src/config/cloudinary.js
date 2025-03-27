import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = async (file, folder) => {
  const base64 = file.buffer.toString("base64");
  const format = file.mimetype.split("/")[1];

  return await cloudinary.uploader.upload(
    `data:image/${format};base64,${base64}`,
    {
      folder,
      transformation: [
        { width: 500, height: 5000, crop: "lpad", background: "white" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    }
  );
};

export const deleteImage = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};
