import UserModel from "../Models/user.js";

export const getUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");
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
      errormessage: error,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      code: "500",
      message: "Internal server error. Please try again later.",
      errormessage: error,
    });
  }
};
