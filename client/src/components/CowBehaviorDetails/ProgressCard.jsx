import React from "react";
import { useNavigate } from "react-router-dom";

const getProgressBarColor = (title) => {
  switch (title) {
    case 'Lameness':
      return 'bg-blue-500';
    case 'Postpartum Fatigue or Metabolic Disorders':
      return 'bg-green-500';
    case 'Anorexia or Social Dominance Issues':
      return 'bg-yellow-500';
    case 'Nutritional Deficiency or Anxiety':
      return 'bg-orange-500';
    case 'Weakness or Fatigue':
      return 'bg-red-500';
    case 'Heat Stress':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const ProgressCard = ({ title, data, trendType, date, totalCows = 50 }) => {
  const navigate = useNavigate();
  const cowsInCategory = data ? data.length : 0;
  const progress = cowsInCategory > 0 ? (cowsInCategory / totalCows) * 100 : 0;

  const handleClick = () => {
    navigate('/cow-details', { state: { title, cows: data, trendType, date } });
  };

  return (
    <div
      className="bg-gray-700 shadow-md rounded-lg p-4 text-center text-gray-200 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center"
      onClick={handleClick}
    >
      {/* Title with proper alignment and overflow handling */}
      <h2
        className="text-xl font-semibold mb-4 w-full text-center truncate"
        style={{
          whiteSpace: 'nowrap', // Ensures that the title doesn't wrap to a new line
          overflow: 'hidden',   // Prevents overflow of the text outside the container
          textOverflow: 'ellipsis', // Displays "..." if the text is too long
        }}
      >
        {title}
      </h2>

      {/* Horizontal Progress Bar with dynamic color */}
      <div className="w-full bg-gray-900 rounded-full h-4 mb-4">
        <div
          className={`h-4 rounded-full ${getProgressBarColor(title)}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Display of percentage and cow count */}
      <div className="text-center">
        <p className="text-2xl font-bold">{Math.round(progress)}%</p>
        <p className="text-gray-300">Cows in this category: {cowsInCategory}</p>
      </div>
    </div>
  );
};

export default ProgressCard;
