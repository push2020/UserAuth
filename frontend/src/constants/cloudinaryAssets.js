/**
 * Use existing images already uploaded to your Cloudinary account.
 * Set these in frontend .env (see .env.example):
 * - VITE_CLOUDINARY_HERO_IMAGE  → Hero image URL from Cloudinary Media Library
 * - VITE_CLOUDINARY_LOGO       → Logo URL from Cloudinary Media Library
 * Leave unset to use local assets.
 */
export const cloudinaryAssets = {
  heroImage:
    import.meta.env.VITE_CLOUDINARY_HERO_IMAGE ||
    "/flavorful-tacos-with-guacamole-and-beer.webp",
  logo: import.meta.env.VITE_CLOUDINARY_LOGO || "/food_express.png",
};
