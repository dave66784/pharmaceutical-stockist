import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { cartService } from '../services/cartService';
import { Cart, PaymentMethod } from '../types';
import { useToast } from '../hooks/useToast';
import { CreditCard, Truck, Check } from 'lucide-react';

const Payment: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { success, error: errorToast } = useToast();
    const state = location.state as { shippingAddress?: string; addressId?: number } | undefined;

    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | ''>('COD');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
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
                errorToast('Failed to load order details');
            } finally {
                setPageLoading(false);
            }
        };
        fetchCart();
    }, [errorToast]);

    const handlePlaceOrder = async () => {
        if (!selectedPayment) {
            errorToast('Please select a payment method');
            return;
        }

        if (!state.shippingAddress) {
            errorToast('Shipping address not found');
            return;
        }

        try {
            setLoading(true);
            const data = await orderService.createOrder(
                state.shippingAddress,
                selectedPayment,
                state.addressId
            );

            if (data && data.success && data.data) {
                success('Order placed successfully!');
                // Dispatch event to clear cart in UI
                window.dispatchEvent(new Event('cartUpdated'));
                navigate(`/orders/${data.data.id}`);
            }
        } catch (err: any) {
            console.error(err);
            errorToast(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!cart) return 0;
        const subtotal = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
        return subtotal > 50 ? subtotal : subtotal + 10; // Assuming $10 shipping if <= $50
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Steps Indicator */}
                <div className="mb-8">
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center justify-center space-x-8">
                            <li className="relative md:flex-1 md:flex">
                                <span className="group flex items-center">
                                    <span className="px-3 py-1 flex items-center text-sm font-medium">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-600 rounded-full">
                                            <Check className="w-5 h-5 text-white" />
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-900">Cart</span>
                                    </span>
                                </span>
                            </li>
                            <li className="relative md:flex-1 md:flex">
                                <span className="group flex items-center">
                                    <span className="px-3 py-1 flex items-center text-sm font-medium">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-600 rounded-full">
                                            <Check className="w-5 h-5 text-white" />
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-900">Shipping</span>
                                    </span>
                                </span>
                            </li>
                            <li className="relative md:flex-1 md:flex">
                                <div className="px-3 py-1 flex items-center text-sm font-medium" aria-current="step">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-primary-600 rounded-full">
                                        <span className="text-primary-600 font-bold">3</span>
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-primary-600">Payment</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Payment Method</h2>

                        <div className="space-y-4">
                            {/* Cash on Delivery */}
                            <div
                                onClick={() => setSelectedPayment('COD')}
                                className={`relative rounded-lg border p-4 cursor-pointer flex flex-col focus:outline-none transition-all ${selectedPayment === 'COD'
                                    ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Truck className={`h-6 w-6 ${selectedPayment === 'COD' ? 'text-primary-600' : 'text-gray-400'}`} />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-gray-900">
                                                Cash on Delivery
                                            </span>
                                            <span className="block text-sm text-gray-500">
                                                Pay when your order arrives
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedPayment === 'COD' ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                                        }`}>
                                        {selectedPayment === 'COD' && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                </div>
                            </div>

                            {/* Online Payment */}
                            <div
                                onClick={() => setSelectedPayment('ONLINE')}
                                className={`relative rounded-lg border p-4 cursor-pointer flex flex-col focus:outline-none transition-all ${selectedPayment === 'ONLINE'
                                    ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <CreditCard className={`h-6 w-6 ${selectedPayment === 'ONLINE' ? 'text-primary-600' : 'text-gray-400'}`} />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-gray-900">
                                                Online Payment
                                            </span>
                                            <span className="block text-sm text-gray-500">
                                                Credit/Debit Card, UPI, Net Banking
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedPayment === 'ONLINE' ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                                        }`}>
                                        {selectedPayment === 'ONLINE' && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            {state.shippingAddress && (
                                <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-md">
                                    <span className="text-sm font-medium text-gray-700">Shipping to:</span>
                                    <span className="text-sm text-gray-600 text-right max-w-xs truncate ml-2">
                                        {state.shippingAddress}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-6">
                                <span className="text-base font-medium text-gray-900">Total Amount</span>
                                <span className="text-xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</span>
                            </div>

                            <button
                                type="button"
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    `Place Order (${selectedPayment === 'COD' ? 'Cash on Delivery' : 'Pay Online'})`
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/checkout')}
                                className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Back to Shipping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
