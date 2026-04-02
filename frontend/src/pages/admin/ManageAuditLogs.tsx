import React, { useEffect, useState, useCallback } from 'react';
import { Shield, AlertTriangle, Activity, Clock, ChevronDown, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
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

const PAGE_SIZE = 20;

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
    PRODUCT_BULK_DELETED: 'Bulk Products Deleted',
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
    USER_LOGOUT: 'bg-gray-100 text-gray-600',
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

const SECURITY_ACTIONS = new Set([
    'USER_LOGIN_FAILED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED',
    'PASSWORD_CHANGED', 'USER_ROLE_CHANGED',
]);

const CRITICAL_ACTIONS = new Set([
    'PRODUCT_DELETED', 'PRODUCT_BULK_DELETED', 'CATEGORY_DELETED',
    'SUBCATEGORY_DELETED', 'ORDER_CANCELLED',
]);

function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatFull(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

// ── Stats card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    colour: string;
    onClick?: () => void;
    active?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colour, onClick, active }) => (
    <button
        onClick={onClick}
        className={`w-full text-left bg-white rounded-xl border-2 p-4 transition-all ${
            onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
        } ${active ? 'border-blue-500 shadow-md' : 'border-transparent shadow'}`}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
        </div>
    </button>
);

// ── Row expansion ─────────────────────────────────────────────────────────────

const ExpandedRow: React.FC<{ log: AuditLog }> = ({ log }) => (
    <tr className="bg-blue-50">
        <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Details</p>
                    <p className="text-gray-800">{log.details ?? <span className="italic text-gray-400">—</span>}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">IP Address</p>
                    <p className="font-mono text-gray-700">{log.ipAddress ?? '—'}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Exact Timestamp</p>
                    <p className="font-mono text-gray-700">{formatFull(log.createdAt)}</p>
                </div>
            </div>
        </td>
    </tr>
);

// ── Skeleton row ──────────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
    <tr className="animate-pulse">
        {[120, 160, 130, 80, 200, 80].map((w, i) => (
            <td key={i} className="px-4 py-3">
                <div className={`h-3 bg-gray-200 rounded`} style={{ width: w }} />
            </td>
        ))}
    </tr>
);

// ── Main component ────────────────────────────────────────────────────────────

const ManageAuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Stats (derived from first full fetch — unfiltered)
    const [todayCount, setTodayCount] = useState<number | null>(null);
    const [securityCount, setSecurityCount] = useState<number | null>(null);
    const [criticalCount, setCriticalCount] = useState<number | null>(null);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterEntityType, setFilterEntityType] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    // Quick-filter shortcut (from stat cards)
    const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'security' | 'critical'>('all');

    const hasActiveFilters = filterAction || filterEmail || filterEntityType || filterFrom || filterTo;

    const buildParams = useCallback((page: number) => {
        const p = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
        if (filterAction) p.append('action', filterAction);
        if (filterEmail.trim()) p.append('userEmail', filterEmail.trim());
        if (filterEntityType) p.append('entityType', filterEntityType);
        if (filterFrom) p.append('from', filterFrom);
        if (filterTo) p.append('to', filterTo);
        return p;
    }, [filterAction, filterEmail, filterEntityType, filterFrom, filterTo]);

    const fetchLogs = useCallback(async (page = 0) => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get<{ data: AuditPage }>(`/admin/audit-logs?${buildParams(page)}`);
            const data = res.data.data;
            setLogs(data.content);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
            setCurrentPage(data.number);
            setExpandedId(null);
        } catch {
            setError('Failed to load audit logs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    // Fetch unfiltered stats once on mount
    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        Promise.all([
            api.get<{ data: AuditPage }>(`/admin/audit-logs?page=0&size=1&from=${today}`),
            api.get<{ data: AuditPage }>(`/admin/audit-logs?page=0&size=1`),
        ]).then(([todayRes, allRes]) => {
            setTodayCount(todayRes.data.data.totalElements);
            // Count security / critical from current page sample (rough)
            const all = allRes.data.data;
            setSecurityCount(null); // will derive from full fetch below
            setCriticalCount(null);
            setTotalElements(all.totalElements);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        fetchLogs(0);
    }, [fetchLogs]);

    // Derive security/critical counts from current page (indicative)
    useEffect(() => {
        setSecurityCount(logs.filter(l => SECURITY_ACTIONS.has(l.action)).length);
        setCriticalCount(logs.filter(l => CRITICAL_ACTIONS.has(l.action)).length);
    }, [logs]);

    const applyQuickFilter = (type: typeof quickFilter) => {
        setQuickFilter(type);
        setFilterAction('');
        setFilterEmail('');
        setFilterEntityType('');
        setFilterFrom('');
        setFilterTo('');
        if (type === 'today') {
            const today = new Date().toISOString().slice(0, 10);
            setFilterFrom(today);
            setFilterTo(today);
        }
        // Note: for security/critical we'd need multiple actions — leave as visual hint only
    };

    const clearFilters = () => {
        setFilterAction('');
        setFilterEmail('');
        setFilterEntityType('');
        setFilterFrom('');
        setFilterTo('');
        setQuickFilter('all');
    };

    const from = currentPage * PAGE_SIZE + 1;
    const to = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

    // Visible page numbers (max 5 around current)
    const pageNumbers: number[] = [];
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) pageNumbers.push(i);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Complete event trail for compliance and security review
                    </p>
                </div>
                <button
                    onClick={() => fetchLogs(currentPage)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Events"
                    value={totalElements}
                    icon={<Activity className="w-5 h-5 text-blue-600" />}
                    colour="bg-blue-50"
                    onClick={() => applyQuickFilter('all')}
                    active={quickFilter === 'all'}
                />
                <StatCard
                    label="Today"
                    value={todayCount ?? '…'}
                    icon={<Clock className="w-5 h-5 text-green-600" />}
                    colour="bg-green-50"
                    onClick={() => applyQuickFilter('today')}
                    active={quickFilter === 'today'}
                />
                <StatCard
                    label="Security (this page)"
                    value={securityCount ?? '…'}
                    icon={<Shield className="w-5 h-5 text-yellow-600" />}
                    colour="bg-yellow-50"
                />
                <StatCard
                    label="Critical (this page)"
                    value={criticalCount ?? '…'}
                    icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                    colour="bg-red-50"
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">User email</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search email…"
                                value={filterEmail}
                                onChange={e => setFilterEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchLogs(0)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Action</label>
                        <select
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All actions</option>
                            <optgroup label="Auth">
                                {['USER_LOGIN','USER_LOGIN_FAILED','USER_LOGOUT','USER_REGISTERED',
                                  'PASSWORD_RESET_REQUESTED','PASSWORD_RESET_COMPLETED','PASSWORD_CHANGED'].map(a => (
                                    <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Products">
                                {['PRODUCT_CREATED','PRODUCT_UPDATED','PRODUCT_DELETED','PRODUCT_BULK_DELETED'].map(a => (
                                    <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Orders">
                                {['ORDER_PLACED','ORDER_CANCELLED','ORDER_STATUS_UPDATED','ORDERS_EXPORTED'].map(a => (
                                    <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Admin">
                                {['USER_ROLE_CHANGED','CATEGORY_CREATED','CATEGORY_UPDATED','CATEGORY_DELETED',
                                  'SUBCATEGORY_CREATED','SUBCATEGORY_UPDATED','SUBCATEGORY_DELETED'].map(a => (
                                    <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Entity type</label>
                        <select
                            value={filterEntityType}
                            onChange={e => setFilterEntityType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All types</option>
                            {ENTITY_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">From date</label>
                        <input
                            type="date"
                            value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">To date</label>
                        <input
                            type="date"
                            value={filterTo}
                            onChange={e => setFilterTo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <button
                        onClick={() => fetchLogs(0)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Apply
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" /> Clear filters
                        </button>
                    )}
                    {hasActiveFilters && (
                        <span className="text-xs text-blue-600 font-medium">Filters active</span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                {/* Table header info */}
                {!loading && !error && totalElements > 0 && (
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
                            <span className="font-medium text-gray-700">{totalElements}</span> events
                        </p>
                        <p className="text-xs text-gray-400">Click a row to expand details</p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-6 px-4 py-3" />
                                {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center text-red-500">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                        {error}
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-gray-400">No audit events found</p>
                                        {hasActiveFilters && (
                                            <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const expanded = expandedId === log.id;
                                    const isCritical = CRITICAL_ACTIONS.has(log.action);
                                    const isSecurity = SECURITY_ACTIONS.has(log.action) && log.action !== 'USER_LOGIN_FAILED';
                                    const isFailure = log.action === 'USER_LOGIN_FAILED';

                                    return (
                                        <React.Fragment key={log.id}>
                                            <tr
                                                onClick={() => setExpandedId(expanded ? null : log.id)}
                                                className={`cursor-pointer transition-colors ${
                                                    expanded ? 'bg-blue-50' :
                                                    isFailure ? 'bg-red-50 hover:bg-red-100' :
                                                    isCritical ? 'bg-orange-50 hover:bg-orange-100' :
                                                    'hover:bg-gray-50'
                                                }`}
                                            >
                                                <td className="px-4 py-3 text-gray-400">
                                                    {expanded
                                                        ? <ChevronDown className="w-3.5 h-3.5" />
                                                        : <ChevronRight className="w-3.5 h-3.5" />}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span
                                                        className="text-xs text-gray-600 cursor-help"
                                                        title={formatFull(log.createdAt)}
                                                    >
                                                        {timeAgo(log.createdAt)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 max-w-[160px]">
                                                    <span className="truncate block text-gray-800 text-xs" title={log.userEmail ?? ''}>
                                                        {log.userEmail ?? <span className="italic text-gray-400">anonymous</span>}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOURS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                                                        {isCritical && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                        {isSecurity && <Shield className="w-3 h-3 mr-1" />}
                                                        {ACTION_LABELS[log.action] ?? log.action}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                    {log.entityType && (
                                                        <>
                                                            {log.entityType}
                                                            {log.entityId && <span className="text-gray-400"> #{log.entityId}</span>}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 max-w-[260px]">
                                                    <span className="truncate block text-xs text-gray-600" title={log.details ?? ''}>
                                                        {log.details}
                                                    </span>
                                                </td>
                                            </tr>
                                            {expanded && <ExpandedRow log={log} />}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-sm text-gray-500">
                            Page {currentPage + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fetchLogs(0)}
                                disabled={currentPage === 0}
                                className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-white transition-colors"
                            >
                                «
                            </button>
                            <button
                                onClick={() => fetchLogs(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-white transition-colors"
                            >
                                ‹ Prev
                            </button>
                            {pageNumbers.map(n => (
                                <button
                                    key={n}
                                    onClick={() => fetchLogs(n)}
                                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                                        n === currentPage
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-gray-300 hover:bg-white'
                                    }`}
                                >
                                    {n + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => fetchLogs(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-white transition-colors"
                            >
                                Next ›
                            </button>
                            <button
                                onClick={() => fetchLogs(totalPages - 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-white transition-colors"
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAuditLogs;
