import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { "Period": "2022-08-10", "Feeding Frequency": 90 },
  { "Period": "2022-08-11", "Feeding Frequency": 88 },
  { "Period": "2022-08-12", "Feeding Frequency": 92 },
  // Add more data points...
];

const FeedingFrequencyChart = () => (
  <ResponsiveContainer width="100%" height={400}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="Period" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="Feeding Frequency" stroke="#8884d8" fill="#8884d8" />
    </AreaChart>
  </ResponsiveContainer>
);

export default FeedingFrequencyChart;
