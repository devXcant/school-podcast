// pages/auth/register.tsx
import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import Head from "next/head"
import RegisterForm from "@/src/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-full flex-col items-center justify-center">
      <Head>
        <title>Register | Campus Podcast System</title>
        <meta name="description" content="Create a new Campus Podcast account" />
      </Head>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">Enter your information to create a new account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (session) {
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
