import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const BehaviorFrequencyAnalysis = ({ data }) => {
  // Calculate behavior frequency
  const behaviorFrequency = data.reduce((acc, curr) => {
    acc[curr.BehaviorType] = (acc[curr.BehaviorType] || 0) + 1;
    return acc;
  }, {});

  // Convert behaviorFrequency object to array format for the chart
  const chartData = Object.entries(behaviorFrequency).map(([behavior, count]) => ({
    id: behavior,
    label: behavior,
    value: count,
  }));

  return (
    <div>
        <div className='bg-red-100  w-fit'>

        <h3>Behavior Frequency Analysis (Pie Chart)</h3>
        <div style={{ height: 400, width: '100%' }}>
            <PieChart
            series={[{
                data: chartData,
                outerRadius: '70%',
                label: true,  // Enables labels on the pie slices
            }]}
            width={400}
            height={400}
            />
        </div>
        </div>
    </div>
  );
};

export default BehaviorFrequencyAnalysis;
