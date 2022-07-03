const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

module.exports = async (productFile, res) => {
  console.log(productFile.mimetype.split("/"));
  if (!productFile.mimetype.startsWith("image"))
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Kindly upload image File." });

  const maxFileSize = 1024 * 1024;
  if (productFile.size > maxFileSize)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Image size shouldn't more than 1 MB" });

  const fileResult = await cloudinary.uploader.upload(
    productFile.tempFilePath,
    {
      use_filename: true,
      folder: "Product Images",
    }
  );

  fs.unlink(productFile.tempFilePath, () => {});
  return fileResult;
};
