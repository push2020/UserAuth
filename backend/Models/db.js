import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongo_url = process.env.MONGODB_URL;

mongoose
  .connect(mongo_url)
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((error) => {
    console.log("DB connection failure", error);
  });
