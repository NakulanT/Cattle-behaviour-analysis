import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CameraIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'; // Import Heroicons for v2

function Comunicating() {
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

  return (
    <div className="w-full rounded-lg shadow-lg bg-gray-800 p-6 text-white transition-all duration-500 ease-in-out transform hover:scale-105">
      <h2 className="text-xl font-bold mb-4">Detection Status</h2>
      <div className="flex flex-col mb-4">
        <div className="flex items-center mb-2">
          <CheckCircleIcon className="h-6 w-6 text-green-400 mr-2" />
          <span className="font-medium text-xl">Total Listed Cattle:</span>
        </div>
        <span className="font-bold text-4xl">{initialTotal}</span>
      </div>

      <div className="flex flex-col mb-4">
        <div className="flex items-center mb-2">
          <CameraIcon className="h-6 w-6 text-blue-400 mr-2" />
          <span className="font-medium text-xl">In Frame:</span>
        </div>
        <span className="font-bold text-4xl">{currentTotal}</span>
      </div>

      <div className="flex flex-col mb-4">
        <div className="flex items-center mb-2">
          <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
          <span className="font-medium text-xl">Out of Detection:</span>
        </div>
        <span className="font-bold text-4xl">{difference}</span>
      </div>
    </div>
  );
}

export default Comunicating;
