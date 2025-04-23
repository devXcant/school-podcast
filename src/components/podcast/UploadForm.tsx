// components/podcast/UploadForm.tsx
import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ICourse } from '../../types';

import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface UploadFormProps {
  onUploadComplete: (file: File, metadata: any) => void;
  courses: ICourse[];
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, courses }) => {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Check if file is an audio file
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Auto-populate title from filename if not set
      if (!title) {
        const filename = file.name.split('.').slice(0, -1).join('.');
        setTitle(filename);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Check if file is an audio file
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Auto-populate title from filename if not set
      if (!title) {
        const filename = file.name.split('.').slice(0, -1).join('.');
        setTitle(filename);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an audio file to upload');
      return;
    }

    if (!title) {
      setError('Please enter a title for the podcast');
      return;
    }

    if (!selectedCourse) {
      setError('Please select a course for the podcast');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      onUploadComplete(selectedFile, {
        title,
        description,
        course: selectedCourse,
      });
    } catch (err) {
      console.error('Error during upload:', err);
      setError('Failed to upload file. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Upload Podcast</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            selectedFile ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*"
            className="hidden"
            id="podcast-upload"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentIcon className="h-10 w-10 text-primary-500 mr-3" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="podcast-upload"
              className="cursor-pointer block"
            >
              <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">
                MP3, WAV, or M4A up to 500MB
              </p>
            </label>
          )}
        </div>

        <Input
          label="Podcast Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!selectedFile || !title || !selectedCourse}
          >
            Upload Podcast
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
