import type { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useAuth } from "@/src/hooks/useAuth";

import AdminDashboard from "@/src/components/dashboard/AdminDashboard";
import LecturerDashboard from "@/src/components/dashboard/LecturerDashboard";
import StudentDashboard from "@/src/components/dashboard/StudentDashboard";
import CourseRepDashboard from "@/src/components/dashboard/CourseRepDashboard";
import Layout from "@/src/components/layout/Layout";

const Dashboard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard | Campus Podcast System</title>
      </Head>

      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "lecturer" && <LecturerDashboard />}
      {user?.role === "student" && <StudentDashboard />}
      {user?.role === "course_rep" && <CourseRepDashboard />}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};

export default Dashboard;
