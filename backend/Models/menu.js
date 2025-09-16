import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    restaurantId: { type: String },
    categories: [
      {
        name: { type: String, required: true },
        items: [
          {
            name: { type: String, required: true },
            price: { type: String, required: true },
            image: { type: String },
            isVeg: { type: Boolean },
            description: { type: String },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MenuModel = mongoose.model("menus", menuSchema);
export default MenuModel;
