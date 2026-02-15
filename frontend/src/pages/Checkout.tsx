import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addressService } from '../services/addressService';
import { cartService } from '../services/cartService';
import { Address, Cart } from '../types';
import { Plus, Check, MapPin, Truck } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { error: errorToast } = useToast();
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
    const [shippingAddress, setShippingAddress] = useState('');
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [addressResponse, cartData] = await Promise.all([
                    addressService.getAddresses(),
                    cartService.getCart()
                ]);

                setSavedAddresses(addressResponse.data);
                setCart(cartData.data);

                // Pre-select default address if exists
                const defaultAddr = addressResponse.data.find(a => a.default);
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                } else if (addressResponse.data.length > 0) {
                    setSelectedAddressId(addressResponse.data[0].id);
                }
            } catch (err) {
                console.error('Failed to load data', err);
                errorToast('Failed to load checkout information');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [errorToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalAddress = shippingAddress;

        if (selectedAddressId !== 'new') {
            const selected = savedAddresses.find(a => a.id === selectedAddressId);
            if (selected) {
                finalAddress = formatAddress(selected);
                navigate('/payment', { state: { shippingAddress: finalAddress, addressId: selected.id } });
                return;
            }
        }

        if (!finalAddress.trim()) {
            errorToast('Shipping address is required');
            return;
        }

        navigate('/payment', { state: { shippingAddress: finalAddress } });
    };

    const formatAddress = (addr: Address) => {
        return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
    };

    const calculateTotal = () => {
        if (!cart) return 0;
        return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading checkout...</p>
            </div>
        </div>
    );

    const subtotal = calculateTotal();
    const shippingCost = subtotal > 50 ? 0 : 10;
    const total = subtotal + shippingCost;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Steps Indicator */}
                <div className="mb-8">
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center justify-center space-x-8">
                            <li className="relative md:flex-1 md:flex">
                                <Link to="/cart" className="group flex items-center">
                                    <span className="px-3 py-1 flex items-center text-sm font-medium">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-600 rounded-full group-hover:bg-primary-800 transition-colors">
                                            <Check className="w-5 h-5 text-white" />
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-900">Cart</span>
                                    </span>
                                </Link>
                                <div className="hidden md:block absolute top-0 right-0 h-full w-5" aria-hidden="true">
                                    <svg
                                        className="h-full w-full text-gray-300"
                                        viewBox="0 0 22 80"
                                        fill="none"
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            d="M0 -2L20 40L0 82"
                                            vectorEffect="non-scaling-stroke"
                                            stroke="currentcolor"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </li>

                            <li className="relative md:flex-1 md:flex">
                                <div className="px-3 py-1 flex items-center text-sm font-medium" aria-current="step">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-primary-600 rounded-full">
                                        <span className="text-primary-600 font-bold">2</span>
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-primary-600">Shipping</span>
                                </div>
                            </li>

                            <li className="relative md:flex-1 md:flex">
                                <span className="group flex items-center">
                                    <span className="px-3 py-1 flex items-center text-sm font-medium">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-full group-hover:border-gray-400">
                                            <span className="text-gray-500 group-hover:text-gray-900">3</span>
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">Payment</span>
                                    </span>
                                </span>
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                    {/* Left Column: Shipping Address */}
                    <div className="lg:col-span-7">
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                                    <MapPin className="mr-2 h-5 w-5 text-primary-600" />
                                    Shipping Information
                                </h2>

                                <form onSubmit={handleSubmit} noValidate>
                                    {savedAddresses.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Addresses</h3>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {savedAddresses.map(addr => (
                                                    <div
                                                        key={addr.id}
                                                        onClick={() => setSelectedAddressId(addr.id)}
                                                        className={`relative rounded-lg border p-4 cursor-pointer flex flex-col focus:outline-none transition-all ${selectedAddressId === addr.id
                                                            ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50'
                                                            : 'border-gray-300 bg-white hover:border-gray-400'
                                                            }`}
                                                    >
                                                        <span className="flex-1 flex flex-col">
                                                            <span className="block text-sm font-medium text-gray-900 mb-1">
                                                                {addr.street}
                                                            </span>
                                                            <span className="block text-sm text-gray-500">
                                                                {addr.city}, {addr.state} {addr.zipCode}
                                                            </span>
                                                            <span className="block text-sm text-gray-500 mt-1">
                                                                {addr.country}
                                                            </span>
                                                        </span>
                                                        {addr.default && (
                                                            <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                Default
                                                            </span>
                                                        )}
                                                        <div className={`absolute bottom-4 right-4 h-4 w-4 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                                                            }`}>
                                                            {selectedAddressId === addr.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                        </div>
                                                    </div>
                                                ))}

                                                <div
                                                    onClick={() => setSelectedAddressId('new')}
                                                    className={`relative rounded-lg border p-4 cursor-pointer flex flex-col focus:outline-none transition-all ${selectedAddressId === 'new'
                                                        ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50'
                                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                                        }`}
                                                >
                                                    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[100px] text-gray-500">
                                                        <Plus className="h-8 w-8 mb-2" />
                                                        <span className="text-sm font-medium">Use New Address</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedAddressId === 'new' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                                    Full Shipping Address
                                                </label>
                                                <div className="mt-1">
                                                    <textarea
                                                        id="address"
                                                        name="address"
                                                        rows={3}
                                                        required={selectedAddressId === 'new'}
                                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                        value={shippingAddress}
                                                        onChange={(e) => setShippingAddress(e.target.value)}
                                                        placeholder="Street address, City, State, Zip Code, Country"
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    We currently ship to US, Canada, and select international locations.
                                                </p>
                                            </div>
                                        </div>
                                    )}



                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            type="submit"
                                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                        >
                                            Continue to Payment
                                        </button>
                                        <div className="mt-4 text-center">
                                            <Link to="/cart" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                                Return to Cart
                                            </Link>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5 mt-8 lg:mt-0">
                        <div className="bg-white shadow sm:rounded-lg sticky top-24">
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                                    <Truck className="mr-2 h-5 w-5 text-primary-600" />
                                    Order Summary
                                </h2>

                                <ul role="list" className="divide-y divide-gray-200 mb-6 max-h-80 overflow-y-auto">
                                    {cart?.items.map((item) => (
                                        <li key={item.id} className="flex py-4">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-2xl">
                                                💊
                                            </div>
                                            <div className="ml-4 flex flex-1 flex-col">
                                                <div>
                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                        <h3 className="line-clamp-1 mr-2">{item.product.name}</h3>
                                                        <p className="ml-4">${(item.product.price * item.quantity).toFixed(2)}</p>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500">{item.product.manufacturer}</p>
                                                </div>
                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                    <p className="text-gray-500">Qty {item.quantity}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-gray-200 pt-4 space-y-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <p>Subtotal</p>
                                        <p>${subtotal.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <p>Shipping</p>
                                        <p>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</p>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-base font-medium text-gray-900">
                                        <p>Total</p>
                                        <p>${total.toFixed(2)}</p>
                                    </div>
                                </div>
                                {shippingCost === 0 && (
                                    <div className="mt-4 rounded-md bg-green-50 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-green-800">Free shipping applied</h3>
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>Your order qualifies for free shipping.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
