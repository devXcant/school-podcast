import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";

interface LiveStreamRoomProps {
  roomId: string;
  isHost: boolean;
}

const LiveStreamRoom = ({ roomId, isHost }: LiveStreamRoomProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        setParticipants(Object.values(presenceState).flat());
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, user]);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);

      // Initialize WebRTC
      peerConnection.current = new RTCPeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const stopStreaming = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Live Stream Room: {roomId}</h2>
        <p className="text-gray-600">Participants: {participants.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          {isHost && (
            <div className="mt-4">
              {!isStreaming ? (
                <button
                  onClick={startStreaming}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Start Streaming
                </button>
              ) : (
                <button
                  onClick={stopStreaming}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Stop Streaming
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Participants</h3>
          <ul>
            {participants.map((participant, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{participant.user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamRoom;
