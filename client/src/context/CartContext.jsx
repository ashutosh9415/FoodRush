import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export const CartContext =
  createContext();

const CART_STORAGE_KEY =
  "foodrush_cart";

function CartProvider({
  children,
}) {
  const [cart, setCart] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            CART_STORAGE_KEY
          );

        return saved
          ? JSON.parse(saved)
          : [];
      } catch (error) {
        return [];
      }
    });

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (
    food
  ) => {
    setCart(
      (previousCart) => {
        const existing =
          previousCart.find(
            (item) =>
              item._id ===
              food._id
          );

        if (existing) {
          return previousCart.map(
            (item) =>
              item._id ===
              food._id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          );
        }

        return [
          ...previousCart,
          {
            ...food,
            quantity: 1,
          },
        ];
      }
    );
  };

  const removeFromCart =
    (foodId) => {
      setCart(
        (previousCart) =>
          previousCart.filter(
            (item) =>
              item._id !==
              foodId
          )
      );
    };

  const increaseQuantity =
    (foodId) => {
      setCart(
        (previousCart) =>
          previousCart.map(
            (item) =>
              item._id ===
              foodId
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          )
      );
    };

  const decreaseQuantity =
    (foodId) => {
      setCart(
        (previousCart) =>
          previousCart
            .map((item) =>
              item._id ===
              foodId
                ? {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  }
                : item
            )
            .filter(
              (item) =>
                item.quantity >
                0
            )
      );
    };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount =
    cart.reduce(
      (total, item) =>
        total +
        item.quantity,
      0
    );

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.price) *
          item.quantity,
      0
    );

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () =>
  useContext(CartContext);

export default CartProvider;