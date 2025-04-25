import React, { useState, useRef, useEffect } from "react";
import { IPodcast } from "../../types";
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";

interface PodcastPlayerProps {
  podcast: IPodcast;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ podcast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(100);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get the audio URL directly from the podcast object
  const audioUrl = podcast?.file_url || '';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log("Using direct audio URL:", audioUrl);

    if (!audioUrl) {
      setError("No audio URL available");
      setIsLoading(false);
      return;
    }

    const setAudioData = () => {
      console.log("Audio metadata loaded:", {
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState,
      });

      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };

    const setAudioTime = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      console.error("Audio element error:", {
        error: audioElement.error,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState,
      });

      setError("Error playing audio file. Please try again later.");
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log("Audio can play");
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log("Audio load started");
      setIsLoading(true);
      setError(null);
    };

    // This ensures our isPlaying state stays in sync with the actual audio element state
    const handlePlay = () => {
      console.log("Audio play event triggered");
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log("Audio pause event triggered");
      setIsPlaying(false);
    };

    // Set up event listeners
    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Set initial volume
    audio.volume = volume / 100;

    // Set the src and load the audio
    audio.src = audioUrl;
    audio.load();

    return () => {
      // Clean up event listeners
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);

      // Stop audio when component unmounts
      if (isPlaying) {
        audio.pause();
      }
    };
  }, [audioUrl, volume]);  // Removed isPlaying from dependencies to avoid loop

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        // Reset audio if ended
        if (currentTime >= duration && duration > 0) {
          audio.currentTime = 0;
          setCurrentTime(0);
        }

        // Use a Promise with the play method
        const playPromise = audio.play();

        // Modern browsers return a promise from the play function
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Auto-play started successfully
              console.log("Audio playback started successfully");
            })
            .catch(error => {
              // Auto-play was prevented
              console.error("Audio playback was prevented:", error);
              setError("Audio playback failed. Click again or check your browser settings.");
              setIsPlaying(false);
            });
        }
      }
    } catch (error) {
      console.error("Error toggling play:", error);
      setError("Error playing audio. Please try again.");
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || isNaN(audio.duration) || audio.duration <= 0) return;

    const value = parseFloat(e.target.value);
    const newTime = (value / 100) * audio.duration;
    if (!isNaN(newTime) && isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audio.volume = newVolume / 100;
    setIsMuted(newVolume === 0);
  };

  // Calculate progress percentage safely
  const progressPercentage = (duration > 0 && !isNaN(duration) && !isNaN(currentTime))
    ? (currentTime / duration) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium truncate" title={podcast.title}>
          {podcast.title}
        </h3>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-500">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-gray-300">/</span>
          <span className="text-sm text-gray-500">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={progressPercentage}
          onChange={handleProgress}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          disabled={isLoading || duration <= 0}
        />
        {isLoading && (
          <div className="absolute left-0 top-0 h-2 bg-gray-300 rounded-lg animate-pulse" style={{ width: '100%' }}></div>
        )}
        {!isLoading && (
          <div
            className="absolute left-0 top-0 h-2 bg-primary-600 rounded-lg"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={togglePlay}
          className="bg-primary-600 text-white rounded-full p-3 hover:bg-primary-700 disabled:opacity-50 transition-colors"
          disabled={isLoading || !!error}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="h-6 w-6" />
          ) : (
            <PlayIcon className="h-6 w-6" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-gray-700 hover:text-gray-900 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="h-6 w-6" />
            ) : (
              <SpeakerWaveIcon className="h-6 w-6" />
            )}
          </button>
          <div className="relative w-24">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolume}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Volume"
            />
            <div
              className="absolute left-0 top-0 h-2 bg-gray-400 rounded-lg"
              style={{ width: `${volume}%` }}
            ></div>
          </div>
        </div>
      </div>

      {podcast.author && (
        <div className="mt-3 text-xs text-gray-500">
          By: {podcast.author}
        </div>
      )}
    </div>
  );
};

export default PodcastPlayer;
