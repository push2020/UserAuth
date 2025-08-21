import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import "./Models/db.js";
import AuthRouter from "./Routes/AuthRouter.js";
import UserRouter from "./Routes/UserRouter.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

var app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/auth", AuthRouter);
app.use("/api/user", UserRouter);

app.listen(PORT, () => {
  console.log(`listening port ${PORT}`);
});
