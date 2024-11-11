import React from "react";
import { useNavigate } from "react-router-dom";

const getProgressBarColor = (title, isLightTheme) => {
  const colors = {
    Lameness: isLightTheme ? 'bg-blue-300' : 'bg-blue-500',
    'Postpartum Fatigue or Metabolic Disorders': isLightTheme ? 'bg-green-300' : 'bg-green-500',
    'Anorexia or Social Dominance Issues': isLightTheme ? 'bg-yellow-300' : 'bg-yellow-500',
    'Nutritional Deficiency or Anxiety': isLightTheme ? 'bg-orange-300' : 'bg-orange-500',
    'Weakness or Fatigue': isLightTheme ? 'bg-red-300' : 'bg-red-500',
    'Heat Stress': isLightTheme ? 'bg-purple-300' : 'bg-purple-500',
    default: isLightTheme ? 'bg-gray-300' : 'bg-gray-500',
  };

  return colors[title] || colors.default;
};

const ProgressCard = ({ title, data, trendType, date, totalCows = 500, isLightTheme }) => {
  const navigate = useNavigate();
  const cowsInCategory = data ? data.length : 0;
  const progress = cowsInCategory > 0 ? (cowsInCategory / totalCows) * 100 : 0;

  const handleClick = () => {
    navigate('/cow-details', { state: { title, cows: data, trendType, date } });
  };

  return (
    <div
      className={`shadow-md rounded-lg p-4 text-center transition-shadow cursor-pointer flex flex-col items-center 
                  ${isLightTheme ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-200'}`}
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
      <div className={`w-full rounded-full h-4 mb-4 ${isLightTheme ? 'bg-gray-300' : 'bg-gray-800'}`}>
        <div
          className={`h-4 rounded-full ${getProgressBarColor(title, isLightTheme)}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Display of percentage and cow count */}
      <div className="text-center">
        <p className="text-2xl font-bold">{Math.round(progress)}%</p>
        <p className={isLightTheme ? 'text-gray-800' : 'text-gray-300'}>
        {/* <p className='text-gray-800' 'text-gray-300'}> */}
          Cows in this category: {cowsInCategory}
        </p>
      </div>
    </div>
  );
};

export default ProgressCard;
