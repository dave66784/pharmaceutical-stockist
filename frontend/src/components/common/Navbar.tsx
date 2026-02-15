import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, ChevronDown, Package, MapPin, LogOut } from 'lucide-react';
import { authService } from '../../services/authService';
import { cartService } from '../../services/cartService';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const navigate = useNavigate();

    const user = authService.getCurrentUser();
    const isAuthenticated = !!authService.getToken();
    // Ensure we check user existence before accessing role
    const userRole = user?.role;

    useEffect(() => {
        if (isAuthenticated) {
            fetchCartCount();
            window.addEventListener('cartUpdated', fetchCartCount);
        }
        return () => {
            window.removeEventListener('cartUpdated', fetchCartCount);
        };
    }, [isAuthenticated]);

    const fetchCartCount = async () => {
        try {
            const response = await cartService.getCart();
            if (response.data?.items) {
                const totalItems = response.data.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                );
                setCartItemCount(totalItems);
            }
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-blue-600">PharmaStock</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">
                                Home
                            </Link>
                            {isAuthenticated && (
                                <Link to="/products" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">
                                    Products
                                </Link>
                            )}
                            {userRole === 'ADMIN' && (
                                <Link to="/admin" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {isAuthenticated ? (
                            <div className="ml-3 relative flex items-center space-x-4">
                                <Link to="/cart" className="relative text-gray-500 hover:text-gray-700 mr-2">
                                    <ShoppingCart className="h-6 w-6" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>

                                {/* My Account Dropdown */}
                                <div className="relative ml-3">
                                    <div>
                                        <button
                                            onClick={() => setIsOpen(!isOpen)}
                                            className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm focus:ring-offset-gray-100"
                                            id="user-menu-button"
                                            aria-expanded="false"
                                            aria-haspopup="true"
                                        >
                                            <span className="sr-only">Open user menu</span>
                                            <div className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                                                <User className="h-6 w-6 p-1 bg-gray-100 rounded-full" />
                                                <span className="font-medium text-sm hidden md:block">{user?.firstName || 'Account'}</span>
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <div
                                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                            role="menu"
                                            aria-orientation="vertical"
                                            aria-labelledby="user-menu-button"
                                        >
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            <Link
                                                to="/orders"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Package className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                                My Orders
                                            </Link>

                                            <Link
                                                to="/account/addresses"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <MapPin className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                                Addresses
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    handleLogout();
                                                }}
                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                                role="menuitem"
                                            >
                                                <LogOut className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link to="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <Link to="/cart" className="relative text-gray-500 hover:text-gray-700 mr-4">
                            <ShoppingCart className="h-6 w-6" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <Menu className="block h-6 w-6" />
                            ) : (
                                <X className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="sm:hidden" id="mobile-menu">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link to="/" className="bg-blue-50 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                            Home
                        </Link>
                        {isAuthenticated && (
                            <Link to="/products" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                                Products
                            </Link>
                        )}
                        {userRole === 'ADMIN' && (
                            <Link to="/admin" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                                Admin
                            </Link>
                        )}
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-200">
                        {isAuthenticated ? (
                            <div className="mt-3 space-y-1">
                                <div className="px-4 flex items-center mb-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {user?.firstName?.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">{user?.firstName} {user?.lastName}</div>
                                        <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                    </div>
                                </div>

                                <Link to="/orders" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <Package className="mr-3 h-5 w-5 text-gray-400" />
                                        My Orders
                                    </div>
                                </Link>

                                <Link to="/account/addresses" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                                        Addresses
                                    </div>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    <div className="flex items-center">
                                        <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                                        Sign out
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="mt-3 space-y-1">
                                <Link to="/login" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                                    Login
                                </Link>
                                <Link to="/register" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
