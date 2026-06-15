import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    restaurantId: { type: String },
    /** Fallback when an item has no image. Use a Cloudinary URL from your media library. */
    defaultImage: { type: String },
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
