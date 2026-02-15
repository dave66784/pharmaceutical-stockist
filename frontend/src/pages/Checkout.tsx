import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../services/addressService';
import { Address } from '../types';
import { Plus } from 'lucide-react';

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
    const [shippingAddress, setShippingAddress] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await addressService.getAddresses();
                setSavedAddresses(response.data);

                // Pre-select default address if exists
                const defaultAddr = response.data.find(a => a.default);
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                } else if (response.data.length > 0) {
                    setSelectedAddressId(response.data[0].id);
                }
            } catch (err) {
                console.error('Failed to load addresses', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, []);

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
            setError('Shipping address is required');
            return;
        }

        navigate('/payment', { state: { shippingAddress: finalAddress } });
    };

    const formatAddress = (addr: Address) => {
        return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Checkout
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {savedAddresses.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Select a shipping address</h3>
                                <div className="space-y-3">
                                    {savedAddresses.map(addr => (
                                        <div
                                            key={addr.id}
                                            className={`relative border p-4 rounded-lg cursor-pointer ${selectedAddressId === addr.id
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedAddressId(addr.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="h-5 flex items-center">
                                                        <input
                                                            type="radio"
                                                            checked={selectedAddressId === addr.id}
                                                            onChange={() => setSelectedAddressId(addr.id)}
                                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <span className="block font-medium text-gray-900">
                                                            {addr.street}
                                                        </span>
                                                        <span className="block text-gray-500">
                                                            {addr.city}, {addr.state} {addr.zipCode}
                                                        </span>
                                                    </div>
                                                </div>
                                                {addr.default && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className={`relative border p-4 rounded-lg cursor-pointer ${selectedAddressId === 'new'
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedAddressId('new')}
                                    >
                                        <div className="flex items-center">
                                            <div className="h-5 flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={selectedAddressId === 'new'}
                                                    onChange={() => setSelectedAddressId('new')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                            </div>
                                            <div className="ml-3 flex items-center text-sm font-medium text-gray-700">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Use a new address
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedAddressId === 'new' && (
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                    Shipping Address
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="address"
                                        name="address"
                                        rows={4}
                                        required={selectedAddressId === 'new'}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        placeholder="Enter your complete shipping address"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Note: To save multiple addresses for future use, please go to <span className="text-blue-600 cursor-pointer" onClick={() => navigate('/account/addresses')}>My Addresses</span>.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Continue to Payment
                            </button>
                        </div>
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/cart')}
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Back to Cart
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
