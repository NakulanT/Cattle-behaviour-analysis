import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoUpload from "../components/VideoUpload";
import DrawZone from "../components/DrawZone";

const Video = () => {
  const [zoneSaved, setZoneSaved] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState(false);
  const navigate = useNavigate();

  // Handle successful zone save
  const handleZoneSuccess = () => {
    setZoneSaved(true);
    // Navigate to video results path after zone is successfully saved
    navigate("/video-results");
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4 flex">
      {/* Container for the two components */}
        {!videoUploadStatus ? (
          <div className="w-full p-4">
            <VideoUpload
              setVideoUploadStatus={setVideoUploadStatus}
            />
          </div>
        ) : (
          <div className="w-[100%] p-4">
            <DrawZone setZoneSaved={handleZoneSuccess} />
          </div>
        )}
    </div>
  );
};

export default Video;