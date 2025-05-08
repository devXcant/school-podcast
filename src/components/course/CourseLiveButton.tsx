"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Radio } from "lucide-react";
// import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "../../lib/supabase";

interface CourseLiveButtonProps {
  courseId: string;
  courseTitle: string;
}

interface PodcastData {
  id: string;
  is_live: boolean;
  live_started_at: string | null;
}

const CourseLiveButton: React.FC<CourseLiveButtonProps> = ({
  courseId,
  courseTitle,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showStartMessage, setShowStartMessage] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchLiveStatus = async () => {
      try {
        const { data: podcasts, error } = await supabase
          .from("podcasts")
          .select("*")
          .eq("course_id", courseId)
          .eq("is_live", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching live status:", error);
          return;
        }

        if (podcasts && podcasts.length > 0) {
          const podcastData = podcasts[0] as PodcastData;
          setIsLive(podcastData.is_live);
          const liveStart = podcastData.live_started_at
            ? new Date(podcastData.live_started_at)
            : null;
          setStartTime(liveStart);
          if (liveStart && liveStart > new Date()) {
            setShowStartMessage(true);
          } else {
            setShowStartMessage(false);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchLiveStatus();

    const channel = supabase
      .channel(`podcast-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "podcasts",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          if (payload.new) {
            const podcastData = payload.new as PodcastData;
            setIsLive(podcastData.is_live);
            const liveStart = podcastData.live_started_at
              ? new Date(podcastData.live_started_at)
              : null;
            setStartTime(liveStart);
            if (liveStart && liveStart > new Date()) {
              setShowStartMessage(true);
            } else {
              setShowStartMessage(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const handleGoLive = async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);

      const { data: existingPodcasts, error: fetchError } = await supabase
        .from("podcasts")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_live", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (existingPodcasts && existingPodcasts.length > 0) {
        router.push(`/podcasts/${existingPodcasts[0].id}`);
        return;
      }

      const now = new Date().toISOString();

      const { data: podcast, error } = await supabase
        .from("podcasts")
        .insert({
          title: `Live Stream: ${courseTitle}`,
          description: `Live streaming session for ${courseTitle}`,
          course_id: courseId,
          recorded_by: session.user.id,
          is_live: true,
          live_started_at: now,
          file_url: "livestream://" + courseId,
          storage_path: "livestreams/" + courseId,
          duration: 0,
          view_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/podcasts/${podcast.id}`);
    } catch (error) {
      console.error("Error starting livestream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndLive = async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);

      const { data: existingPodcasts, error: fetchError } = await supabase
        .from("podcasts")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_live", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (!existingPodcasts || existingPodcasts.length === 0) {
        throw new Error("No active livestream found");
      }

      const { error } = await supabase
        .from("podcasts")
        .update({
          is_live: false,
          file_url: existingPodcasts[0].file_url || "ended_stream.mp4",
        })
        .eq("id", existingPodcasts[0].id);

      if (error) throw error;

      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error("Error ending livestream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) return null;

  const isLecturer = session.user.role === "lecturer";
  const isAdmin = session.user.role === "admin";

  if (!isLecturer && !isAdmin) return null;

  return (
    <div>
      <Button
        variant={isLive ? "destructive" : "default"}
        onClick={isLive ? handleEndLive : handleGoLive}
        disabled={isLoading}
      >
        <Radio className="h-4 w-4 mr-2" />
        {isLoading
          ? "Loading..."
          : isLive
          ? "End Stream"
          : startTime
          ? `Starting at ${format(startTime, "h:mm:ss a")}`
          : "Go Live"}
      </Button>
      {showStartMessage && startTime && (
        <div style={{ marginTop: 16, color: "#fbbf24" }}>
          Livestream will start at {format(startTime, "h:mm:ss a")}
        </div>
      )}
    </div>
  );
};

export default CourseLiveButton;
