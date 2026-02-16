import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { addressService } from '../services/addressService';
import { Address } from '../types';

const AddressManagement: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await addressService.getAddresses();
            // Handle ApiResponse structure (response.data is the ApiResponse object, response.data.data is the list)
            const apiResponse = response.data as any;
            if (apiResponse.success && Array.isArray(apiResponse.data)) {
                setAddresses(apiResponse.data);
            } else if (Array.isArray(apiResponse)) {
                setAddresses(apiResponse);
            } else {
                setAddresses([]);
            }
        } catch (err) {
            setError('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (currentAddress.id) {
                await addressService.updateAddress(currentAddress.id, currentAddress);
            } else {
                await addressService.addAddress(currentAddress as Address);
            }
            fetchAddresses();
            setIsEditing(false);
            setCurrentAddress({});
        } catch (err) {
            setError('Failed to save address');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await addressService.deleteAddress(id);
                fetchAddresses();
            } catch (err) {
                setError('Failed to delete address');
            }
        }
    };

    const handleSetDefault = async (address: Address) => {
        if (address.default) return;
        try {
            await addressService.updateAddress(address.id, { ...address, default: true });
            fetchAddresses();
        } catch (err) {
            setError('Failed to set default address');
        }
    };

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Loading...</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setCurrentAddress({});
                                setIsEditing(true);
                            }}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Address
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {isEditing ? (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {currentAddress.id ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={currentAddress.street || ''}
                                    onChange={e => setCurrentAddress({ ...currentAddress, street: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={currentAddress.city || ''}
                                        onChange={e => setCurrentAddress({ ...currentAddress, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={currentAddress.state || ''}
                                        onChange={e => setCurrentAddress({ ...currentAddress, state: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={currentAddress.zipCode || ''}
                                        onChange={e => setCurrentAddress({ ...currentAddress, zipCode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Country</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={currentAddress.country || ''}
                                        onChange={e => setCurrentAddress({ ...currentAddress, country: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="default"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={currentAddress.default || false}
                                    onChange={e => setCurrentAddress({ ...currentAddress, default: e.target.checked })}
                                />
                                <label htmlFor="default" className="ml-2 block text-sm text-gray-900">
                                    Set as default address
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setCurrentAddress({});
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {addresses.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by adding a new address.</p>
                            </div>
                        ) : (
                            addresses.map(address => (
                                <div key={address.id} className="bg-white shadow rounded-lg p-6 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {address.street}
                                            </h3>
                                            {address.default && (
                                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-gray-500">
                                            <p>{address.city}, {address.state} {address.zipCode}</p>
                                            <p>{address.country}</p>
                                        </div>
                                        {!address.default && (
                                            <button
                                                onClick={() => handleSetDefault(address)}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-500 flex items-center"
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => {
                                                setCurrentAddress(address);
                                                setIsEditing(true);
                                            }}
                                            className="text-gray-400 hover:text-blue-600"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address.id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressManagement;
