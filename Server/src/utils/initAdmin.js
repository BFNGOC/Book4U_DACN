const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const {
    createProfileForRole,
} = require('../helpers/createProfileForRoleHelper');

async function initAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('ℹ️ Admin đã tồn tại, bỏ qua khởi tạo.');
            return;
        }

        const email = process.env.ADMIN_EMAIL || 'admin@book4u.com';
        const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const newAdmin = await User.create({
            email,
            password: hashedPassword,
            role: 'admin',
            isActive: true,
        });

        await createProfileForRole(newAdmin);

        console.log('✅ Admin mặc định đã được tạo.');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${rawPassword}`);
    } catch (err) {
        console.error('❌ Lỗi khởi tạo admin:', err.message);
    }
}

module.exports = initAdmin;
