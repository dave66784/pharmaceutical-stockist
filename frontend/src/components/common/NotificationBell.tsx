import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';

const STATUS_ICONS: Record<string, string> = {
    PENDING: '🕐',
    CONFIRMED: '✅',
    SHIPPED: '📦',
    DELIVERED: '🏠',
    CANCELLED: '❌',
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    CONFIRMED: 'bg-blue-50 text-blue-700',
    SHIPPED: 'bg-indigo-50 text-indigo-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
};

const NotificationBell: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [open, setOpen] = useState(false);
    const [seen, setSeen] = useState<Set<number>>(loadSeen());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 60000); // refresh every 60s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await orderService.getUserOrders();
            if (res?.data) {
                // Show 5 most recent orders
                setOrders(res.data.slice(0, 5));
            }
        } catch {
            // silently fail — notifications are non-critical
        }
    };

    const unseenCount = orders.filter(o => !seen.has(o.id)).length;

    const handleOpen = () => {
        setOpen(prev => {
            if (!prev) {
                // Mark all current as seen
                const newSeen = new Set([...seen, ...orders.map(o => o.id)]);
                setSeen(newSeen);
                saveSeen(newSeen);
            }
            return !prev;
        });
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Notifications"
                id="notification-bell"
            >
                <Bell className="h-6 w-6 text-gray-600 hover:text-primary-600 transition-colors" />
                {unseenCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold ring-2 ring-white animate-pulse">
                        {unseenCount > 9 ? '9+' : unseenCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">Recent Orders</span>
                        <Link
                            to="/orders"
                            className="text-primary-100 hover:text-white text-xs transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            View all →
                        </Link>
                    </div>

                    {/* Notification items */}
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {orders.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                No orders yet
                            </div>
                        ) : (
                            orders.map(order => (
                                <Link
                                    key={order.id}
                                    to={`/orders/${order.id}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-start px-4 py-3 hover:bg-gray-50 transition-colors group"
                                >
                                    <span className="text-xl mr-3 mt-0.5">{STATUS_ICONS[order.status] ?? '🔔'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                                Order #{order.id}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            ${order.totalAmount.toFixed(2)} · {new Date(order.orderDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                        <Link
                            to="/orders"
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            View all orders
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

// Persist seen order IDs in localStorage
function loadSeen(): Set<number> {
    try {
        const stored = localStorage.getItem('notif_seen');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function saveSeen(seen: Set<number>) {
    try {
        localStorage.setItem('notif_seen', JSON.stringify([...seen]));
    } catch {
        // ignore
    }
}

export default NotificationBell;
