import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

const Linechart = ({ standingHours, eatingHours }) => {
  const xAxisData = Array.from({ length: standingHours.length }, (_, i) => i + 1);

  return (
    <LineChart
      xAxis={[{
        data: xAxisData,
        label: 'Date',
        tickFormat: (value) => Math.round(value), // Ensures x-axis labels are integers
      }]}
      yAxis={[{
        label: 'Hours',
        tickFormat: (value) => Math.round(value), // Ensures y-axis labels are integers
      }]}
      series={[
        {
          data: standingHours,
          label: 'Standing Hours',
          color: 'blue',
        },
        {
          data: eatingHours,
          label: 'Eating Hours',
          color: 'green',
        },
      ]}
      width={500}
      height={300}
    />
  );
};

export default Linechart;