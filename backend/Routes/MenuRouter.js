import express from "express";
import { getMenu } from "../Controllers/MenuController.js";
import { MenuValidation } from "../Middlewares/MenuValidation.js";

const router = express.Router();

router.get("/", MenuValidation, getMenu);

export default router;
