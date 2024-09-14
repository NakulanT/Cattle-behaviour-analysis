import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CowDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, cows, trendType, date } = location.state || {}; // Destructure date here
  // console.log(title, cows, trendType );

  // console.log("trendType");
  // console.log(trendType);
  // console.log(trendType);
  // console.log("date");
  // console.log(date);
  // console.log(date);
  // console.log(date);
  
  
  // If no cow data is provided, redirect back to the main page
  if (!cows) {
    navigate('/');
    return null;
  }
  const handleCowClick = (cowId) => {
    // Pass cowId, trendType as period, and date correctly
    navigate(`/cow/${cowId}`, { state: { period: trendType, date: date } });
  };
  

  return (
    <div className="container mx-auto p-4 bg-gray-800 text-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-white">{title}</h1>

      <div className="bg-gray-700 shadow-md rounded-lg p-4 text-center text-gray-200">
        <h2 className="text-xl font-semibold mb-4">Cow IDs in this category</h2>
        {cows && cows.length > 0 ? (
          <ul className="list-none text-left">
            {cows.map((cow, index) => (
              <li
                key={index}
                className="mb-2 flex items-center cursor-pointer"
                onClick={() => handleCowClick(cow['Cow ID'])} // Handle click
              >
                <span className="mr-2 text-xl">🐄</span> {/* Cow emoji */}
                {cow['Cow ID']}
              </li>
            ))}
          </ul>
        ) : (
          <p>No cows available in this category.</p>
        )}

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
          onClick={() => navigate('/')}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default CowDetailPage;
