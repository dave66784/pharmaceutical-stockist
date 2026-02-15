import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} PharmaStock. All rights reserved.
                    </div>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            Terms of Service
                        </a>
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
