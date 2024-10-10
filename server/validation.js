const Joi = require("joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    //意思是：username 是 string ,最小長度 3 , 最大長度 50
    //必填
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(255).required(),
    //角色只能是 student , instructor
    role: Joi.string().required().valid("student", "instructor"),
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(255).required(),
  });

  return schema.validate(data);
};

const courseValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(6).max(50).required(),
    description: Joi.string().min(6).max(50).required(),
    price: Joi.number().min(10).max(9999).required(),
  });

  return schema.validate(data);
};

// module.exports.registerValidation = registerValidation;
// module.exports.loginValidation = loginValidation;
// module.exports.courseValidation = courseValidation;

module.exports = {
  registerValidation,
  loginValidation,
  courseValidation,
};
