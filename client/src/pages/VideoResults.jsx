import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { dotSpinner } from 'ldrs'
import Navbar from '../components/Navbar';

dotSpinner.register()


const VideoResults = () => {
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedFrames, setCompletedFrames] = useState(new Set());
  const [error, setError] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [trendType, setTrendType] = useState('daily');
  const [date, setDate] = useState('2022-09-15');

  // Function to reset completed frames
  const resetCompletedFrames = () => {
    setCompletedFrames(new Set()); // Reset the completed frames to an empty set
    setCurrentIndex(0); // Reset the current frame index to 0
    setIsFinished(false); // Reset finished state
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/video_results');

        if (response.data.status === 'processing') {
          setIsProcessing(true);
        } else {
          setIsProcessing(false);
          const newResultsArray = Object.entries(response.data).map(([key, value]) => ({
            frameNumber: value[1]?.frameNumber,
            imageUrl: value[1]?.image_url,
            details: value[0],
          }));

          // Filter results to exclude completed frames
          const filteredResults = newResultsArray.filter(result => !completedFrames.has(result.frameNumber));
          
          setResults(prevResults => [
            ...prevResults,
            ...filteredResults
          ]);
        }
      } catch (error) {
        console.error('Error fetching video results:', error);
        setError('Error fetching results');
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 5000);

    return () => clearInterval(interval);
  }, [completedFrames]);

  useEffect(() => {
    if (results.length === 0 || isFinished) return;

    const displayInterval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        if (completedFrames.size >= results.length) {
          setIsFinished(true);
          clearInterval(displayInterval); // Stop interval if finished
          return prevIndex;
        }

        // Find the next index that has not been completed
        let nextIndex = prevIndex;
        do {
          nextIndex = (nextIndex + 1) % results.length;
        } while (completedFrames.has(results[nextIndex]?.frameNumber));

        setCompletedFrames(prev => new Set([...prev, results[nextIndex]?.frameNumber]));
        return nextIndex;
      });
    }, 100000);

    return () => clearInterval(displayInterval);
  }, [results, completedFrames, isFinished]);

  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen p-4 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-[#e2e8f0] mr-8">Error fetching results</h1>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="bg-gray-900 min-h-screen p-4 flex items-center justify-center">
        <l-dot-spinner
          size="40"
          speed="0.9"
          color="white"
        ></l-dot-spinner>
        <h1 className="text-2xl font-bold text-[#e2e8f0] ml-4">Processing video, please wait...</h1>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="bg-gray-900 min-h-screen p-4">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">End of Results</h1>
        <p className="text-[#e2e8f0]">All frames have been processed.</p>
        {/* Button to reset completed frames */}
        <button
          className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
          onClick={resetCompletedFrames}
        >
          Reset Frames
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-gray-900 min-h-screen p-4">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Loading results...</h1>
      </div>
    );
  }

  const { frameNumber, imageUrl, details } = results[currentIndex] || {};

  return (
    <div className="bg-gray-900 min-h-screen p-4 ">
        <Navbar 
          trendType={trendType}
          setTrendType={setTrendType}
          date={date}
          setDate={setDate}
        />
      <h1 className="text-2xl font-bold mb-4 text-[#e2e8f0] justify-center text-center">Video Analysis Results</h1>
      
      {/* Button to reset completed frames */}
      <button
        className="mb-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-700 font-sans-xl"
        onClick={resetCompletedFrames}
      >
        Reset Frames
      </button>

      {imageUrl ? (
        <div className="mb-4">
          <img
            src={"http://127.0.0.1:5000" + imageUrl}
            alt={`Frame ${frameNumber}`}
            className="w-full mx-auto rounded-lg shadow-md"
            style={{ width: '640px', height: '640px' }}
          />
        </div>
      ) : (
        <p className="text-[#e2e8f0]">No image available</p>
      )}
      {details && (
        <div className="text-[#e2e8f0] text-center">
          <h2 className="text-lg font-semibold mb-2">Results for Frame {frameNumber}</h2>
          <ul className="list-disc list-inside">
            {Object.entries(details).map(([key, value]) => (
              <li key={key} className="mb-1">
                <span className="font-semibold">{key}:</span> {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoResults;