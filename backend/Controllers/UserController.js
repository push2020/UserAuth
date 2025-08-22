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
    return res.json({
      code: 200,
      message: "Resource retrieved successfully",
      data: user,
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
    const updateUser = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updateUser) {
      return res
        .status(404)
        .json({ code: 404, message: "User not found. Please sign up first." });
    }
    return res.json({
      code: 200,
      message: "User updated successfully",
      data: updateUser,
    });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};
