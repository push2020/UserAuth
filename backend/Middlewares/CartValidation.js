import Joi from "joi";

export const addItemValidation = (req, res, next) => {
  const schema = Joi.object({
    item: Joi.object({
      name: Joi.string().required(),
      price: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      image: Joi.string().allow("", null),
      isVeg: Joi.boolean(),
      description: Joi.string().allow("", null),
    }).required(),
    category: Joi.string().required(),
    quantity: Joi.number().integer().min(1).default(1),
    restaurantId: Joi.string().allow("", null),
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

export const updateQuantityValidation = (req, res, next) => {
  const schema = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
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
