import express from "express";
import { getMenu } from "../Controllers/MenuController.js";

const router = express.Router();

router.get("/", getMenu);

export default router;
