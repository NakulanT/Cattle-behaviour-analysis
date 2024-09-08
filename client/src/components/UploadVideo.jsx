import React, { useState } from 'react';
import axios from 'axios';

const VideoUpload = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('/static/sampleImage.png');

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
      // Upload the video file
      await axios.post('http://127.0.0.1:5000/zone_video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Reset the component state after a short delay
      setTimeout(() => {
        setVideoFile(null);
        setUploadStatus('');
        setImageUrl('/static/sampleImage.png');
      }, 3000); // 3-second delay to show the result before resetting
    } catch (error) {
      setUploadStatus('Error uploading video.');
    }
  };

  return (
    <div>
      <h1>Upload Video</h1>
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleFileChange} 
      />
      <button onClick={handleUpload}>Upload Video</button>
      <p>{uploadStatus}</p>
      <img src={imageUrl} alt="Video Frame" />
    </div>
  );
};

export default VideoUpload;
