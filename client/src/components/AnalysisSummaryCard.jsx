import React from 'react';

const AnalysisSummaryCard = ({ title, value, unit }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-xs mx-auto">
      <h2 className="text-gray-700 text-xl font-semibold mb-2">{title}</h2>
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-blue-500">{value}</span>
        {unit && <span className="text-xl text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

export default AnalysisSummaryCard;
