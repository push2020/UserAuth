import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
  itemId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  isVeg: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const CartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    restaurantId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Calculate total amount
CartSchema.virtual("totalAmount").get(function () {
  return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
});

CartSchema.set("toJSON", { virtuals: true });

const CartModel = mongoose.model("carts", CartSchema);

export default CartModel;
