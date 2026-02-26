import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Product } from '../../types';
import { cartService } from '../../services/cartService';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/env';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { success, error: errorToast } = useToast();
    const [adding, setAdding] = useState(false);
    const [addingBundle, setAddingBundle] = useState(false);
    const handleAddToCartBundle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.bundleBuyQuantity || !product.bundleFreeQuantity) return;

        const totalQty = product.bundleBuyQuantity + product.bundleFreeQuantity;

        try {
            setAddingBundle(true);
            await cartService.addToCart(product.id, totalQty);
            window.dispatchEvent(new Event('cartUpdated'));
            success(`Added ${product.name} Bundle (${totalQty} units) to cart`);
        } catch (err) {
            console.error('Failed to add bundle to cart:', err);
            errorToast('Failed to add bundle to cart');
        } finally {
            setAddingBundle(false);
        }
    };
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            setAdding(true);
            await cartService.addToCart(product.id, 1);
            window.dispatchEvent(new Event('cartUpdated'));
            success(`Added ${product.name} to cart`);
        } catch (err) {
            console.error('Failed to add to cart:', err);
            errorToast('Failed to add product to cart');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 overflow-hidden relative">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-100 relative group-hover:opacity-95 transition-opacity">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img
                        src={`${API_BASE_URL}${product.imageUrls[0]}`}
                        alt={product.name}
                        className="w-full h-48 object-cover object-center"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 text-4xl">
                        💊
                    </div>
                )}
                {product.stockQuantity === 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Out of Stock
                        </span>
                    </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {product.isPrescriptionRequired && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100 shadow-sm">
                            Rx Only
                        </span>
                    )}
                    {product.isBundleOffer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-green-50 text-green-600 border border-green-100 shadow-sm animate-pulse">
                            {product.bundleBuyQuantity}+{product.bundleFreeQuantity} Offer
                        </span>
                    )}
                </div>
            </div>

            <div className="p-5 flex-grow flex flex-col">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                        {product.category.name}
                    </span>
                    {product.subCategory && (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {product.subCategory.name}
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    <Link to={`/products/${product.id}`}>
                        {product.name}
                    </Link>
                </h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-1">{product.manufacturer}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                    {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Price</span>
                        <span className="text-xl font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {product.isBundleOffer && (
                            <button
                                onClick={handleAddToCartBundle}
                                disabled={addingBundle || product.stockQuantity < (product.bundleBuyQuantity! + product.bundleFreeQuantity!)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm whitespace-nowrap ${product.stockQuantity < (product.bundleBuyQuantity! + product.bundleFreeQuantity!)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/30'
                                    }`}
                                title={`Add ${product.bundleBuyQuantity}+${product.bundleFreeQuantity} Bundle`}
                            >
                                {addingBundle ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    `Add Bundle`
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleAddToCart}
                            disabled={adding || product.stockQuantity === 0}
                            className={`p-2.5 rounded-xl transition-all duration-200 shadow-sm ${product.stockQuantity === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white hover:shadow-primary-500/30'
                                }`}
                            title="Add to Cart"
                        >
                            {adding ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Plus className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
