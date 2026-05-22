import { v2 as cloudinary } from "cloudinary";

/**
 * Upload an image buffer to Cloudinary and return the secure URL.
 * @param {Buffer} buffer - Image file buffer from multer
 * @param {string} [folder="avatars"] - Cloudinary folder name
 * @param {object} [options] - Additional upload options (e.g. transformation)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = (buffer, folder = "avatars", options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("No URL returned from Cloudinary"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by public_id (optional, for avatar replacement).
 * @param {string} publicId - Cloudinary public_id
 */
export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};
