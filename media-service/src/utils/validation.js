import Joi from "joi";

const validateMediaUpload = (data) => {
  const schema = Joi.object({
    originalname: Joi.string().max(255).required(),
    mimetype: Joi.string()
      .valid("image/jpeg", "image/png", "video/mp4")
      .required(),
    buffer: Joi.binary().required(),
  }).unknown(true); // <-- Allow extra fields

  return schema.validate(data);
};

export default validateMediaUpload;
