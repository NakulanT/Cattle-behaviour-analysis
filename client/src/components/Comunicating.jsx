import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CameraIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FcCameraIdentification } from "react-icons/fc";

function Comunicating({ isLightTheme }) {
  const [currentTotal, setCurrentTotal] = useState(50);
  const [initialTotal] = useState(50);

  useEffect(() => {
    const eventSource = new EventSource('http://127.0.0.1:5000/stream');
    eventSource.onmessage = function (event) {
      setCurrentTotal(parseInt(event.data));
    };
    return () => {
      eventSource.close();
    };
  }, []);

  const difference = initialTotal - currentTotal;

  // Define styles based on theme
  const containerStyle = isLightTheme
    ? "bg-gray-100 text-gray-800 rounded-lg p-6 shadow-lg flex flex-col"
    : "bg-gray-800 text-white rounded-lg p-6 shadow-lg flex flex-col";

  const cardStyle = isLightTheme
    ? "bg-gray-200 rounded-lg p-4 shadow-md flex flex-col justify-between"
    : "bg-gray-700 rounded-lg p-4 shadow-md flex flex-col justify-between";

  return (
    <div>
      {/* Outer Box */}
      <div className={containerStyle}>
        <div className="text-2xl font-bold mb-6 flex items-center gap-3">
          <h2>Detection Status </h2>
          <FcCameraIdentification className='text-3xl' />
        </div>

        <div className="grid gap-6">
          {/* Total Listed Cattle Card */}
          <div className={cardStyle}>
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-green-400 mr-2" />
              <span className="font-medium text-lg">Total Listed Cattle:</span>
            </div>
            <span className="font-bold text-2xl">{initialTotal}</span>
          </div>

          {/* In Frame Card */}
          <div className={cardStyle}>
            <div className="flex items-center mb-2">
              <CameraIcon className="h-6 w-6 text-blue-400 mr-2" />
              <span className="font-medium text-lg">In Frame:</span>
            </div>
            <span className="font-bold text-2xl">{currentTotal}</span>
          </div>

          {/* Out of Detection Card */}
          <div className={cardStyle}>
            <div className="flex items-center mb-2">
              <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
              <span className="font-medium text-lg">Out of Detection:</span>
            </div>
            <span className="font-bold text-2xl">{difference}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Comunicating;
