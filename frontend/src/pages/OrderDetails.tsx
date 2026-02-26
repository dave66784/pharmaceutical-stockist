import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { Truck, Package, CreditCard, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../config/env';

const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('OrderDetails mounted, id:', id);
        if (id) {
            fetchOrder(parseInt(id));
        }
    }, [id]);

    const fetchOrder = async (orderId: number) => {
        console.log('Fetching order:', orderId);
        try {
            setLoading(true);
            const data = await orderService.getOrderById(orderId);
            console.log('Order data received:', data);
            if (data && data.success && data.data) {
                console.log('Setting order state:', data.data);
                setOrder(data.data);
            } else {
                console.error('Order data invalid:', data);
                setError('Order not found');
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    console.log('Render state:', { loading, error, order: order ? 'present' : 'null' });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow sm:rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
                    <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
                    <Link to="/orders" className="text-primary-600 hover:text-primary-500 font-medium">
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Placed on {new Date(order.orderDate).toLocaleDateString()} at {new Date(order.orderDate).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={async () => {
                                try {
                                    const blob = await orderService.downloadReceipt(order.id);
                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `receipt_${order.id}.pdf`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                } catch (err) {
                                    console.error('Failed to download receipt', err);
                                    // You might want to add error handling/toast here
                                }
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Download Receipt
                        </button>
                        <Link to="/orders" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                            &larr; Back to Order History
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                    <Package className="mr-2 h-5 w-5 text-gray-400" />
                                    Order Items
                                </h3>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {order.orderItems.map((item) => (
                                    <li key={item.id} className="p-4 sm:p-6 flex items-center">
                                        <div className="flex-shrink-0 h-16 w-16 border border-gray-200 rounded-md overflow-hidden bg-gray-100">
                                            {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                                                <img
                                                    src={`${API_BASE_URL}${item.product.imageUrls[0]}`}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-3xl">💊</div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        Qty: {item.quantity}
                                                        {item.freeQuantity && item.freeQuantity > 0 ? (
                                                            <span className="ml-2 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">
                                                                (Includes {item.freeQuantity} Free)
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {(item.price * item.quantity).toFixed(2) !== item.subtotal.toFixed(2) ? (
                                                        <>
                                                            <p className="text-xs text-gray-500 line-through">
                                                                ${(item.price * item.quantity).toFixed(2)}
                                                            </p>
                                                            <p className="text-sm font-bold text-primary-600">
                                                                ${item.subtotal.toFixed(2)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-900">
                                                            ${item.subtotal.toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                    <p>Total Amount</p>
                                    <p>${order.totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Order Details */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Truck className="mr-2 h-5 w-5 text-gray-400" />
                                Order Status
                            </h3>
                            <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Order Status</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Payment Status</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${order.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                order.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Shipping Card */}
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <CreditCard className="mr-2 h-5 w-5 text-gray-400" />
                                Payment & Shipping
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Payment Method</h4>
                                    <p className="text-sm text-gray-600">
                                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                                    </p>
                                </div>
                                {order.transactionId && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-1">Transaction ID</h4>
                                        <p className="text-sm text-gray-600 font-mono">{order.transactionId}</p>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                                        <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                                        Shipping Address
                                    </h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;

