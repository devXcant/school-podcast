"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Calendar, Mic, MicOff, Radio } from "lucide-react";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { format, isAfter } from "date-fns";
import { useSession } from "next-auth/react";
// import { toast } from "react-hot-toast";

const AgoraVoiceLive = dynamic(() => import("./AgoraVoiceLive"), {
  ssr: false,
});

interface LiveStreamPlayerProps {
  podcastId: string;
  courseId: string;
  isLecturer: boolean;
}

interface PodcastData {
  id: string;
  is_live: boolean;
  status: "scheduled" | "live" | "ended";
  start_time: string | null;
  file_url: string | null;
  end_time?: string | null;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  podcastId,
  courseId,
  isLecturer,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<"scheduled" | "live" | "ended">(
    "scheduled"
  );
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!podcastId) return;

    const fetchPodcast = async () => {
      try {
        const { data: podcast, error } = await supabase
          .from("podcasts")
          .select("*")
          .eq("id", podcastId)
          .single();

        if (error) throw error;

        if (podcast) {
          const podcastData = podcast as PodcastData;
          setIsLive(podcastData.is_live);
          setStatus(podcastData.status);
          setStartTime(
            podcastData.start_time ? new Date(podcastData.start_time) : null
          );
        }
      } catch (error) {
        console.error("Error fetching podcast:", error);
        setError("Failed to load podcast");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcast();

    // Set up real-time subscription
    channelRef.current = supabase
      .channel(`podcast-${podcastId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "podcasts",
          filter: `id=eq.${podcastId}`,
        },
        (payload) => {
          if (payload.new) {
            const podcastData = payload.new as PodcastData;
            setIsLive(podcastData.is_live);
            setStatus(podcastData.status);
            setStartTime(
              podcastData.start_time ? new Date(podcastData.start_time) : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [podcastId]);

  useEffect(() => {
    if (!isLecturer || !isLive) return;

    const setupMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = stream;
        setIsMicEnabled(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setError("Failed to access microphone");
      }
    };

    setupMediaStream();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLecturer, isLive]);

  const handleStartStream = async () => {
    if (!session?.user) {
      setError("You must be logged in to start a stream");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("podcasts")
        .update({
          is_live: true,
          status: "live",
          start_time: new Date().toISOString(),
          file_url: `livestream://${podcastId}`,
        })
        .eq("id", podcastId);

      if (error) throw error;

      setStatus("live");
      setIsLive(true);
    } catch (error) {
      console.error("Error starting livestream:", error);
      // toast.error(error?.message || "Error starting livestream");
      setError("Failed to start stream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!session?.user) {
      setError("You must be logged in to end a stream");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("podcasts")
        .update({
          is_live: false,
          status: "ended",
          end_time: new Date().toISOString(),
          file_url: "ended_stream.mp4",
        })
        .eq("id", podcastId);

      if (error) throw error;

      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error("Error ending stream:", error);
      setError("Failed to end stream");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (status === "ended") {
    return (
      <Alert>
        <AlertDescription>This livestream has ended.</AlertDescription>
      </Alert>
    );
  }

  const isScheduled =
    status === "scheduled" && startTime && isAfter(startTime, new Date());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <Badge variant={isLive ? "destructive" : "secondary"}>
            {isLive ? "LIVE" : "OFFLINE"}
          </Badge>
          {isLive && startTime && (
            <span className="text-sm text-muted-foreground">
              {format(startTime, "h:mm a")}
            </span>
          )}
        </div>
        {isLecturer && (
          <Button
            variant={isLive ? "destructive" : "default"}
            size="sm"
            onClick={isLive ? handleEndStream : handleStartStream}
            disabled={isLoading}
          >
            {isLive ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                End Stream
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Go Live
              </>
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{viewerCount} watching</span>
          </div>
          {startTime && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Started: {format(startTime, "h:mm a")}</span>
            </div>
          )}
        </div>

        {isScheduled ? (
          <div className="text-center">
            <h3 className="text-lg font-semibold">Stream Scheduled</h3>
            <p className="text-muted-foreground">
              Starting at {format(startTime, "h:mm a")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {isLecturer ? "You are live" : "Live Stream"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {viewerCount} watching
                </span>
                {isLecturer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMicrophone}
                  >
                    {isMicEnabled ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {isLecturer && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="destructive"
                  onClick={handleEndStream}
                  disabled={isLoading}
                >
                  End Stream
                </Button>
              </div>
            )}
          </>
        )}

        {isLive && typeof session?.user?.id === "string" && (
          // @ts-expect-error
          <AgoraVoiceLive
            channel={courseId}
            role={isLecturer ? "lecturer" : "student"}
            uid={session.user.id}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStreamPlayer;
