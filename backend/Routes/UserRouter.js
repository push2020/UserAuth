import express from "express";
import {
  getUser,
  updateUser,
  getAvatar,
} from "../Controllers/UserController.js";
import {
  userAuthentication,
  userValidation,
} from "../Middlewares/UserValidation.js";
import upload from "../Middlewares/upload.js";

const router = express.Router();

router.get("/:id", userAuthentication, getUser);
router.put(
  "/update/:id",
  userValidation,
  userAuthentication,
  upload.single("avatar"),
  updateUser
);
router.get("/avatar/:id", getAvatar);

export default router;
