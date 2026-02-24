import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { Cart as CartType } from '../types';
import { calculateItemTotal } from '../utils/pricing';

const Cart: React.FC = () => {
  const [cart, setCart] = useState<CartType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartService.getCart();
      if (data && data.data) {
        setCart(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await cartService.updateCartItem(itemId, newQuantity);
      fetchCart(); // Refresh cart to get updated state
    } catch (err) {
      console.error('Failed to update quantity', err);
      // specific error handling could be added here
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartService.removeFromCart(itemId);
      fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await cartService.clearCart();
        fetchCart();
      } catch (err) {
        console.error('Failed to clear cart', err);
      }
    }
  }

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      return total + calculateItemTotal(item.product, item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="text-red-700">{error}</div>
        <button onClick={fetchCart} className="mt-2 text-blue-600 hover:text-blue-500">Retry</button>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any products to your cart yet.</p>
        <Link to="/products" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <button onClick={handleClearCart} className="text-sm text-red-600 hover:text-red-800">Clear Cart</button>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {cart.items.map((item) => (
            <li key={item.id} className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0 h-20 w-20 border border-gray-200 rounded-md overflow-hidden">
                {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                  <img
                    src={`http://localhost:8080${item.product.imageUrls[0]}`}
                    alt={item.product.name}
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-2xl">💊</div>
                )}
              </div>
              <div className="flex-1 mb-4 sm:mb-0">
                <h3 className="text-lg font-medium text-blue-600">
                  <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                </h3>
                <p className="text-sm text-gray-500">{item.product.manufacturer}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">${item.product.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-l-md"
                    disabled={item.quantity <= 1}
                  >-</button>
                  <span className="px-3 py-1 text-gray-700 min-w-[2.5rem] text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-r-md"
                    disabled={item.quantity >= item.product.stockQuantity}
                  >+</button>
                </div>
                <div className="text-lg font-bold text-gray-900 w-24 text-right flex flex-col items-end">
                  {calculateItemTotal(item.product, item.quantity) < item.product.price * item.quantity ? (
                    <>
                      <span className="text-xs text-green-600 font-bold mb-1 bg-green-50 px-2 py-0.5 rounded">Bundle Applied</span>
                      <span className="text-xs text-gray-500 line-through">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <span className="text-primary-600">
                        ${calculateItemTotal(item.product, item.quantity).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-6">
          <span>Total</span>
          <span>${calculateTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-end">
          <Link to="/products" className="mr-4 text-blue-600 hover:text-blue-500 font-medium py-2 px-4">
            Continue Shopping
          </Link>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 shadow-md"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
