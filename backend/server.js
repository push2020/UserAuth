// Must be the very first import so .env is loaded before any other module reads process.env.
import "dotenv/config";

import { createServer } from "http";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "./config/Cloudnary.js";
import "./Models/db.js";
import AuthRouter from "./Routes/AuthRouter.js";
import UserRouter from "./Routes/UserRouter.js";
import ConfigRouter from "./Routes/ConfigRouter.js";
import MenuRouter from "./Routes/MenuRouter.js";
import CartRouter from "./Routes/CartRouter.js";
import OrderRouter from "./Routes/OrderRouter.js";
import { initSocket } from "./socket.js";
import { reconcileStaleOrders } from "./Controllers/OrderController.js";

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/cart", CartRouter);
app.use("/api/orders", OrderRouter);
app.use("/api", ConfigRouter);
app.use("/menu", MenuRouter);

const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`listening port ${PORT}`);
  reconcileStaleOrders();
});
