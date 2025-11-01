import { Link } from 'react-router-dom';

const SellerStep4 = () => (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl text-center">
        <h2 className="text-xl font-semibold mb-3">Đăng ký thành công</h2>
        <p className="mb-6">
            Hồ sơ của bạn đang được xét duyệt. Chúng tôi sẽ thông báo kết quả
            qua email.
        </p>
        <Link
            to="/"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition">
            Về trang chính
        </Link>
    </div>
);
export default SellerStep4;
