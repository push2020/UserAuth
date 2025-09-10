import ConfigModel from "../Models/config.js";

export const getConfig = async (req, res) => {
  try {
    const config = await ConfigModel.findOne();
    if (!config) {
      return res.status(404).json({ code: 404, message: "Document not found" });
    }

    return res.json({
      code: 200,
      message: "Document fetched successfully",
      data: config,
    });
  } catch (e) {
    return res.status(403).json({
      code: 403,
      message: "Internal server error",
      errormessage: e.message,
    });
  }
};
