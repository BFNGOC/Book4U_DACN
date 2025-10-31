const Category = require('../models/categoryModel');
const fs = require('fs');
const path = require('path');

// [GET] /api/categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách danh mục thành công',
            data: categories,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [GET] /api/categories/:id
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Tham số id không được để trống.',
            });
        }

        const category = await Category.findById(id);
        if (!category)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục',
            });

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin danh mục thành công',
            data: category,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [POST] /api/categories
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục là bắt buộc',
            });
        }

        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục đã tồn tại',
            });
        }

        const imagePath = req.file
            ? `/uploads/categories/${req.file.filename}`
            : null;
        const category = await Category.create({
            name,
            description,
            image: imagePath,
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: category,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [PUT] /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Tham số id không được để trống.',
            });
        }

        const category = await Category.findById(id);
        if (!category)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục',
            });

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

        return res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: category,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [DELETE] /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Tham số id không được để trống.',
            });
        }

        const category = await Category.findByIdAndDelete(id);
        if (!category)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục',
            });

        if (category.image) {
            const imagePath = path.join(
                __dirname,
                '..',
                category.image.replace(/^\//, '')
            );
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa danh mục thành công',
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
