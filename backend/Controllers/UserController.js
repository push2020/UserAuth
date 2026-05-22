import UserModel from "../Models/user.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const isAvatarUrl = (avatar) => typeof avatar === "string" && avatar.startsWith("http");

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ code: 404, message: "User not found. Please sign up first." });
    }

    const userObj = user.toObject();
    // Expose avatar: Cloudinary URL as-is, legacy buffer as API path
    if (user.avatar) {
      if (isAvatarUrl(user.avatar)) {
        userObj.avatar = user.avatar;
      } else if (user.avatar.data) {
        userObj.avatar = `api/user/avatar/${user._id}`;
      }
    } else {
      delete userObj.avatar;
    }

    return res.json({
      code: 200,
      message: "Resource retrieved successfully",
      data: userObj,
    });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) {
      try {
        const { url } = await uploadToCloudinary(req.file.buffer, "avatars");
        updates.avatar = url;
      } catch (err) {
        return res.status(500).json({
          code: 500,
          message: "Image upload failed. Please try again.",
          errormessage: err?.message || "Cloudinary upload error",
        });
      }
    }

    const updateUser = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updateUser) {
      return res
        .status(404)
        .json({ code: 404, message: "User not found. Please sign up first." });
    }

    const userObj = updateUser.toObject();
    if (updateUser.avatar) {
      userObj.avatar = isAvatarUrl(updateUser.avatar)
        ? updateUser.avatar
        : updateUser.avatar?.data
          ? `api/user/avatar/${updateUser._id}`
          : updateUser.avatar;
    }

    return res.json({
      code: 200,
      message: "User updated successfully",
      data: userObj,
    });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

export const getAvatar = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user || !user.avatar) {
      return res.status(404).send("No avatar found");
    }

    // Cloudinary URL: redirect to the image
    if (isAvatarUrl(user.avatar)) {
      return res.redirect(302, user.avatar);
    }

    // Legacy buffer storage
    if (user.avatar.data) {
      res.set("Content-Type", user.avatar.contentType);
      return res.send(user.avatar.data);
    }

    return res.status(404).send("No avatar found");
  } catch (e) {
    res.status(500).send("Error retrieving avatar");
  }
};
