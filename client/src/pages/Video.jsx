import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoUpload from "../components/VideoUpload";
import DrawZone from "../components/DrawZone";
import Navbar from "../components/Navbar";
const Video = () => {
  const [zoneSaved, setZoneSaved] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState(false);
  const navigate = useNavigate();
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');

  // Handle successful zone save
  const handleZoneSuccess = () => {
    setZoneSaved(true);
    // Navigate to video results path after zone is successfully saved
    navigate("/video-results");
  };


  return (
    <div className="bg-gray-900  min-h-screen p-[1px]">
    <Navbar 
          trendType={trendType}
          setTrendType={setTrendType}
          date={date}
          setDate={setDate}
        />

    <div className="min-h-screen p-4 flex">
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
    </div>
  );
};

export default Video;