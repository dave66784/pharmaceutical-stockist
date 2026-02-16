import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-white mt-auto pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-1.5 rounded-lg">
                                <span className="font-bold text-lg tracking-tight">PS</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight">PharmaStock</span>
                        </div>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Your trusted partner in pharmaceutical distribution. Delivering quality healthcare solutions with efficiency and reliability.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary-600 transition-colors duration-300 group">
                                <Facebook className="h-5 w-5 text-gray-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary-600 transition-colors duration-300 group">
                                <Twitter className="h-5 w-5 text-gray-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary-600 transition-colors duration-300 group">
                                <Instagram className="h-5 w-5 text-gray-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary-600 transition-colors duration-300 group">
                                <Linkedin className="h-5 w-5 text-gray-400 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center relative">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary-500 rounded-full"></span>
                        </h3>
                        <ul className="space-y-3">
                            <li><a href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Home</a></li>
                            <li><a href="/products" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Products</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">About Us</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Contact</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center relative">
                            Support
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary-500 rounded-full"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-gray-400">
                                <MapPin className="h-5 w-5 text-primary-500 flex-shrink-0 mt-1" />
                                <span>123 Pharma Way, Medical District, NY 10001</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Phone className="h-5 w-5 text-primary-500 flex-shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Mail className="h-5 w-5 text-primary-500 flex-shrink-0" />
                                <span>support@pharmastock.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center relative">
                            Newsletter
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary-500 rounded-full"></span>
                        </h3>
                        <p className="text-gray-400 mb-4">Subscribe to our newsletter for updates and exclusive offers.</p>
                        <form className="space-y-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-gray-800 border-none rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:bg-gray-700 transition-all"
                            />
                            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-primary-900/20">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-sm text-center md:text-left">
                        &copy; {new Date().getFullYear()} PharmaStock. All rights reserved.
                    </div>
                    <div className="flex space-x-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
