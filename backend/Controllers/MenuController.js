import MenuModel from "../Models/menu.js";

export const getMenu = async (req, res) => {
  try {
    const menuData = await MenuModel.findOne();
    if (!menuData) {
      return res.status(404).json({ code: 404, message: "Document Not Found" });
    }
    const menu = menuData.toObject();
    return res.json({
      code: 200,
      message: "Successfully Fetched",
      data: menu,
    });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};
