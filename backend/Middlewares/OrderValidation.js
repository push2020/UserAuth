import Joi from "joi";

export const createOrderValidation = (req, res, next) => {
  const itemSchema = Joi.object({
    _id: Joi.string().allow("", null),
    itemId: Joi.string().allow("", null),
    name: Joi.string().required(),
    price: Joi.number().required(),
    quantity: Joi.number().integer().min(1).required(),
    image: Joi.string().allow("", null),
    category: Joi.string().allow("", null),
    isVeg: Joi.boolean().allow(null),
    description: Joi.string().allow("", null),
  });

  const schema = Joi.object({
    orderId: Joi.string().required(),
    items: Joi.array().items(itemSchema).min(1).required(),
    subtotal: Joi.number().required(),
    deliveryFee: Joi.number().required(),
    gst: Joi.number().required(),
    platformFee: Joi.number().required(),
    total: Joi.number().required(),
    address: Joi.string().required(),
    estimatedMinutes: Joi.string().allow("", null),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      code: 400,
      message: "Bad Request",
      errormessage: error.details[0].message,
    });
  }

  next();
};
