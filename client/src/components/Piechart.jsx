import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const Piechart = ({ data }) => {
  const chartData = Object.keys(data).map((key, index) => ({
    id: index,
    value: data[key],
    label: key,
  }));

  return (
    <PieChart
      series={[
        {
          data: chartData,
          highlightScope: { fade: 'global', highlight: 'item' },
          faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
        },
      ]}
      height={200}
      width={500}
    />
  );
}

export default Piechart;
