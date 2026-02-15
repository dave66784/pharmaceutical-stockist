import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { Product } from '../types';
import { authService } from '../services/authService';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const data = await productService.getProductById(productId);
      if (data && data.data) {
        setProduct(data.data);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!authService.getToken()) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      await cartService.addToCart(product.id, quantity);
      // Navigate to confirmation page with product details
      navigate('/added-to-cart', {
        state: {
          productName: product.name,
          quantity
        }
      });
    } catch (err) {
      console.error('Failed to add to cart', err);
      // Ideally handle specific error messages from API
      setError('Failed to add item to cart. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-red-800">{error || 'Product not found'}</h3>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-blue-600 hover:text-blue-500"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl leading-6 font-medium text-gray-900">{product.name}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{product.manufacturer}</p>
        </div>
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {product.category}
          </span>
          {product.isPrescriptionRequired && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Rx Required
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Price</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-xl font-bold">
              ${product.price.toFixed(2)}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {product.description}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Stock Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {product.stockQuantity > 0 ? (
                <span className="text-green-600 font-medium">{product.stockQuantity} In Stock</span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Quantity</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
              <button
                className="bg-gray-200 px-3 py-1 rounded-l hover:bg-gray-300"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={product.stockQuantity === 0}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(product.stockQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 text-center border-t border-b border-gray-200 py-1"
              />
              <button
                className="bg-gray-200 px-3 py-1 rounded-r hover:bg-gray-300"
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                disabled={product.stockQuantity === 0}
              >
                +
              </button>
            </dd>
          </div>
        </dl>
      </div>

      <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-end">
        <button
          onClick={() => navigate('/products')}
          className="mr-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={handleAddToCart}
          disabled={product.stockQuantity === 0 || addingToCart}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(product.stockQuantity === 0 || addingToCart) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
