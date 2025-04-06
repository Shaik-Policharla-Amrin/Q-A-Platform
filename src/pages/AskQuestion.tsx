import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkUploadTime } from '../lib/supabase';
import { Video, Upload, AlertCircle } from 'lucide-react';

const AskQuestion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);


  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB = 50 * 1024 * 1024 bytes)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video size must be less than 50MB');
      return;
    }

    // Create video element to check duration
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 120) { // 2 minutes = 120 seconds
        setError('Video must be less than 2 minutes');
        return;
      }
      setVideo(file);
      setError('');
    };

    video.src = URL.createObjectURL(file);
  };

  const sendOTP = async () => {
    try {
      // In a real app, implement OTP sending logic here
      setOtpSent(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const verifyOTP = async () => {
    try {
      // In a real app, implement OTP verification logic here
      setVerified(true);
      setError('');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkUploadTime() && video) {
      setError('Video uploads are only allowed between 2 PM and 7 PM');
      return;
    }

    if (video && !verified) {
      setError('Please verify your email before uploading a video');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let videoUrl = '';
      if (video) {
        const { data, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(`${user.id}/${Date.now()}-${video.name}`, video);

        if (uploadError) throw uploadError;
        videoUrl = data.path;
      }

      const { error: questionError } = await supabase.from('questions').insert({
        user_id: user.id,
        title,
        content,
        video_url: videoUrl,
      });

      if (questionError) throw questionError;

      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Ask a Question</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Video (optional)
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Video className="h-5 w-5 mr-2 text-gray-400" />
                Choose Video
              </label>
              {video && (
                <span className="text-sm text-gray-500">{video.name}</span>
              )}
            </div>
            {video && !verified && (
              <div className="mt-4">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={sendOTP}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Send Verification Code
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={verifyOTP}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Verify
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? (
              <Upload className="h-5 w-5 animate-spin" />
            ) : (
              'Submit Question'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion;