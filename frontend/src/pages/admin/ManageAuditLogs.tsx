import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

interface AuditLog {
    id: number;
    userEmail: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

interface AuditPage {
    content: AuditLog[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

const ENTITY_TYPES = ['AUTH', 'PRODUCT', 'ORDER', 'USER', 'CATEGORY', 'SUBCATEGORY'];

const ACTION_LABELS: Record<string, string> = {
    USER_LOGIN: 'Login',
    USER_LOGIN_FAILED: 'Login Failed',
    USER_LOGOUT: 'Logout',
    USER_REGISTERED: 'Registration',
    PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
    PASSWORD_RESET_COMPLETED: 'Password Reset Completed',
    PASSWORD_CHANGED: 'Password Changed',
    PRODUCT_CREATED: 'Product Created',
    PRODUCT_UPDATED: 'Product Updated',
    PRODUCT_DELETED: 'Product Deleted',
    PRODUCT_BULK_DELETED: 'Products Bulk Deleted',
    ORDER_PLACED: 'Order Placed',
    ORDER_CANCELLED: 'Order Cancelled',
    ORDER_STATUS_UPDATED: 'Order Status Updated',
    ORDERS_EXPORTED: 'Orders Exported',
    USER_ROLE_CHANGED: 'Role Changed',
    CATEGORY_CREATED: 'Category Created',
    CATEGORY_UPDATED: 'Category Updated',
    CATEGORY_DELETED: 'Category Deleted',
    SUBCATEGORY_CREATED: 'Subcategory Created',
    SUBCATEGORY_UPDATED: 'Subcategory Updated',
    SUBCATEGORY_DELETED: 'Subcategory Deleted',
};

const ACTION_COLOURS: Record<string, string> = {
    USER_LOGIN: 'bg-green-100 text-green-800',
    USER_LOGIN_FAILED: 'bg-red-100 text-red-800',
    USER_LOGOUT: 'bg-gray-100 text-gray-700',
    USER_REGISTERED: 'bg-blue-100 text-blue-800',
    PASSWORD_RESET_REQUESTED: 'bg-yellow-100 text-yellow-800',
    PASSWORD_RESET_COMPLETED: 'bg-yellow-100 text-yellow-800',
    PASSWORD_CHANGED: 'bg-yellow-100 text-yellow-800',
    PRODUCT_CREATED: 'bg-indigo-100 text-indigo-800',
    PRODUCT_UPDATED: 'bg-indigo-100 text-indigo-800',
    PRODUCT_DELETED: 'bg-red-100 text-red-800',
    PRODUCT_BULK_DELETED: 'bg-red-100 text-red-800',
    ORDER_PLACED: 'bg-green-100 text-green-800',
    ORDER_CANCELLED: 'bg-red-100 text-red-800',
    ORDER_STATUS_UPDATED: 'bg-blue-100 text-blue-800',
    ORDERS_EXPORTED: 'bg-purple-100 text-purple-800',
    USER_ROLE_CHANGED: 'bg-orange-100 text-orange-800',
    CATEGORY_CREATED: 'bg-teal-100 text-teal-800',
    CATEGORY_UPDATED: 'bg-teal-100 text-teal-800',
    CATEGORY_DELETED: 'bg-red-100 text-red-800',
    SUBCATEGORY_CREATED: 'bg-teal-100 text-teal-800',
    SUBCATEGORY_UPDATED: 'bg-teal-100 text-teal-800',
    SUBCATEGORY_DELETED: 'bg-red-100 text-red-800',
};

const ManageAuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    const [filterAction, setFilterAction] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterEntityType, setFilterEntityType] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    const fetchLogs = useCallback(async (page = 0) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), size: '20' });
            if (filterAction) params.append('action', filterAction);
            if (filterEmail.trim()) params.append('userEmail', filterEmail.trim());
            if (filterEntityType) params.append('entityType', filterEntityType);
            if (filterFrom) params.append('from', filterFrom);
            if (filterTo) params.append('to', filterTo);

            const res = await api.get<{ success: boolean; data: AuditPage }>(
                `/admin/audit-logs?${params}`
            );
            const data = res.data.data;
            setLogs(data.content);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
            setCurrentPage(data.number);
        } catch {
            setError('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [filterAction, filterEmail, filterEntityType, filterFrom, filterTo]);

    useEffect(() => {
        fetchLogs(0);
    }, [fetchLogs]);

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                    <p className="text-sm text-gray-500 mt-1">{totalElements} events recorded</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                        type="text"
                        placeholder="User email"
                        value={filterEmail}
                        onChange={e => setFilterEmail(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All actions</option>
                        {Object.entries(ACTION_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={filterEntityType}
                        onChange={e => setFilterEntityType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All entity types</option>
                        {ENTITY_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filterFrom}
                        onChange={e => setFilterFrom(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="date"
                        value={filterTo}
                        onChange={e => setFilterTo(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={() => fetchLogs(0)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Apply filters
                    </button>
                    <button
                        onClick={() => {
                            setFilterAction('');
                            setFilterEmail('');
                            setFilterEntityType('');
                            setFilterFrom('');
                            setFilterTo('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
                ) : error ? (
                    <div className="flex items-center justify-center h-48 text-red-500">{error}</div>
                ) : logs.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">No audit events found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 max-w-[160px] truncate" title={log.userEmail ?? ''}>
                                            {log.userEmail ?? <span className="text-gray-400 italic">anonymous</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOURS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {ACTION_LABELS[log.action] ?? log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                                            {log.entityType && (
                                                <span>
                                                    {log.entityType}
                                                    {log.entityId && <span className="text-gray-400"> #{log.entityId}</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate" title={log.details ?? ''}>
                                            {log.details}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {log.ipAddress}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-600">
                            Page {currentPage + 1} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchLogs(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => fetchLogs(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAuditLogs;
