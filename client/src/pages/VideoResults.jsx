import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { dotSpinner } from 'ldrs';
import Navbar from '../components/Navbar';
import { DataGrid } from '@mui/x-data-grid';

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
          console.log('Results:', response.data);
          setIsProcessing(false);
          const newResultsArray = Object.entries(response.data).map(([key, value]) => ({
            count : value[1]?.count,
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
    }, 1000);

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

  const {count , frameNumber, imageUrl, details ,location } = results[currentIndex] || {};

  // Prepare the columns for the DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'key', headerName: 'Cattle Label', width: 300 },
    { field: 'value', headerName: 'Action', width: 300 }, // Correctly maps the action
    { field: 'location', headerName: 'Location', width: 300 }, // Correctly maps the location
  ];
  
  // Convert details object to rows
// Convert details object to rows
const rows = Object.entries(details).map(([key, value], index) => ({
  id: index + 1, // Assign unique IDs for each row
  key, // The key is the cattle label (e.g., "Cow 1")
  value: value[0], // The action (e.g., "standing")
  location: value[1], // The location (e.g., "camera 1") frame
}));


  return (
    <div className="bg-gray-900 min-h-screen p-4">
      {/* Navbar */}
      <Navbar 
        trendType={trendType}
        setTrendType={setTrendType}
        date={date}
        setDate={setDate}
      />
  
      {/* Reset Frames button (Top-right corner) */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 font-sans-xl"
          onClick={resetCompletedFrames}
        >
          Reset Frames
        </button>
      </div>
  
{/* Main Content (Image and DataGrid) */}
<div className="flex justify-between">
  {/* Image on the left */}
  <div className="w-1/2 pr-4 flex flex-col items-center">
    {imageUrl ? (
      <img
        src={"http://127.0.0.1:5000" + imageUrl}
        alt={`Frame ${frameNumber}`}
        className="rounded-lg shadow-md"
        style={{ width: '80%', height: '80%' }} // Fixed size for the image
      />
    ) : (
      <p className="text-[#e2e8f0]">No image available</p>
    )}
  </div>
  
{/* DataGrid on the right */}
<div className="w-1/2 pl-4 flex justify-center items-start"> {/* Use items-start for better alignment */}
  {details && (
    <div className="flex flex-col items-center" style={{ height: '80%', width: 'fit-content' }}>
      <h1 className='text-white p-1 m-1 text-lg'>Serial number: {count}</h1>
      <h1 className='text-white p-1 m-1 text-lg'>Frame Number: {frameNumber}</h1>
      
      {/* Wrap DataGrid in a div with flex-grow to take the remaining space */}
      <div style={{ height: '90%', width: '100%' }}> {/* Ensure DataGrid takes full width */}
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          sx={{
            '& .MuiDataGrid-cell': {
              color: 'white', // Text color for cells
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#374151', // Header background color
              color: 'white', // Header text color
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: '#374151', // Footer background color
            },
          }}
        />
      </div>
    </div>
  )}
</div>


      </div>
    </div>
  );
}  

export default VideoResults;