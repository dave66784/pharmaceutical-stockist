import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronDown, Package, MapPin, LogOut } from 'lucide-react';
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
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-2 rounded-lg shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
                                <span className="font-bold text-xl tracking-tight">PS</span>
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                                PharmaStock
                            </span>
                        </Link>
                        <div className="hidden md:ml-10 md:flex md:space-x-8">
                            <Link to="/" className="text-gray-600 hover:text-primary-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors relative group">
                                Home
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                            </Link>
                            {isAuthenticated && (
                                <Link to="/products" className="text-gray-600 hover:text-primary-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors relative group">
                                    Products
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                </Link>
                            )}
                            {userRole === 'ADMIN' && (
                                <Link to="/admin" className="text-gray-600 hover:text-primary-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors relative group">
                                    Admin
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:ml-6 md:flex md:items-center">
                        {isAuthenticated ? (
                            <div className="ml-3 relative flex items-center space-x-6">
                                <Link to="/cart" className="relative group p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <ShoppingCart className="h-6 w-6 text-gray-600 group-hover:text-primary-600 transition-colors" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold ring-2 ring-white">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>

                                {/* My Account Dropdown */}
                                <div className="relative ml-3">
                                    <div>
                                        <button
                                            onClick={() => setIsOpen(!isOpen)}
                                            className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 text-sm focus:ring-offset-gray-50 transition-all hover:bg-gray-50 pl-1 pr-3 py-1 border border-gray-200"
                                            id="user-menu-button"
                                            aria-expanded="false"
                                            aria-haspopup="true"
                                        >
                                            <span className="sr-only">Open user menu</span>
                                            <div className="flex items-center space-x-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold shadow-sm">
                                                    {user?.firstName?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium text-sm text-gray-700">{user?.firstName}</span>
                                                </div>
                                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <div
                                            className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transform opacity-100 scale-100 transition-all"
                                            role="menu"
                                            aria-orientation="vertical"
                                            aria-labelledby="user-menu-button"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed in as</p>
                                                <p className="text-sm font-medium text-gray-900 truncate mt-1">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    to="/orders"
                                                    className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                                    role="menuitem"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <Package className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                                    My Orders
                                                </Link>

                                                <Link
                                                    to="/account/addresses"
                                                    className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                                    role="menuitem"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <MapPin className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                                    Addresses
                                                </Link>
                                            </div>

                                            <div className="py-1 border-t border-gray-100">
                                                <button
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className="group flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                                    role="menuitem"
                                                >
                                                    <LogOut className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link to="/login" className="text-gray-600 hover:text-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-primary-600 text-white hover:bg-primary-700 px-5 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-primary-500/30 transition-all hover:shadow-lg hover:shadow-primary-500/40 transform hover:-translate-y-0.5">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center md:hidden">
                        <Link to="/cart" className="relative text-gray-600 hover:text-primary-600 mr-4 p-2">
                            <ShoppingCart className="h-6 w-6" />
                            {cartItemCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold ring-2 ring-white">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
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
                <div className="md:hidden absolute w-full bg-white border-b border-gray-100 shadow-lg" id="mobile-menu">
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        <Link to="/" className="text-primary-700 bg-primary-50 block px-3 py-2 rounded-lg text-base font-medium">
                            Home
                        </Link>
                        {isAuthenticated && (
                            <Link to="/products" className="text-gray-600 hover:bg-gray-50 hover:text-primary-600 block px-3 py-2 rounded-lg text-base font-medium transition-colors">
                                Products
                            </Link>
                        )}
                        {userRole === 'ADMIN' && (
                            <Link to="/admin" className="text-gray-600 hover:bg-gray-50 hover:text-primary-600 block px-3 py-2 rounded-lg text-base font-medium transition-colors">
                                Admin
                            </Link>
                        )}
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-100">
                        {isAuthenticated ? (
                            <div className="px-4 space-y-3">
                                <div className="flex items-center mb-4 bg-gray-50 p-3 rounded-xl">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                                            {user?.firstName?.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                                        <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                    </div>
                                </div>

                                <Link to="/orders" className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors">
                                    <Package className="mr-3 h-5 w-5 text-gray-400" />
                                    My Orders
                                </Link>

                                <Link to="/account/addresses" className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors">
                                    <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                                    Addresses
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="mr-3 h-5 w-5 text-red-400" />
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="mt-3 space-y-2 px-4">
                                <Link to="/login" className="block text-center px-4 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="block text-center px-4 py-2 border border-transparent rounded-lg text-base font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-md transition-all">
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
