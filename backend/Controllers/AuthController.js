import UserModel from "../Models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      return res
        .status(409)
        .json({ status: 409, message: "User already exist.", success: false });
    }

    const userModel = new UserModel({ name, email, password });
    userModel.password = await bcrypt.hash(password, 10);
    await userModel.save();

    res
      .status(201)
      .json({ status: 200, message: "SignUp successfully.", success: true });
  } catch (e) {
    res
      .status(500)
      .json({ status: 500, message: "Internal server error.", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(403)
        .json({ status: 403, message: "User Not Found. Please SignUp." });
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      return res.status(403).json({ status: 403, message: "Wrong Password." });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      status: 200,
      message: "Login successful",
      jwtToken,
      email,
      name: user.name,
    });
  } catch (e) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};
