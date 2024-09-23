import React from "react";
import { useNavigate } from "react-router-dom";

const getProgressBarColor = (title) => {
  switch (title) {
    case 'Lying Less Than 8 Hours':
      return 'bg-blue-500'; // Blue for Lying Less Than 8 Hours
    case 'Lying More Than 12 Hours':
      return 'bg-green-500'; // Green for Lying More Than 12 Hours
    case 'Eating Less Than 3 Hours':
      return 'bg-yellow-500'; // Yellow for Eating Less Than 3 Hours
    case 'Eating More Than 6 Hours':
      return 'bg-orange-500'; // Orange for Eating More Than 6 Hours
    case 'Standing Less Than 4 Hours':
      return 'bg-red-500'; // Red for Standing Less Than 4 Hours
    case 'Standing More Than 8 Hours':
      return 'bg-purple-500'; // Purple for Standing More Than 8 Hours
    default:
      return 'bg-gray-500'; // Default color for any unrecognized titles
  }
};




const ProgressCard = ({ title, data, trendType, date, totalCows = 50 }) => {
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  const cowsInCategory = data ? data.length : 0;
  const progress = cowsInCategory > 0 ? (cowsInCategory / totalCows) * 100 : 0;

  const handleClick = () => {
    // Navigate to the cow details page with the cow IDs as state
    navigate('/cow-details', { state: { title, cows: data, trendType, date } });
  };




  return (
    <div
      className="bg-gray-700 shadow-md rounded-lg p-4 text-center text-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick} // Handle click to navigate
    >
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {/* Horizontal Progress Bar with dynamic color */}
      <div className="w-full bg-gray-900 rounded-full h-4 mb-4">
        <div
          className={`h-4 rounded-full ${getProgressBarColor(title)}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-2xl font-bold">{Math.round(progress)}%</p>
      <p className="text-gray-300">Cows in this category: {cowsInCategory}</p>
    </div>
  );
};
export default  ProgressCard;
