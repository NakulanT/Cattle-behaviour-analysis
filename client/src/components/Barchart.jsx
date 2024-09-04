import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

const Barchart = ({ data }) => {
  const chartData = Object.keys(data).map((key, index) => ({
    id: index,
    value: data[key],
    label: key,
  }));

  return (
    <BarChart
      dataset={chartData}
      series={[
        {
          dataKey: 'value',
        },
      ]}
      xAxis={[
        {
          dataKey: 'label',
          scaleType: 'band', // Set the x-axis scale type to 'band'
          label: 'Actions',
        },
      ]}
      yAxis={[
        {
          label: 'Count',
        },
      ]}
      height={300}
      width={600}
    />
  );
}

export default Barchart;