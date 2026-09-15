import { memoryUpload, uploadBufferToCloudinary } from "../config/cloudinary.js";

// multer fields + Cloudinary upload for report images
export const uploadreport = (req, res, next) => {
  const multerStep = memoryUpload.fields([{ name: "image", maxCount: 1 }]);

  multerStep(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // No image attached - that's fine, proceed
    if (!req.files?.image?.[0]) return next();

    try {
      const file = req.files.image[0];
      const result = await uploadBufferToCloudinary(file.buffer, "snapfix/reports");
      // Overwrite path so controller can read req.files.image[0].path
      req.files.image[0].path = result.secure_url;
      next();
    } catch (uploadErr) {
      console.error("Cloudinary upload error:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "Image upload failed: " + uploadErr.message,
      });
    }
  });
};
