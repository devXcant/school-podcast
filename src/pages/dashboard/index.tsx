import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import LecturerDashboard from '../../components/dashboard/LecturerDashboard';
import StudentDashboard from '../../components/dashboard/StudentDashboard';
import CourseRepDashboard from '../../components/dashboard/CourseRepDashboard';
import Layout from '../../components/layout/Layout';

const Dashboard = () => {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <Layout>
      <Head>
        <title>Dashboard | Campus Podcast System</title>
      </Head>

      {session.user.role === 'admin' && <AdminDashboard />}
      {session.user.role === 'lecturer' && <LecturerDashboard />}
      {session.user.role === 'student' && <StudentDashboard />}
      {session.user.role === 'course_rep' && <CourseRepDashboard />}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default Dashboard;
