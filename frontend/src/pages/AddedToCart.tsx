import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { cartService } from '../services/cartService';
import { Cart } from '../types';
import { calculateItemTotal } from '../utils/pricing';

const AddedToCart: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);

    // Get product info from navigation state
    const { productName, quantity } = location.state || {
        productName: 'Product',
        quantity: 1
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await cartService.getCart();
            if (response.data) {
                setCart(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce((sum, item) => {
            return sum + calculateItemTotal(item.product, item.quantity);
        }, 0);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Success Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-3 mr-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Item Added to Cart!
                            </h1>
                            <p className="text-gray-600 mt-1">
                                <span className="font-medium text-gray-900">{quantity}x {productName}</span> has been added to your cart
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cart Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Cart Summary</h2>

                    {/* Cart Items */}
                    <div className="divide-y divide-gray-200">
                        {cart?.items && cart.items.length > 0 ? (
                            cart.items.map((item) => (
                                <div key={item.id} className="py-4 flex justify-between items-center">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{item.product.manufacturer}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Quantity: <span className="font-medium">{item.quantity}</span>
                                        </p>
                                    </div>
                                    <div className="ml-4 text-right">
                                        {calculateItemTotal(item.product, item.quantity) < item.product.price * item.quantity ? (
                                            <>
                                                <p className="text-xs text-gray-400 line-through">
                                                    ${(item.product.price * item.quantity).toFixed(2)}
                                                </p>
                                                <p className="text-sm font-medium text-green-600">
                                                    ${calculateItemTotal(item.product, item.quantity).toFixed(2)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">
                                                ${(item.product.price * item.quantity).toFixed(2)}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            ${item.product.price.toFixed(2)} each
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 py-4">Your cart is empty</p>
                        )}
                    </div>

                    {/* Total */}
                    {cart?.items && cart.items.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">Total</p>
                                    <p className="text-sm text-gray-500">
                                        {cart.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${calculateTotal().toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Continue Shopping
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </button>

                    <button
                        onClick={() => navigate('/cart')}
                        className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        View Cart & Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddedToCart;
