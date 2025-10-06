const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// [GET] /api/products
exports.getAllProducts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.categoryId) filter.categoryId = req.query.categoryId;
        if (req.query.sellerId) filter.sellerId = req.query.sellerId;

        const products = await Product.find(filter)
            .populate('categoryId', 'name')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [GET] /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'name')
            .populate('sellerId', 'firstName lastName');
        if (!product)
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [POST] /api/products
exports.createProduct = async (req, res) => {
    try {
        const {
            title,
            author,
            publisher,
            publicationYear,
            language,
            description,
            price,
            stock,
            discount,
            images,
            categoryId,
        } = req.body;

        const category = await Category.findById(categoryId);
        if (!category)
            return res.status(400).json({ message: 'Danh mục không hợp lệ' });

        const product = await Product.create({
            sellerId: req.user.profileId, // lấy từ token auth (người bán)
            categoryId,
            title,
            author,
            publisher,
            publicationYear,
            language,
            description,
            price,
            stock,
            discount,
            images,
        });

        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [PUT] /api/products/:id
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            }
        );
        if (!product)
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [DELETE] /api/products/:id
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product)
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json({ message: 'Đã xóa sản phẩm thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
