import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const Piechart = ({ data }) => {
  // Handle case where data is undefined or null
  if (!data || Object.keys(data).length === 0) {
    return <div className="text-white">No data available</div>; // Show message if no data
  }

  // Convert data to the format expected by the PieChart component
  const chartData = Object.keys(data).map((key, index) => ({
    id: index,
    value: data[key],
    label: key,
  }));

  // Parameters for the pie chart
  const pieParams = {
    series: [
      {
        data: chartData,
        highlightScope: { fade: 'global', highlight: 'item' },
        faded: { innerRadius: 30, additionalRadius: -30, color: 'blue' },
        labels: false, // Remove this line to show labels
      }
    ],
    slotProps: { legend: { hidden: true } },
    height: 300,
    width: 300, // Make sure the PieChart has width and height that fit within the container
  };

  return (
    <div className='bg-gray-800 p-6 rounded-lg h-full w-full flex items-center justify-center'>
      <div className='flex justify-center items-center'>
        <PieChart {...pieParams} />
      </div>
    </div>
  );
};

export default Piechart;



// import React from 'react';
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const COLORS = ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'];

// const Piechart = ({ data }) => {
//   // Convert data to the format expected by the PieChart component
//   const chartData = Object.keys(data).map((key) => ({
//     name: key,
//     value: data[key],
//   }));

//   // Check if there is valid data
//   if (!chartData || chartData.length === 0) {
//     return <p className="text-white">No data available for the pie chart</p>;
//   }

//   return (
//     <div className="bg-gray-800 p-6 rounded-lg w-full h-full flex items-center justify-center">
//       <ResponsiveContainer width="100%" height="100%">
//         <PieChart>
//           <Pie
//             data={chartData}
//             cx="50%"
//             cy="50%"
//             innerRadius={50}
//             outerRadius={100}
//             fill="#8884d8"
//             dataKey="value"
//             label
//           >
//             {chartData.map((entry, index) => (
//               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//             ))}
//           </Pie>
//           <Tooltip />
//           <Legend />
//         </PieChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default Piechart;
