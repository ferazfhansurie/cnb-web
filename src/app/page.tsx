import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Image
                src="/cnb-web.png"
                alt="CNB Logo"
                width={40}
                height={40}
                className="rounded-2xl"
                priority
              />
              <span className="ml-2 text-xl font-bold text-[#FB8A13]">CNB</span>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FB8A13] hover:bg-[#e07911]"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[#FB8A13] mix-blend-multiply" />
              </div>
              <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
                <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">Welcome to CNB</span>
                  <span className="block text-orange-200">Admin Management System</span>
                </h1>
                <p className="mt-6 max-w-lg mx-auto text-center text-xl text-orange-200 sm:max-w-3xl">
                  Manage your products, categories, and promotions with our easy-to-use admin interface.
                </p>
                <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                  <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-1 sm:gap-5">
                    <Link
                      href="/login"
                      className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[#FB8A13] bg-white hover:bg-orange-50 sm:px-8"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="bg-gray-100 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-[#FB8A13]">
                Manage Your Business with Ease
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Our admin system provides all the tools you need to manage your products, categories, and promotions efficiently.
              </p>
            </div>
            <div className="mt-12 space-y-10 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-x-6">
              <div className="relative group">
                <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100">
                  <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#FB8A13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Products</h3>
                    <p className="mt-2 text-sm text-gray-500">Manage your product catalog with ease.</p>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100">
                  <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#FB8A13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Categories</h3>
                    <p className="mt-2 text-sm text-gray-500">Organize products into categories.</p>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100">
                  <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#FB8A13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Promotions</h3>
                    <p className="mt-2 text-sm text-gray-500">Create and manage promotional campaigns.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} CNB. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
