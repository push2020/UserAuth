import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

dotenv.config();

// Load Cloudinary config (must run after dotenv.config)
import "./config/Cloudnary.js";

import "./Models/db.js";
import AuthRouter from "./Routes/AuthRouter.js";
import UserRouter from "./Routes/UserRouter.js";
import ConfigRouter from "./Routes/ConfigRouter.js";
import MenuRouter from "./Routes/MenuRouter.js";
import CartRouter from "./Routes/CartRouter.js";

const PORT = process.env.PORT || 8080;

var app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/cart", CartRouter);
app.use("/api", ConfigRouter);
app.use("/menu", MenuRouter);

app.listen(PORT, () => {
  console.log(`listening port ${PORT}`);
});
