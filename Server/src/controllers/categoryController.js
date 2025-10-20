const Category = require('../models/categoryModel');
const fs = require('fs');
const path = require('path');
// [GET] /api/categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [GET] /api/categories/:id
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category)
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [POST] /api/categories
exports.createCategory = async (req, res) => {
    try {
        const { name, description, image } = req.body;
        const existing = await Category.findOne({ name });
        if (existing)
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        const imagePath = req.file
            ? `/uploads/categories/${req.file.filename}`
            : null;
        const category = await Category.create({
            name,
            description,
            image: imagePath,
        });
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [PUT] /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category)
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        if (req.file) {
            if (category.image) {
                const oldPath = path.join(
                    __dirname,
                    '..',
                    category.image.replace(/^\//, '')
                );
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            category.image = `/uploads/categories/${req.file.filename}`;
        }

        category.name = req.body.name ?? category.name;
        category.description = req.body.description ?? category.description;
        await category.save();

        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [DELETE] /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category)
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
