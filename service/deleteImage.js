const cloudinary = require("cloudinary").v2;
const fs = require("fs");

module.exports = async (imageUrl) => {
  let imagePublicID = `Product Images${
    imageUrl.split("Product%20Images")[1].split(".")[0]
  }`;
  //   console.log(imagePublicID);
  cloudinary.uploader.destroy(imagePublicID);
};

// https://res.cloudinary.com/duudwmtvf/image/upload/v1656066698/Product%20Images/tmp-3-1656066695087_pe1fas.jpg
