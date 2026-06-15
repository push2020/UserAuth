import mongoose from "mongoose";

const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
  itemId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
  isVeg: {
    type: Boolean,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
});

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
    },
    gst: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    estimatedMinutes: {
      type: String,
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("orders", OrderSchema);

export default OrderModel;
