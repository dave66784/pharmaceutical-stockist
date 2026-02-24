import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import ProductForm from '../../components/admin/ProductForm';

const ManageProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        show: boolean,
        type: 'single' | 'bulk',
        id?: number
    } | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await productService.getAllProducts(0, 100);
                if (data && data.data) {
                    setProducts(data.data.content);
                }
            } catch (err) {
                setError('Failed to load products');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleDelete = (id: number) => {
        setConfirmAction({ show: true, type: 'single', id });
    };

    const performDelete = async (id: number) => {
        console.log('Actually calling deleteProduct API for ID:', id);
        try {
            setDeleting(true);
            setUploadMessage(null); // Clear previous messages
            await productService.deleteProduct(id);
            console.log('Delete API success for ID:', id);
            setUploadMessage('Product deleted successfully.');
            // Refresh products after delete
            const data = await productService.getAllProducts(0, 100);
            if (data && data.data) {
                setProducts(data.data.content);
            }
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Delete API failed for ID:', id, err);
            setUploadMessage('Failed to delete product. It might be referenced by other records.');
        } finally {
            setDeleting(false);
            setConfirmAction(null);
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one product to delete');
            return;
        }
        setConfirmAction({ show: true, type: 'bulk' });
    };

    const performBulkDelete = async () => {
        console.log('Actually calling bulkDeleteProducts API for IDs:', Array.from(selectedIds));
        setDeleting(true);
        setUploadMessage(null);

        try {
            const result = await productService.bulkDeleteProducts(Array.from(selectedIds));
            if (result.success) {
                const { deletedCount, errorCount, errors } = result.data;
                let message = `Successfully deleted ${deletedCount} product(s).`;
                if (errorCount > 0) {
                    message = `Deleted ${deletedCount} product(s). Failed to delete ${errorCount}: ${errors.join(', ')}`;
                }
                setUploadMessage(message);

                // Refresh products
                const data = await productService.getAllProducts(0, 100);
                if (data && data.data) {
                    setProducts(data.data.content);
                }
                setSelectedIds(new Set());
            } else {
                setUploadMessage(`Bulk delete failed: ${result.message}`);
            }
        } catch (err) {
            console.error('Bulk delete failed:', err);
            setUploadMessage('Failed to delete products. Please check the network and try again.');
        } finally {
            setDeleting(false);
            setConfirmAction(null);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length && products.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleEdit = (product: Product) => {
        setUploadMessage(null);
        setSelectedProduct(product);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setUploadMessage(null);
        setSelectedProduct(undefined);
        setIsEditing(true);
    };

    const handleFormSuccess = async () => {
        setIsEditing(false);
        setUploadMessage('Product saved successfully.');
        try {
            const data = await productService.getAllProducts(0, 100);
            if (data && data.data) {
                setProducts(data.data.content);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/products/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const { successCount, errorCount, errors } = result.data;
                let message = `Successfully uploaded ${successCount} products.`;
                if (errorCount > 0) {
                    message += ` ${errorCount} errors: ${errors.join(', ')}`;
                }
                setUploadMessage(message);
                const data = await productService.getAllProducts(0, 100);
                if (data && data.data) {
                    setProducts(data.data.content);
                }
            } else {
                setUploadMessage(`Upload failed: ${result.message}`);
            }
        } catch (err) {
            setUploadMessage('Failed to upload file. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    if (isEditing) {
        return (
            <ProductForm
                product={selectedProduct}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    if (loading && products.length === 0) return <div>Loading products...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
                    <div className="flex gap-3">
                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
                            </button>
                        )}
                        <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {uploading ? 'Uploading...' : 'Upload Excel'}
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                            Add Product
                        </button>
                    </div>
                </div>
                {uploadMessage && (
                    <div className={`p-4 rounded-md ${uploadMessage.includes('Successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {uploadMessage}
                    </div>
                )}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === products.length && products.length > 0}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className={`${selectedIds.has(product.id) ? 'bg-blue-50' : ''} ${product.stockQuantity === 0 ? 'bg-red-50' :
                                    product.stockQuantity < 10 ? 'bg-yellow-50' : ''
                                    }`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(product.id)}
                                        onChange={() => toggleSelect(product.id)}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-sm font-semibold ${product.stockQuantity === 0 ? 'text-red-600' :
                                        product.stockQuantity < 10 ? 'text-yellow-600' :
                                            'text-gray-500'
                                        }`}>
                                        {product.stockQuantity}
                                        {product.stockQuantity === 0 && ' (Out of Stock)'}
                                        {product.stockQuantity > 0 && product.stockQuantity < 10 && ' (Low Stock)'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {product.expiryDate ? (() => {
                                        const today = new Date();
                                        const expiry = new Date(product.expiryDate);
                                        const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        const isExpired = daysUntilExpiry < 0;
                                        const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

                                        return (
                                            <span className={`font-medium ${isExpired ? 'text-red-600' :
                                                isExpiringSoon ? 'text-orange-600' :
                                                    'text-gray-700'
                                                }`}>
                                                {new Date(product.expiryDate).toLocaleDateString()}
                                                {isExpired && ' (Expired)'}
                                                {isExpiringSoon && ` (${daysUntilExpiry}d)`}
                                            </span>
                                        );
                                    })() : <span className="text-gray-400 italic">N/A</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        disabled={deleting}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {confirmAction.type === 'single'
                                                    ? 'Are you sure you want to delete this product? This action cannot be undone.'
                                                    : `Are you sure you want to delete ${selectedIds.size} products? This action cannot be undone.`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => confirmAction.type === 'single' ? performDelete(confirmAction.id!) : performBulkDelete()}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => setConfirmAction(null)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProducts;
