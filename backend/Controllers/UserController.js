import UserModel from "../Models/user.js";

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
    delete userObj.avatar; // remove raw avatar buffer

    if (user.avatar && user.avatar.data) {
      userObj.avatar = `api/user/avatar/${user._id}`;
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

    // if avatar uploaded
    console.log("req.file", req.file);
    if (req.file) {
      updates.avatar = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
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

    // generate avatar URL if it exists
    const userObj = updateUser.toObject();
    if (updateUser.avatar && updateUser.avatar.data) {
      userObj.avatar = `api/user/avatar/${updateUser._id}`;
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
  const user = await UserModel.findById(req.params.id);
  try {
    if (!user || !user.avatar || !user.avatar.data) {
      return res.status(404).send("No avatar found");
    }

    res.set("Content-Type", user.avatar.contentType);
    res.send(user.avatar.data);
  } catch (e) {
    res.status(500).send("Error retrieving avatar");
  }
};
