import React from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import LoginForm from '../../components/auth/LoginForm';
import Layout from '../../components/layout/Layout';

const LoginPage: React.FC = () => {
  return (
    <Layout requireAuth={false}>
      <Head>
        <title>Sign In | Campus Podcast System</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
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

  return {
    props: {},
  };
};

export default LoginPage;
