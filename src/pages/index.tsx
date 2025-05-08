import type { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Mic, BookOpen, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "../components/layout/Layout";

const HomePage = () => {
  return (
    <Layout requireAuth={false}>
      <Head>
        <title>Campus Podcast System</title>
      </Head>

      <div className="bg-gradient-to-b from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 md:pr-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Campus Podcast System
              </h1>
              <p className="mt-4 text-lg md:text-xl text-primary-foreground/90">
                Record, stream, and access classroom lectures anytime, anywhere.
                Enhance your learning experience with on-demand access to
                educational content.
              </p>
              <div className="mt-8 flex space-x-4">
                <Button asChild variant="secondary" size="lg">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block md:w-1/2">
              <img
                src="/placeholder.svg?key=6ui7m"
                alt="Campus Podcast System"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Features</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform provides everything you need to enhance education
              through audio content.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-md flex items-center justify-center mb-4">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium">Live Recording</h3>
                <p className="mt-2 text-muted-foreground">
                  Record live lectures with high-quality audio and make them
                  instantly available to students.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-md flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium">Course Management</h3>
                <p className="mt-2 text-muted-foreground">
                  Organize recordings by courses, making it easy for students to
                  find relevant content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-md flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium">Role-Based Access</h3>
                <p className="mt-2 text-muted-foreground">
                  Different permissions for students, course representatives,
                  lecturers, and administrators.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2 lg:pr-10">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <div className="mt-6 space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      1
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Record or Upload</h3>
                    <p className="mt-1 text-muted-foreground">
                      Lecturers and course representatives can record live
                      sessions or upload pre-recorded content.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      2
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Organize</h3>
                    <p className="mt-1 text-muted-foreground">
                      Content is automatically organized by course, making it
                      easy to find and manage.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      3
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">Access</h3>
                    <p className="mt-1 text-muted-foreground">
                      Students can listen to recordings anytime, anywhere,
                      helping them review and catch up on missed classes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link
                    href="/auth/register"
                    className="flex items-center text-primary"
                  >
                    Get started today
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-10 lg:mt-0 lg:w-1/2">
              <img
                src="/colorful-learning-audio.png"
                alt="How it works"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Join our platform today and transform how you share and access
              educational content.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
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
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default HomePage;
