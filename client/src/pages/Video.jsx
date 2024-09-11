import React, { useState } from "react";
import VideoUpload from "../components/VideoUpload";
import DrawZone from "../components/DrawZone";

const Video = () => {
  const [zoneSaved, setZoneSaved] = useState(false);

  return (
    <div className="bg-gray-900 min-h-screen p-4 flex">
      {/* Container for the two components */}
      <div className="flex w-full">
        {/* Left side: VideoUpload */}
        <div className="w-1/2 p-4">
          <VideoUpload zoneSaved={zoneSaved} />
        </div>
        
        {/* Right side: DrawZone */}
        <div className="w-1/2 p-4">
          <DrawZone setZoneSaved={setZoneSaved} />
        </div>
      </div>
    </div>
  );
};

export default Video;
