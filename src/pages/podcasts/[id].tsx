// pages/podcasts/[id].tsx
import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../../components/layout/Layout";
import PodcastPlayer from "../../components/podcast/PodcastPlayer";
import { IPodcast } from "../../types";
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  BookOpenIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";

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
      const response = await fetch(`/api/podcasts/${podcast._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/podcasts");
      } else {
        setError(data.message || "Failed to delete podcast");
        setDeleteModalOpen(false);
      }
    } catch (error) {
      setError("Failed to delete podcast");
      console.error("Error deleting podcast:", error);
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = () => {
    if (!session || !podcast) return false;

    const isAdmin = session.user.role === "admin";
    const isLecturer = session.user.role === "lecturer";
    const isCourseRep = session.user.role === "course_rep";
    const isCreator =
      podcast.recordedBy &&
      typeof podcast.recordedBy === "object" &&
      podcast.recordedBy._id === session.user.id;

    return isAdmin || (isLecturer && isCreator) || (isCourseRep && isCreator);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading podcast...</p>
        </div>
      </Layout>
    );
  }

  if (error || !podcast) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error || "Podcast not found"}</p>
        </div>
        <div className="mt-4">
          <Link
            href="/podcasts"
            className="text-primary-600 hover:text-primary-700"
          >
            &larr; Back to podcasts
          </Link>
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
        <Link
          href="/podcasts"
          className="text-primary-600 hover:text-primary-700"
        >
          &larr; Back to podcasts
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-semibold mb-2">{podcast.title}</h1>

            {canEdit() && (
              <div className="flex space-x-2">
                <Link href={`/podcasts/edit/${podcast._id}`}>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {podcast.description && (
            <p className="text-gray-600 mb-4">{podcast.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-5 w-5 mr-2" />
              <span>
                {new Date(podcast.createdAt as Date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <UserIcon className="h-5 w-5 mr-2" />
              <span>
                By:{" "}
                {typeof podcast.recordedBy === "object"
                  ? podcast.recordedBy.name
                  : "Unknown"}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Duration: {formatTime(podcast.duration)}</span>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              <span>
                Course:{" "}
                {typeof podcast.course === "object"
                  ? podcast.course.title
                  : "Unknown"}
              </span>
            </div>
          </div>

          <PodcastPlayer podcast={podcast} />
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Podcast"
      >
        <div>
          <p className="mb-4">
            Are you sure you want to delete this podcast? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
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
