import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CameraIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'; // Import Heroicons for v2

function Comunicating() {
  const [currentTotal, setCurrentTotal] = useState(50);  // Default total is 50
  const [initialTotal] = useState(50);  // Initial fixed total

  // Fetch the current total from the server (Flask) every 10 seconds
  useEffect(() => {
    const eventSource = new EventSource('http://127.0.0.1:5000/stream');

    // Listen for incoming data from Flask
    eventSource.onmessage = function (event) {
      setCurrentTotal(parseInt(event.data));  // Set current total as received from Flask
    };

    return () => {
      eventSource.close();  // Cleanup on unmount
    };
  }, []);

  // Calculate the difference between the initial and current total
  const difference = initialTotal - currentTotal;

  return (
      <div className="w-[50%] rounded-lg shadow-lg bg-gray-800 p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Detection Status</h2>

        {/* Total Listed Cattle */}
        <div className="flex flex-col   mb-4">
          <div className="flex items-center mb-2">
            <CheckCircleIcon className="h-6 w-6 text-green-400 mr-2 " />  {/* Icon for Listed Cattle */}
            <span className="font-medium text-xl  ">Total Listed Cattle:</span>
          </div>
          <span className="font-bold text-4xl">{initialTotal}</span>
        </div>

        {/* In Frame */}
        <div className="flex flex-col   mb-4">
          <div className="flex items-center mb-2">
            <CameraIcon className="h-6 w-6 text-blue-400 mr-2" />  {/* Icon for In Frame */}
            <span className="font-medium text-xl">In Frame:</span>
          </div>
          <span className="font-bold text-4xl">{currentTotal}</span>
        </div>

        {/* Out of Detection */}
        <div className="flex flex-col  mb-4">
          <div className="flex items-center mb-2">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />  {/* Icon for Out of Detection */}
            <span className="font-medium text-xl">Out of Detection:</span>
          </div>
          <span className="font-bold text-4xl">{difference}</span>
        </div>
      </div>
  );
}

export default Comunicating;
