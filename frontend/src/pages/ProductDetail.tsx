import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { Product } from '../types';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingBundleToCart, setAddingBundleToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const { success, error: errorToast } = useToast();

  const handleAddToCart = async () => {
    if (!authService.getToken()) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      await cartService.addToCart(product.id, quantity);
      success(`Added ${quantity} ${product.name} to cart`);
      setAddingToCart(false); // Enable button again

    } catch (err) {
      console.error('Failed to add to cart', err);
      // Ideally handle specific error messages from API
      errorToast('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCartBundle = async () => {
    if (!authService.getToken()) {
      navigate('/login');
      return;
    }

    if (!product || !product.bundleBuyQuantity || !product.bundleFreeQuantity) return;

    const totalQty = product.bundleBuyQuantity + product.bundleFreeQuantity;

    try {
      setAddingBundleToCart(true);
      await cartService.addToCart(product.id, totalQty);
      success(`Added ${product.name} Bundle (${totalQty} units) to cart`);
    } catch (err) {
      console.error('Failed to add bundle to cart', err);
      errorToast('Failed to add bundle to cart. Please try again.');
    } finally {
      setAddingBundleToCart(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
          {/* Image Section */}
          <div className="bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[400px] lg:h-full relative">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <div className="w-full h-[300px] lg:h-[400px] flex items-center justify-center mb-4">
                  <img
                    src={`http://localhost:8080${product.imageUrls[selectedImageIndex]}`}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Error';
                    }}
                  />
                </div>
                {product.imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-2 w-full justify-center">
                    {product.imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`border-2 rounded-md overflow-hidden h-16 w-16 flex-shrink-0 transition-all ${selectedImageIndex === index ? 'border-primary-600 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <img
                          src={`http://localhost:8080${url}`}
                          alt={`${product.name} ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Error';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-9xl">💊</div>
            )}
            {product.isPrescriptionRequired && (
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-bold bg-white text-red-600 border border-red-100 shadow-sm">
                  Rx Prescription Required
                </span>
              </div>
            )}
            {product.stockQuantity === 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-lg font-bold uppercase tracking-wider shadow-lg">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-8 lg:p-12 flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                {product.category?.name || 'Unknown Category'}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-lg text-gray-500 mb-6">{product.manufacturer}</p>

            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
              <span className="ml-2 text-sm text-gray-500">per unit</span>
            </div>

            {product.isBundleOffer && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-green-800 font-bold text-lg">Special Bundle Offer!</h3>
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    Best Value
                  </span>
                </div>
                <p className="text-green-700 mb-4">
                  Buy <span className="font-bold underline">{product.bundleBuyQuantity} units</span> and get <span className="font-bold underline text-green-800">{product.bundleFreeQuantity} units FREE</span>!
                  Total <span className="font-bold">{product.bundleBuyQuantity! + product.bundleFreeQuantity!} items</span> for just <span className="font-bold text-xl text-green-900">${product.bundlePrice?.toFixed(2)}</span>
                </p>
                <button
                  onClick={handleAddToCartBundle}
                  disabled={product.stockQuantity < (product.bundleBuyQuantity! + product.bundleFreeQuantity!) || addingBundleToCart}
                  className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-lg text-white shadow-md transition-all duration-200 ${product.stockQuantity < (product.bundleBuyQuantity! + product.bundleFreeQuantity!)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/30'
                    }`}
                >
                  {addingBundleToCart ? 'Adding Bundle...' : `Add ${product.bundleBuyQuantity}+${product.bundleFreeQuantity} Bundle to Cart`}
                </button>
              </div>
            )}

            <div className="prose prose-sm text-gray-500 mb-8 border-t border-b border-gray-100 py-6">
              <h3 className="text-gray-900 font-semibold text-lg mb-2">Description</h3>
              <p className="leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <span className={`text-sm font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Out of stock'}
                </span>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                  <button
                    className="px-4 py-3 hover:bg-gray-100 text-gray-600 rounded-l-lg transition-colors disabled:opacity-50"
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
                    className="w-16 text-center bg-transparent border-none focus:ring-0 text-gray-900 font-medium p-0"
                  />
                  <button
                    className="px-4 py-3 hover:bg-gray-100 text-gray-600 rounded-r-lg transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={product.stockQuantity === 0}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0 || addingToCart}
                  className={`flex-1 flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white shadow-sm transition-all duration-200 ${product.stockQuantity === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30'
                    }`}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={() => navigate('/products')}
          className="text-gray-500 hover:text-gray-900 font-medium flex items-center transition-colors"
        >
          ← Back to Products
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
