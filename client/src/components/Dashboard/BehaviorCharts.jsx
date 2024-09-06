import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const BehaviorDurationChart = ({ data }) => (
  <BarChart width={600} height={400} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="CattleID" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="TotalDuration" fill="#8884d8" />
  </BarChart>
);

export const AverageBehaviorDurationChart = ({ data }) => (
  <LineChart width={600} height={400} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="Breed" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="AverageDuration" stroke="#82ca9d" />
  </LineChart>
);
