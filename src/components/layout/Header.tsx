import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Campus Podcast
            </Link>
            <div className="ml-10 hidden space-x-8 lg:block">
              {session ? (
                <>
                  <Link href="/dashboard" className="text-base font-medium text-gray-700 hover:text-primary-600">
                    Dashboard
                  </Link>
                  <Link href="/podcasts" className="text-base font-medium text-gray-700 hover:text-primary-600">
                    Podcasts
                  </Link>
                  <Link href="/courses" className="text-base font-medium text-gray-700 hover:text-primary-600">
                    Courses
                  </Link>
                  {(session.user.role === 'admin' || session.user.role === 'lecturer' || session.user.role === 'course_rep') && (
                    <Link href="/podcasts/record" className="text-base font-medium text-gray-700 hover:text-primary-600">
                      Record
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/" className="text-base font-medium text-gray-700 hover:text-primary-600">
                    Home
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="ml-10 space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {session.user.name} ({session.user.role})
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-block rounded-md border border-transparent bg-primary-600 py-2 px-4 text-base font-medium text-white hover:bg-opacity-75"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="inline-block rounded-md border border-transparent bg-white py-2 px-4 text-base font-medium text-primary-600 hover:bg-gray-50">
                  Sign in
                </Link>
              </>
            )}
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="space-y-4 py-6 lg:hidden">
            {session ? (
              <>
                <Link href="/dashboard" className="block text-base font-medium text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <Link href="/podcasts" className="block text-base font-medium text-gray-700 hover:text-primary-600">
                  Podcasts
                </Link>
                <Link href="/courses" className="block text-base font-medium text-gray-700 hover:text-primary-600">
                  Courses
                </Link>
                {(session.user.role === 'admin' || session.user.role === 'lecturer' || session.user.role === 'course_rep') && (
                  <Link href="/podcasts/record" className="block text-base font-medium text-gray-700 hover:text-primary-600">
                    Record
                  </Link>
                )}
                <div className="pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-md border border-transparent bg-primary-600 py-2 px-4 text-base font-medium text-white hover:bg-opacity-75"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className="block text-base font-medium text-gray-700 hover:text-primary-600">
                  Home
                </Link>
                <Link href="/auth/login" className="block w-full rounded-md border border-transparent bg-primary-600 py-2 px-4 text-center text-base font-medium text-white hover:bg-opacity-75">
                  Sign in
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
