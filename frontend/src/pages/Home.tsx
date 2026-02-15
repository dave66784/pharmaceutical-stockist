import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

function Home() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to PharmaCare
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your trusted pharmaceutical stockist
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Shop Now
            </Link>
            {authService.getCurrentUser()?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="bg-gray-800 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-900 transition duration-300"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
            <p className="text-gray-600">All products are sourced from verified manufacturers</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Quick and reliable delivery to your doorstep</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
            <p className="text-gray-600">Professional guidance for all your pharmaceutical needs</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
