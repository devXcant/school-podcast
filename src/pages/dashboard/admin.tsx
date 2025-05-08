import AdminDashboard from "@/src/components/dashboard/AdminDashboard"
import Layout from "@/src/components/layout/Layout"
import type { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import Head from "next/head"

const AdminDashboardPage = () => {
  return (
    <Layout allowedRoles={["admin"]}>
      <Head>
        <title>Admin Dashboard | Campus Podcast System</title>
      </Head>
      <AdminDashboard />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    }
  }

  if (session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export default AdminDashboardPage
