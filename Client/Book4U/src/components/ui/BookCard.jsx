import API_URL from '../../configs/api';

function BookCard({ images, title, author, rating, price, discount }) {
    const discountedPrice = price * (1 - discount / 100);

    return (
        <div className="bg-white shadow-md rounded-2xl p-4 hover:-translate-y-1 transition">
            <img
                src={`${API_URL}${images[0]}`}
                alt={title}
                className="h-48 w-full object-cover rounded-xl mb-3"
            />
            <h3 className="font-semibold line-clamp-1">{title}</h3>
            <p className="text-gray-500 text-sm mb-1">{author}</p>
            <div className="text-yellow-500 mb-2">⭐ {rating}</div>
            <div className="mb-2">
                <span className="text-blue-600 font-bold">
                    {discount > 0
                        ? `${discountedPrice.toLocaleString()}₫`
                        : `${price.toLocaleString()}₫`}
                </span>
                {discount > 0 && (
                    <span className="text-gray-400 line-through text-sm ml-2">
                        {price.toLocaleString()}₫
                    </span>
                )}
            </div>
            <button className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 w-full cursor-pointer">
                Thêm vào giỏ
            </button>
        </div>
    );
}

export default BookCard;
