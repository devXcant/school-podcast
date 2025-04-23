// components/podcast/LiveRecorder.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ICourse } from '../../types';

import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/solid';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface LiveRecorderProps {
  onRecordingComplete: (audioBlob: Blob, metadata: any) => void;
  courses: ICourse[];
}

const LiveRecorder: React.FC<LiveRecorderProps> = ({ onRecordingComplete, courses }) => {
  const { data: session } = useSession();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!title) {
      setError('Please enter a title for the recording');
      return;
    }

    if (!selectedCourse) {
      setError('Please select a course for the recording');
      return;
    }

    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob, {
          title,
          description,
          course: selectedCourse,
          duration: recordingTime,
        });

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please check your permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prevTime => prevTime + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }

      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Record Live Session</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <Input
          label="Recording Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isRecording}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={isRecording}
            required
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option
                key={(course.id || course._id || '').toString()}
                value={(course.id || course._id || '').toString()}
              >
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            disabled={isRecording}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isRecording ? (isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse') : 'bg-gray-400'}`}></div>
          <span className="text-lg font-mono">
            {formatTime(recordingTime)}
          </span>
        </div>

        <div className="flex space-x-4">
          {isRecording ? (
            <>
              <Button
                onClick={pauseRecording}
                variant={isPaused ? 'primary' : 'secondary'}
                size="sm"
              >
                {isPaused ? (
                  <PlayIcon className="h-5 w-5 mr-1" />
                ) : (
                  <PauseIcon className="h-5 w-5 mr-1" />
                )}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                onClick={stopRecording}
                variant="danger"
                size="sm"
              >
                <StopIcon className="h-5 w-5 mr-1" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              onClick={startRecording}
                variant="primary"
                className='bg-green-500'
            >
              <MicrophoneIcon className="h-5 w-5 mr-1" />
              Start Recording
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>Recording will be saved to your selected course and made available for students to access.</p>
        {!isRecording && (
          <p className="mt-2">Click &quot;Start Recording&quot; when you are ready to begin.</p>
        )}
      </div>
    </div>
  );
};

export default LiveRecorder;
