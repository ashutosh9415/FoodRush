import { useCart } from "../context/CartContext";

function FoodCard({ food }) {
  const {
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const cartItem = cart.find(
    (item) => item._id === food._id
  );

  const quantity = cartItem
    ? cartItem.quantity
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">

      {/* Food Image */}
      <div className="w-full h-48 bg-gray-100 overflow-hidden">
        <img
          src={
            food.image?.startsWith("http")
              ? food.image
              : `http://localhost:5000${food.image}`
          }
          alt={food.name}
          className="w-full h-48 object-cover"
        />
      </div>

      {/* Food Details */}
      <div className="p-5">

        <div className="flex items-start justify-between gap-3">

          <h2 className="text-xl font-bold text-gray-800">
            {food.name}
          </h2>

          <span className="text-lg font-bold text-orange-500">
            ₹{food.price}
          </span>

        </div>

        <p className="text-sm text-gray-500 mt-2">
          {food.category}
        </p>

        <p className="text-gray-600 text-sm mt-3">
          {food.description}
        </p>

        <p className="text-sm text-gray-500 mt-3">
          🍽️ {food.restaurant}
        </p>

        {/* Add To Cart / Quantity Controls */}

        {quantity === 0 ? (
          <button
            onClick={() =>
              addToCart(food)
            }
            className="w-full mt-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
          >
            Add to Cart
          </button>
        ) : (
          <div className="w-full mt-5 flex items-center justify-between bg-orange-300 rounded-lg overflow-hidden">

            {/* Minus */}
            <button
              onClick={() =>
                decreaseQuantity(
                  food._id
                )
              }
              className="w-1/3 py-3 text-2xl font-bold text-white hover:bg-orange-400 transition"
            >
              −
            </button>

            {/* Quantity */}
            <span className="w-1/3 py-3 text-center text-lg font-bold text-black bg-white">
              {quantity}
            </span>

            {/* Plus */}
            <button
              onClick={() =>
                increaseQuantity(
                  food._id
                )
              }
              className="w-1/3 py-3 text-2xl font-bold text-white hover:bg-orange-400 transition"
            >
              +
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default FoodCard;