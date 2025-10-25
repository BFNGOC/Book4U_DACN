const mongoose = require('mongoose');
const slugify = require('slugify');
const fs = require('fs');
require('dotenv').config();

const Book = require('./models/bookModel');
const Category = require('./models/categoryModel');

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Kết nối MongoDB thành công'))
    .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

const sellerId = '68e3c1c6b1dc5225b35ed032'; // seller test có sẵn

// Lấy danh sách ảnh thật từ thư mục uploads/books
const imageDir = './uploads/books';
const allImages = fs
    .readdirSync(imageDir)
    .filter((file) => file.match(/\.(jpg|jpeg|png)$/))
    .map((file) => `/uploads/books/${file}`);

console.log(`🖼️ Tìm thấy ${allImages.length} ảnh trong uploads/books.`);

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
        image: `https://source.unsplash.com/400x300/?book,${slugify(name, { lower: true })}`,
        slug: slugify(name, { lower: true, strict: true }),
    }));

// 2️⃣ Tạo 30 quyển sách (10 gốc + 20 thêm)
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
    'Code Dạo Ký Sự',
    'Những Người Khốn Khổ',
    'Bố Già',
    'Hành Tinh Của Những Con Khỉ',
    'Nghệ Thuật Giao Tiếp',
    'Giết Con Chim Nhại',
    'Một Thoáng Ta Rực Rỡ Ở Nhân Gian',
    'Cà Phê Cùng Tony',
    'Đường Xưa Mây Trắng',
    'Tâm Lý Học Tội Phạm',
    'Chiến Binh Cầu Vồng',
    'Người Truyền Ký Ức',
    'Lập Trình Với Node.js',
    'React Toàn Tập',
    'Nguyên Tắc 80/20',
    'Đường Đến Thành Công',
    'Nghệ Thuật Lãnh Đạo',
];

const sampleBooks = titles.map((title) => ({
    title,
    author: 'Nhiều tác giả',
    publisher: 'NXB Tổng hợp',
    publicationYear: 2018 + Math.floor(Math.random() * 7),
    price: 80000 + Math.floor(Math.random() * 150000),
    stock: 10 + Math.floor(Math.random() * 50),
    discount: Math.random() < 0.3 ? 10 : 0,
    numPages: 200 + Math.floor(Math.random() * 600),
    tags: ['sách', 'đọc', 'bán chạy'],
    images: [allImages[Math.floor(Math.random() * allImages.length)]],
}));

// 3️⃣ Seed
const seedBooks = async () => {
    try {
        await Category.deleteMany();
        await Book.deleteMany();
        console.log('🧹 Đã xóa toàn bộ dữ liệu cũ.');

        const categories = await Category.insertMany(generateCategories());
        console.log(`📚 Đã tạo ${categories.length} thể loại.`);

        const booksWithCategory = sampleBooks.map((book) => {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            return {
                ...book,
                sellerId,
                categoryId: randomCategory._id,
                slug: slugify(book.title, { lower: true, strict: true }),
            };
        });

        await Book.insertMany(booksWithCategory);
        console.log(`✅ Đã thêm ${booksWithCategory.length} sách mẫu vào database.`);
    } catch (err) {
        console.error('❌ Lỗi khi seed dữ liệu:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedBooks();
