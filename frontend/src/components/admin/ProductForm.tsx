import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { productService } from '../../services/productService';

interface ProductFormProps {
    product?: Product;
    onSuccess: () => void;
    onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        manufacturer: '',
        price: 0,
        stockQuantity: 0,
        category: 'OTHER' as ProductCategory,
        imageUrls: [] as string[],
        isPrescriptionRequired: false,
        expiryDate: '',
    });

    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                manufacturer: product.manufacturer || '',
                price: product.price,
                stockQuantity: product.stockQuantity,
                category: product.category,
                imageUrls: product.imageUrls || ((product as any).imageUrl ? [(product as any).imageUrl] : []),
                isPrescriptionRequired: product.isPrescriptionRequired,
                expiryDate: product.expiryDate || '',
            });
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadingImages(true);
            try {
                const filesArray = Array.from(e.target.files);
                const urls = await productService.uploadImages(filesArray);
                setFormData(prev => ({
                    ...prev,
                    imageUrls: [...(prev.imageUrls || []), ...(urls.data || [])]
                }));
            } catch (err) {
                console.error('Failed to upload images', err);
                setError('Failed to upload images');
            } finally {
                setUploadingImages(false);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (product) {
                await productService.updateProduct(product.id, formData);
            } else {
                await productService.createProduct(formData);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const categories: ProductCategory[] = [
        'PAIN_RELIEF', 'ANTIBIOTICS', 'VITAMINS', 'COLD_FLU',
        'DIGESTIVE', 'DIABETES', 'CARDIOVASCULAR', 'SKINCARE',
        'FIRST_AID', 'OTHER'
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {product ? 'Edit Product' : 'Add New Product'}
            </h3>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                        <input
                            type="text"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input
                            type="number"
                            name="price"
                            step="0.01"
                            required
                            min="0"
                            value={formData.price}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                        <input
                            type="number"
                            name="stockQuantity"
                            required
                            min="0"
                            value={formData.stockQuantity}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Images</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition-colors">
                            <div className="space-y-1 text-center">
                                {uploadingImages ? (
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                <span>Upload files</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*" />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                        {formData.imageUrls && formData.imageUrls.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {formData.imageUrls.map((url, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        <img src={`http://localhost:8080${url}`} alt={`Product ${index + 1}`} className="object-cover w-full h-full" onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                        }} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <input
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                        <p className="mt-1 text-xs text-gray-500">Leave blank if not applicable</p>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="isPrescriptionRequired"
                            name="isPrescriptionRequired"
                            type="checkbox"
                            checked={formData.isPrescriptionRequired}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPrescriptionRequired" className="ml-2 block text-sm text-gray-900">
                            Prescription Required
                        </label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
