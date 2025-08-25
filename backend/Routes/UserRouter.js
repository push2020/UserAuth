import express from "express";
import { getUser, updateUser } from "../Controllers/UserController.js";
import {
  userAuthentication,
  userValidation,
} from "../Middlewares/UserValidation.js";

const router = express.Router();

router.get("/:id", userAuthentication, getUser);
router.put("/update/:id", userValidation, userAuthentication, updateUser);

export default router;
