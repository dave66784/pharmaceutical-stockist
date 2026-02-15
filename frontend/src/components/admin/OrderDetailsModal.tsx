import React from 'react';
import { Order } from '../../types';

interface OrderDetailsModalProps {
    order: Order | null;
    onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Order Details #{order.id}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Order Date</p>
                                    <p className="mt-1 text-sm text-gray-900">{new Date(order.orderDate).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="mt-1">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                                <p className="mt-1 text-sm text-gray-900">{order.shippingAddress}</p>
                            </div>

                            {/* Order Items */}
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Order Items</p>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {order.orderItems.map((item: any, index: number) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{item.product.name}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-500">${item.price.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-medium text-gray-900">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
