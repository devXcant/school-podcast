// pages/index.tsx
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { MicrophoneIcon, BookOpenIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';

const HomePage = () => {
  return (
    <Layout requireAuth={false}>
      <Head>
        <title>Campus Podcast System</title>
      </Head>

      <div className="bg-gradient-to-b from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 md:pr-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Campus Podcast System
              </h1>
              <p className="mt-4 text-lg md:text-xl text-primary-100">
                Record, stream, and access classroom lectures anytime, anywhere. Enhance your learning experience with on-demand access to educational content.
              </p>
              <div className="mt-8 flex space-x-4">
                <Link href="/auth/login" className="bg-white text-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-primary-500 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-400 transition-colors">
                  Register
                </Link>
              </div>
            </div>
            <div className="hidden md:block md:w-1/2">
              <img
                src="/api/placeholder/600/400"
                alt="Campus Podcast System"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Features</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides everything you need to enhance education through audio content.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center mb-4">
                <MicrophoneIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Live Recording</h3>
              <p className="mt-2 text-gray-600">
                Record live lectures with high-quality audio and make them instantly available to students.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center mb-4">
                <BookOpenIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Course Management</h3>
              <p className="mt-2 text-gray-600">
                Organize recordings by courses, making it easy for students to find relevant content.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center mb-4">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Role-Based Access</h3>
              <p className="mt-2 text-gray-600">
                Different permissions for students, course representatives, lecturers, and administrators.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2 lg:pr-10">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <div className="mt-6 space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
                      1
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Record or Upload</h3>
                    <p className="mt-1 text-gray-600">
                      Lecturers and course representatives can record live sessions or upload pre-recorded content.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
                      2
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Organize</h3>
                    <p className="mt-1 text-gray-600">
                      Content is automatically organized by course, making it easy to find and manage.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
                      3
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Access</h3>
                    <p className="mt-1 text-gray-600">
                      Students can listen to recordings anytime, anywhere, helping them review and catch up on missed classes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/auth/register" className="text-primary-600 font-medium flex items-center hover:text-primary-700">
                  Get started today
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 lg:mt-0 lg:w-1/2">
              <img
                src="/api/placeholder/600/400"
                alt="How it works"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              Join our platform today and transform how you share and access educational content.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/auth/login" className="bg-white text-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-primary-500 text-white border border-primary-300 px-6 py-3 rounded-md font-medium hover:bg-primary-600 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
