import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ArrowRight, ShieldCheck, Truck, Stethoscope } from 'lucide-react';

function Home() {
  const categories = [
    { name: 'Pain Relief', color: 'bg-blue-100 text-blue-800', icon: '💊' },
    { name: 'Antibiotics', color: 'bg-green-100 text-green-800', icon: '🦠' },
    { name: 'Vitamins', color: 'bg-yellow-100 text-yellow-800', icon: '🍊' },
    { name: 'First Aid', color: 'bg-red-100 text-red-800', icon: '🩹' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Healthcare simplified</span>{' '}
                  <span className="block text-primary-600 xl:inline">for your pharmacy</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Access a vast inventory of top-quality pharmaceutical products. Streamlined ordering, reliable delivery, and competitive pricing for modern healthcare providers.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/products"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    {authService.getCurrentUser()?.role === 'ADMIN' ? (
                      <Link
                        to="/admin"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg transition-colors"
                      >
                        Join Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full opacity-90"
            src="https://images.unsplash.com/photo-1576602976116-5a2a124d77d7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80"
            alt="Pharmacy stock"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent lg:hidden"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent hidden lg:block"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Why Choose Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Better healthcare distribution
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Quality Guaranteed</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  All products are sourced directly from verified manufacturers and undergo strict quality checks.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <Truck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Fast Delivery</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Optimized logistics network ensures your stock arrives on time, every time.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <Stethoscope className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Expert Support</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Our team of pharmacists and logistics experts is available 24/7 to assist you.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Popular Categories</h2>
            <Link to="/products" className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 font-medium group">
              View all products <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${category.name.toUpperCase().replace(' ', '_')}`}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center group border border-gray-100"
              >
                <div className={`h-14 w-14 rounded-full ${category.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{category.name}</h3>
              </Link>
            ))}
          </div>

          <div className="mt-8 sm:hidden">
            <Link to="/products" className="block w-full text-center bg-white border border-gray-300 rounded-md py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              View all products
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to restock?</span>
            <span className="block">Start ordering today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-100">
            Join thousands of pharmacies trusting PharmaStock for their supply chain needs.
          </p>
          <div className="mt-8 w-full flex justify-center">
            {authService.getCurrentUser() ? (
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 sm:text-lg transition-colors shadow-lg"
              >
                Order Now
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 sm:text-lg transition-colors shadow-lg"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
