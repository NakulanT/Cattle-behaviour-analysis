import React, { useState } from 'react';
import axios from 'axios';

const VideoUpload = ({ setVideoUploadStatus }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setVideoFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setUploadStatus('Please select a video file first.');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      await axios.post('http://127.0.0.1:5000/zone_video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setVideoUploadStatus(true); // Notify that the video has been uploaded successfully
      setUploadStatus('Video uploaded successfully.');
      // Optionally clear the video file after successful upload
      // setVideoFile(null);
    } catch (error) {
      setUploadStatus('Error uploading video.');
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold mb-4 text-[#e2e8f0]">Upload Video</h1>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-[#e2e8f0] border border-gray-600 rounded-lg cursor-pointer bg-[#0f172a] focus:outline-none mb-4"
      />
      <button
        onClick={handleUpload}
        className="w-full py-2 text-lg font-semibold rounded-lg bg-[#38bdf8] text-[#0f172a] hover:bg-blue-400 transition duration-300 ease-in-out"
      >
        Upload Video
      </button>
      <p className="text-[#38bdf8] text-sm mt-2">{uploadStatus}</p>
    </div>
  );
};

export default VideoUpload;