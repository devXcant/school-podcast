"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IPodcast } from "../../types";

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/podcasts/${podcast.file_url}`;
    console.log("Using full audio URL:", fullUrl);

    if (!podcast.file_url) {
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
    audio.src = fullUrl;
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
  }, [podcast.file_url, volume]); // Removed isPlaying from dependencies to avoid loop

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
            .catch((error) => {
              // Auto-play was prevented
              console.error("Audio playback was prevented:", error);
              setError(
                "Audio playback failed. Click again or check your browser settings."
              );
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

  const handleProgress = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || isNaN(audio.duration) || audio.duration <= 0) return;

    const newTime = (value[0] / 100) * audio.duration;
    if (!isNaN(newTime) && isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolume = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    setVolume(newVolume);
    audio.volume = newVolume / 100;
    setIsMuted(newVolume === 0);
  };

  // Calculate progress percentage safely
  const progressPercentage =
    duration > 0 && !isNaN(duration) && !isNaN(currentTime)
      ? (currentTime / duration) * 100
      : 0;

  return (
    <Card>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg font-medium truncate" title={podcast.title}>
          {podcast.title}
        </h3>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <Slider
            value={[progressPercentage]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleProgress}
            disabled={isLoading || duration <= 0}
            className={isLoading ? "animate-pulse" : ""}
          />
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={togglePlay}
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={isLoading || !!error}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="w-24">
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolume}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>

        {podcast.author && (
          <div className="mt-2 text-xs text-muted-foreground">
            By: {podcast.author}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PodcastPlayer;
