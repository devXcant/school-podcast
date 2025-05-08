"use client";

import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";

import type { ICourse } from "../../types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/src/components/layout/Layout";
import UploadForm from "@/src/components/podcast/UploadForm";

const UploadPodcastPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (data.success) {
        setCourses(data.data);
      } else {
        setError(data.message || "Failed to load courses");
      }
    } catch (error) {
      setError("Failed to load courses");
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (file: File, metadata: any) => {
    try {
      setUploading(true);
      router.push(`/podcasts/${metadata.course}`);
    } catch (error) {
      setError("Failed to upload podcast");
      console.error("Error uploading podcast:", error);
    } finally {
      setUploading(false);
    }
  };

  // Check if user has permission to upload
  const canUpload = () => {
    if (!session) return false;
    return ["admin", "lecturer", "course_rep"].includes(session.user.role);
  };

  if (!canUpload()) {
    return (
      <Layout>
        <Head>
          <title>Upload Podcast | Campus Podcast System</title>
        </Head>

        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to upload podcasts.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Upload Podcast | Campus Podcast System</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Upload Podcast</h1>
        <p className="text-muted-foreground">
          Upload a pre-recorded lecture session and make it available for
          students.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <UploadForm onUploadComplete={handleUploadComplete} courses={courses} />
      )}
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

  // Only allow certain roles to access this page
  if (!["admin", "lecturer", "course_rep"].includes(session.user.role)) {
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

export default UploadPodcastPage;
