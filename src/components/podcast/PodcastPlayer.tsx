import React, { useState, useRef, useEffect } from 'react';
import { IPodcast } from '../../types';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/solid';

interface PodcastPlayerProps {
  podcast: IPodcast;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ podcast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = parseFloat(e.target.value);
    audio.currentTime = (value / 100) * audio.duration;
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    setIsMuted(value === 0);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <audio ref={audioRef} src={podcast.fileUrl} preload="metadata" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{podcast.title}</h3>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-500">{formatTime(currentTime)}</span>
          <span className="text-sm text-gray-300">/</span>
          <span className="text-sm text-gray-500">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="range"
          value={progressPercentage}
          onChange={handleProgress}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={togglePlay}
          className="bg-primary-600 text-white rounded-full p-3 hover:bg-primary-700"
        >
          {isPlaying ? (
            <PauseIcon className="h-6 w-6" />
          ) : (
            <PlayIcon className="h-6 w-6" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          <button onClick={toggleMute} className="text-gray-700">
            {isMuted ? (
              <SpeakerXMarkIcon className="h-6 w-6" />
            ) : (
              <SpeakerWaveIcon className="h-6 w-6" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="100"
            onChange={handleVolume}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default PodcastPlayer;
