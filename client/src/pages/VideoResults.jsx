import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VideoResults = () => {
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedFrames, setCompletedFrames] = useState(new Set());
  const [error, setError] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/video_results');
        // console.log('Fetched results:', response.data);

        // Convert the object to an array of [key, value] pairs
        const newResultsArray = Object.entries(response.data).map(([key, value]) => ({
          frameNumber: value[1]?.frameNumber,
          imageUrl: value[1]?.image_url,
          details: value[0],
        }));
        console.log(completedFrames);

        // console.log('Processed results array:', newResultsArray);

        // Update results with new frames, excluding already completed ones
        setResults(prevResults => [
          ...prevResults,
          ...newResultsArray.filter(result => !completedFrames.has(result.frameNumber))
        ]);
      } catch (error) {
        console.error('Error fetching video results:', error);
        setError('Error fetching results');
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 5000); // Fetch data every 5 seconds

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, [completedFrames]);

  useEffect(() => {
    if (results.length === 0 || isFinished) return;

    const displayInterval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        // Check if all frames are completed
        if (completedFrames.size >= results.length) {
          setIsFinished(true);
          clearInterval(displayInterval); // Stop interval if finished
          return prevIndex; // Maintain current index
        }

        // Update index and mark frame as completed
        const nextIndex = (prevIndex + 1) % results.length;
        setCompletedFrames(prev => new Set([...prev, results[nextIndex].frameNumber]));
        return nextIndex;
      });
    }, 1000); // Update display every 1 second

    return () => clearInterval(displayInterval); // Clean up the interval on component unmount
  }, [results, completedFrames, isFinished]);

  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen p-4">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Error fetching results</h1>
        <p className="text-[#e2e8f0]">{error}</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="bg-gray-900 min-h-screen p-4">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">End of Results</h1>
        <p className="text-[#e2e8f0]">All frames have been processed.</p>
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
      <h1 className="text-2xl font-bold mb-4 text-[#e2e8f0] justify-center text-center">Video Analysis Results</h1>
      {imageUrl ? (
        <div className="mb-4">
        <img
        src={"http://127.0.0.1:5000" + imageUrl}
        alt={`Frame ${frameNumber}`}
        className="w-full  mx-auto rounded-lg shadow-md"
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
