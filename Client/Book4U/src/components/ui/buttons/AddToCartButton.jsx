function AddToCartButton() {
    const handleAddToCart = () => {
        console.log('🛒 Đã thêm vào giỏ');
    };
    return (
        <button
            onClick={handleAddToCart}
            className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 w-full h-full cursor-pointer transition"
        >
            Thêm vào giỏ
        </button>
    );
}

export default AddToCartButton;
