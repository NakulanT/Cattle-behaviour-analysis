import React, { useState } from 'react';
import Piechart from './components/Piechart';
import Barchart from './components/Barchart';
import Linechart from './components/Linechart';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import './App.css';
import ProgressBar from './components/Progressbar';

function App() {
  const [count, setCount] = useState(0);
  const data = {
    "Standing": 12,
    "eating": 20,
    "lying down": 5,
  };

  const standingHours = [12, 14, 16, 17, 13, 14.5];
  const eatingHours = [4, 6, 7, 5, 4, 6.3];

  return (
    <>
      <h1 className="text-3xl font-bold underline">
        Hello world!
      </h1>
      <ProgressBar current={5} total={100} color="orange" />
      <ProgressBar current={8} total={100} color="red" />
      <ProgressBar current={30} total={100} color="violet" />
      <Dashboard />
      <div className="border-t border-black w-200% my-4"></div>
      <Piechart data={data} />
      <Barchart data={data} />
      <Linechart standingHours={standingHours} eatingHours={eatingHours} />
      <Upload />
    </>
  );
}

export default App;
