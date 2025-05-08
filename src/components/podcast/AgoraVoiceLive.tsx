import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

const APP_ID = "64b6cda1112e42bab27fd0e0c78bff85";

export interface AgoraVoiceLiveProps {
  channel: string;
  role: "lecturer" | "student";
  uid: string;
  token?: string;
}

const AgoraVoiceLive: React.FC<AgoraVoiceLiveProps> = ({
  channel,
  role,
  uid,
  token,
}) => {
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;
    let localAudioTrack: any;

    const joinChannel = async () => {
      await client.setClientRole(role === "lecturer" ? "host" : "audience");
      await client.join(APP_ID, channel, token || null, uid);
      if (role === "lecturer") {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
      }
      setJoined(true);
    };

    joinChannel();

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
      setUsers((prev) => [...prev, user]);
    });

    client.on("user-unpublished", (user) => {
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      client.leave();
    };
  }, [channel, role, uid, token]);

  return (
    <div>
      <h3>{joined ? "Live!" : "Connecting..."}</h3>
      <p>Channel: {channel}</p>
      <p>Role: {role}</p>
      <p>Listeners: {users.length}</p>
      {role === "lecturer" && <p>Your microphone is live!</p>}
      {role === "student" && <p>Listening to the lecturer...</p>}
    </div>
  );
};

export default AgoraVoiceLive;
