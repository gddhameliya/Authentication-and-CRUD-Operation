const { StatusCodes } = require("http-status-codes");
const Product = require("../model/Product");
const deleteImage = require("../service/deleteImage");
const uploadImage = require("../service/uploadImage");
const cloudinary = require("cloudinary").v2;

module.exports = {
  createProduct: async (req, res) => {
    const { name, description } = req.body;
    const { userId } = req.user;

    if (!name?.trim() || !description?.trim())
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "All fields are require." });

    if (!req.files)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Please upload Image." });

    const productInDb = await Product.findOne({ name });
    if (productInDb)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Product Already exist." });

    const fileUploadResult = await uploadImage(req.files.image, res);

    let product = await Product.create({
      name,
      description,
      userID: userId,
      image: fileUploadResult.secure_url,
    });

    product = await product.populate("userID");
    product.userID.password = undefined;
    return res.status(StatusCodes.OK).json({ product });
  },
  updateProducts: async (req, res) => {
    const { name, description } = req.body;
    const productId = req.params.id;
    const { userId } = req.user;

    if (!name?.trim() || !description?.trim())
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "All Fields are Require." });

    if (!req.files)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Please upload Image." });

    const productInDb = await Product.findOne({ name });
    if (productInDb)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Product Already exist." });

    try {
      const productInParams = await Product.findById(productId);
      if (!productInParams)
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Product not Found." });
    } catch (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Product Not Found." });
    }

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Product not Found." });

    if (product.userID.toString() !== userId)
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized access." });

    deleteImage(product.image);
    const fileUploadResult = await uploadImage(req.files.image, res);

    let updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        image: fileUploadResult.secure_url,
      },
      { new: true }
    );

    updatedProduct = await updatedProduct.populate("userID");
    updatedProduct.userID.password = undefined;

    res.status(StatusCodes.OK).json({ updatedProduct });
  },
  fetchProduct: async (req, res) => {
    const { userId } = req.query;
    const { productId } = req.query;

    try {
      if (userId && productId) {
        const product = await Product.findOne({
          _id: productId,
          userID: userId,
        }).populate("userID");

        if (!product)
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Product not Found.",
          });
        product.userID.password = undefined;
        return res.status(StatusCodes.OK).json({ product });
      }
    } catch (error) {}

    try {
      if (productId) {
        const product = await Product.findById(productId).populate("userID");
        if (!product)
          return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ error: "Product not Found." });

        product.userID.password = undefined;
        res.status(StatusCodes.OK).json({ product });
      } else {
        let products = [];
        if (userId)
          try {
            products = await Product.find({ userID: userId })
              .populate("userID")
              .sort("-createdAt -updatedAt");
          } catch (err) {}
        else
          products = await Product.find({})
            .populate("userID")
            .sort("-createdAt -updatedAt");
        products.forEach((prod) => (prod.userID.password = undefined));
        res.status(StatusCodes.OK).json({ products, count: products.length });
      }
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Not Found." });
    }
  },
  deleteProduct: async (req, res) => {
    const productId = req.params.id;
    const { userId } = req.user;

    try {
      const product = await Product.findById(productId);
      if (!product)
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Product not found." });

      if (product.userID.toString() !== userId)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Unauthorized access." });

      deleteImage(product.image);
      await product.remove();
    } catch (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Product not found." });
    }

    res.status(StatusCodes.OK).json({ message: "Product deleted." });
  },
};
