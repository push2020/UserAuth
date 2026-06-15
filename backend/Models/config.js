import mongoose from "mongoose";

const ConfigSchema = new mongoose.Schema(
  {
    banners: [{ image: String, link: String }],
    cuisines: [{ name: String, icon: String }],
    featuredRestaurants: [
      { name: String, rating: String, deliveryTime: String, image: String },
    ],
    offers: [
      { title: String, description: String, banner: String, link: String },
    ],
    faqs: [{ question: String, answer: String }],
    footerLinks: {
      about: [{ label: String, url: String }],
      help: [{ label: String, url: String }],
      policies: [{ label: String, url: String }],
    },
    settings: {
      support_email: String,
      support_phone: String,
      currency: String,
      language: String,
      app_version: String,
      delivery_fee: Number,
      free_delivery_minimum: Number,
      maintenance_mode: Number,
    },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
    },
  },
  { timestamps: true }
);

const ConfigModel = mongoose.model("configs", ConfigSchema);
export default ConfigModel;
