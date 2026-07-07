export const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a file",
    });
  }

  next();
};

export default validateFile;
