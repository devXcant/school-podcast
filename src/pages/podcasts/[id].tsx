"use client";

import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { IPodcast } from "../../types";
import { Calendar, User, Clock, BookOpen, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Layout from "@/src/components/layout/Layout";
import PodcastPlayer from "@/src/components/podcast/PodcastPlayer";
import LiveStreamPlayer from "@/src/components/podcast/LiveStreamPlayer";

const PodcastDetailPage = ({
  initialPodcastId,
}: {
  initialPodcastId: string;
}) => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [podcast, setPodcast] = useState<IPodcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const podcastId = id || initialPodcastId;
    console.log(
      "Router query id:",
      id,
      "Initial podcast ID:",
      initialPodcastId
    ); // Debug log
    if (podcastId && typeof podcastId === "string") {
      fetchPodcast(podcastId);
    }
  }, [id, initialPodcastId]);

  const fetchPodcast = async (podcastId: string) => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching podcast with ID:", podcastId); // Debug log
      const response = await fetch(`/api/podcasts/${podcastId}`);
      const data = await response.json();
      console.log("API Response:", data); // Debug log

      if (data.success) {
        setPodcast(data.data);
      } else {
        setError(data.message || "Failed to load podcast");
      }
    } catch (error) {
      setError("Failed to load podcast");
      console.error("Error fetching podcast:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleDelete = async () => {
    if (!podcast) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/podcasts/${podcast.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/podcasts");
      } else {
        setError(data.message || "Failed to delete podcast");
      }
    } catch (error) {
      setError("Failed to delete podcast");
      console.error("Error deleting podcast:", error);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const canEdit = () => {
    if (!session || !podcast) return false;

    const isAdmin = session.user.role === "admin";
    const isLecturer = session.user.role === "lecturer";
    const isCourseRep = session.user.role === "course_rep";
    const isCreator =
      podcast.recorded_by &&
      typeof podcast.recorded_by === "object" &&
      podcast.recorded_by.id === session.user.id;

    return isAdmin || (isLecturer && isCreator) || (isCourseRep && isCreator);
  };

  const isLecturer = session?.user?.role === "lecturer";

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error || !podcast) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>{error || "Podcast not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="link" asChild className="pl-0">
            <Link href="/podcasts">&larr; Back to podcasts</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{podcast.title} | Campus Podcast System</title>
      </Head>

      <div className="mb-4">
        <Button variant="link" asChild className="pl-0">
          <Link href="/podcasts">&larr; Back to podcasts</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-semibold mb-2">{podcast.title}</h1>

            {canEdit() && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/podcasts/edit/${podcast.id}`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {podcast.description && (
            <p className="text-muted-foreground mb-4">{podcast.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{new Date(podcast.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-5 w-5 mr-2" />
              <span>
                By:{" "}
                {typeof podcast.recorded_by === "object"
                  ? podcast.recorded_by.name
                  : "Unknown"}
              </span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-5 w-5 mr-2" />
              <span>Duration: {formatTime(podcast.duration)}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="h-5 w-5 mr-2" />
              <span>
                Course:{" "}
                {typeof podcast.course === "object"
                  ? podcast.course.title
                  : "Unknown"}
              </span>
            </div>
          </div>

          {podcast.is_live ? (
            <LiveStreamPlayer podcast={podcast} isLecturer={isLecturer} />
          ) : (
            <PodcastPlayer podcast={podcast} />
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Podcast</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this podcast? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { id } = context.params || {};

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
      initialPodcastId: id || "",
    },
  };
};

export default PodcastDetailPage;
