import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { cartService } from '../../services/cartService';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const [adding, setAdding] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation to product detail
        e.stopPropagation();

        try {
            setAdding(true);
            await cartService.addToCart(product.id, 1);
            // Dispatch event to update navbar cart count
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300 flex flex-col h-full group relative">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                    </span>
                    {product.isPrescriptionRequired && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rx Required
                        </span>
                    )}
                </div>
                <div className="mt-4">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-gray-900 truncate flex-1" title={product.name}>
                            <Link to={`/products/${product.id}`} className="hover:underline">
                                {product.name}
                            </Link>
                        </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{product.manufacturer}</p>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2" title={product.description}>
                        {product.description}
                    </p>
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-4 flex items-center justify-between mt-auto">
                <div className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleAddToCart}
                        disabled={adding || product.stockQuantity === 0}
                        className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white ${product.stockQuantity === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                            }`}
                        title="Add to Cart"
                    >
                        {adding ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <ShoppingCart className="h-5 w-5" />
                        )}
                    </button>
                    <Link
                        to={`/products/${product.id}`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
