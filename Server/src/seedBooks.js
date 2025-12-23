const mongoose = require('mongoose');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Book = require('./models/bookModel');
const Category = require('./models/categoryModel');

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Kết nối MongoDB thành công'))
    .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 🏪 Danh sách các seller test (thay bằng ID thực tế từ database của bạn)
const sellerIds = [
    '6909f5abdbb156c63fcea687', // Seller 1
    '6909fefc0e1f4c910a31b85b', // Seller 2
    '69299667414c82e138dda9bb', // Seller 3
];

// Lấy đường dẫn chính xác tới folder uploads/books
const imageDir = path.resolve(__dirname, '../uploads/books');
let allImages = [];

try {
    allImages = fs
        .readdirSync(imageDir)
        .filter((file) => file.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .sort()
        .map((file) => `/uploads/books/${file}`);
    console.log(`🖼️ Tìm thấy ${allImages.length} ảnh trong uploads/books.`);
} catch (err) {
    console.warn(
        `⚠️ Cảnh báo: Không thể đọc folder ${imageDir}`
    );
    console.warn(`   Lý do: ${err.message}`);
    console.warn('   💡 Hãy chạy: mkdir -p Server/uploads/books && thêm ảnh vào');
}

// 1️⃣ Category
const categoryNames = [
    'Văn học Việt Nam',
    'Văn học nước ngoài',
    'Kinh doanh - Tài chính',
    'Tâm lý - Kỹ năng sống',
    'Thiếu nhi',
    'Khoa học - Triết học',
    'Trinh thám - Hình sự',
    'Self-help',
    'Lịch sử - Văn hoá',
    'Công nghệ - Lập trình',
];

const generateCategories = () =>
    categoryNames.map((name) => ({
        name,
        description: `Thể loại ${name.toLowerCase()} được yêu thích.`,
        image: `https://source.unsplash.com/400x300/?book,${slugify(name, {
            lower: true,
        })}`,
        slug: slugify(name, { lower: true, strict: true }),
    }));

// 2️⃣ Tạo 13 quyển sách
const titles = [
    'Đắc Nhân Tâm',
    'Nhà Giả Kim',
    'Harry Potter và Hòn Đá Phù Thủy',
    'Sapiens: Lược Sử Loài Người',
    'Totto-chan: Cô Bé Bên Cửa Sổ',
    '7 Thói Quen Hiệu Quả',
    'Sherlock Holmes Toàn Tập',
    'Dạy Con Làm Giàu',
    'Deep Work',
    'Chúa Tể Những Chiếc Nhẫn',
    'Lập Trình Căn Bản',
    'Khởi Nghiệp Tinh Gọn',
    'Tư Duy Nhanh Và Chậm',
];

// 🎯 Hàm tìm ảnh phù hợp cho sách (với priority cao hơn)
const findImageForBook = (title, index) => {
    if (allImages.length === 0) {
        return null; // Không có ảnh
    }

    // Bước 1: Tìm ảnh có tên khớp chính xác (partial match)
    const titleSlug = slugify(title, { lower: true, strict: true });

    // Try multiple variations
    const matchPatterns = [
        titleSlug, // Exact slug
        titleSlug.split('-').slice(0, 2).join('-'), // First 2 words
        titleSlug.split('-')[0], // First word only
    ];

    for (const pattern of matchPatterns) {
        const matched = allImages.find(
            (img) => img.toLowerCase().includes(pattern) && !img.match(/^\d+\-/) // Skip auto-generated names (timestamps)
        );
        if (matched) {
            console.log(`✨ Tìm thấy ảnh tương ứng: ${title} → ${matched}`);
            return matched;
        }
    }

    // Bước 2: Nếu không tìm thấy, dùng ảnh từ folder (exclude timestamps)
    const namedImages = allImages.filter((img) => !img.match(/\/\d+\-/));
    if (namedImages.length > 0) {
        const imageIndex = index % namedImages.length;
        console.log(
            `📌 Sử dụng ảnh có sẵn: ${title} → ${namedImages[imageIndex]}`
        );
        return namedImages[imageIndex];
    }

    // Bước 3: Fallback - dùng tất cả ảnh (bao gồm auto-generated)
    const imageIndex = index % allImages.length;
    return allImages[imageIndex];
};

const sampleBooks = titles.map((title, index) => ({
    title,
    author: 'Nhiều tác giả',
    publisher: 'NXB Tổng hợp',
    publicationYear: 2018 + Math.floor(Math.random() * 7),
    price: 80000 + Math.floor(Math.random() * 150000),
    stock: 10 + Math.floor(Math.random() * 50),
    discount: Math.random() < 0.3 ? 10 : 0,
    numPages: 200 + Math.floor(Math.random() * 600),
    tags: ['sách', 'đọc', 'bán chạy'],
    images: allImages.length > 0 ? [findImageForBook(title, index)] : [],
}));

// 3️⃣ Seed
const seedBooks = async () => {
    try {
        await Category.deleteMany();
        await Book.deleteMany();
        console.log('🧹 Đã xóa toàn bộ dữ liệu cũ.');

        const categories = await Category.insertMany(generateCategories());
        console.log(`📚 Đã tạo ${categories.length} thể loại.`);

        // 📊 Distribute books across multiple sellers
        const booksWithCategory = sampleBooks.map((book, index) => {
            const randomCategory =
                categories[Math.floor(Math.random() * categories.length)];
            const assignedSellerId = sellerIds[index % sellerIds.length]; // Round-robin distribution

            return {
                ...book,
                sellerId: assignedSellerId,
                categoryId: randomCategory._id,
                slug: slugify(book.title, { lower: true, strict: true }),
            };
        });

        await Book.insertMany(booksWithCategory);
        console.log(
            `✅ Đã thêm ${booksWithCategory.length} sách mẫu vào database.`
        );

        // 📸 In ra chi tiết mapping sách ↔ ảnh
        console.log('\n📸 Chi tiết liên kết sách ↔ ảnh:');
        booksWithCategory.forEach((book, index) => {
            const imageDisplay =
                book.images.length > 0 ? book.images[0] : '❌ Không có ảnh';
            console.log(`  ${index + 1}. ${book.title}`);
            console.log(`     └─ 🖼️  ${imageDisplay}`);
        });

        // 📊 In ra thống kê phân phối sách theo seller
        console.log('\n📊 Thống kê phân phối sách theo seller:');
        sellerIds.forEach((sellerId, index) => {
            const booksForSeller = booksWithCategory.filter(
                (book) => book.sellerId === sellerId
            );
            console.log(
                `  ${index + 1}. Seller ${sellerId}: ${
                    booksForSeller.length
                } sách`
            );
        });

        // 📝 Hướng dẫn đặt tên ảnh
        console.log('\n📝 💡 Hướng dẫn để sử dụng ảnh tương ứng:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📁 Đặt ảnh vào thư mục: Server/uploads/books/');
        console.log('📌 Đặt tên ảnh khớp với tiêu đề sách (không dấu):');
        console.log('   Ví dụ: "Đắc Nhân Tâm" → "dac-nhan-tam.jpg"');
        console.log('          "Deep Work" → "deep-work.jpg"');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✨ Hoặc để tự động map tên file:');
        console.log('   Tên file: [order-number].[ext]');
        console.log(
            '   Ví dụ: 1.jpg, 2.jpg, 3.jpg ... (tương ứng thứ tự sách)'
        );
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err) {
        console.error('❌ Lỗi khi seed dữ liệu:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedBooks();
