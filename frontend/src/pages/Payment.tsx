import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { cartService } from '../services/cartService';
import { Cart } from '../types';

const Payment: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { shippingAddress?: string; addressId?: number } | undefined;

    const [selectedPayment, setSelectedPayment] = useState<'COD' | ''>('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cart, setCart] = useState<Cart | null>(null);

    // Redirect to checkout if no shipping address
    if (!state?.shippingAddress) {
        return <Navigate to="/checkout" replace />;
    }

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await cartService.getCart();
                if (response.success && response.data) {
                    setCart(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch cart', err);
                setError('Failed to load order details');
            } finally {
                setPageLoading(false);
            }
        };
        fetchCart();
    }, []);

    const handlePlaceOrder = async () => {
        if (!selectedPayment) {
            setError('Please select a payment method');
            return;
        }

        if (!state.shippingAddress) {
            setError('Shipping address not found');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await orderService.createOrder(state.shippingAddress, state.addressId);
            if (data && data.success) {
                navigate('/order-confirmation', { state: { orderId: data.data?.id } });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!cart) return 0;
        return cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    if (pageLoading) {
        return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Payment Method
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Select your preferred payment method to complete the order
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Order Summary */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="text-lg font-medium text-blue-900 mb-2">Order Summary</h3>
                        <div className="flex justify-between items-center text-blue-800">
                            <span>Total Amount to Pay</span>
                            <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Shipping Address Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{state.shippingAddress}</p>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                            Edit Address
                        </button>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Select Payment Method</h3>

                        {/* Cash on Delivery Option */}
                        <div
                            onClick={() => setSelectedPayment('COD')}
                            className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${selectedPayment === 'COD'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={selectedPayment === 'COD'}
                                    onChange={() => setSelectedPayment('COD')}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-medium text-gray-900">
                                            Cash on Delivery
                                        </label>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Available
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Pay with cash when your order is delivered
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Placeholder for future payment methods */}
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 opacity-60 cursor-not-allowed">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    disabled
                                    className="h-4 w-4 text-gray-400 border-gray-300"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                        <label className="font-medium text-gray-500">
                                            Online Payment
                                        </label>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                            Coming Soon
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Credit/Debit Card, UPI, Net Banking
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || !selectedPayment}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading || !selectedPayment ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </div>
                            ) : (
                                `Pay $${calculateTotal().toFixed(2)}`
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/checkout')}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Back to Shipping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
