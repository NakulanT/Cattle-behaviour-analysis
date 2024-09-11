import React, { useState } from 'react';
// import Piechart from './components/Piechart';
// import Barchart from './components/Barchart';
// import Linechart from './components/Linechart';
import Upload from './pages/Upload';
import Dashboard1 from './pages/Dashboard1';
import './App.css';
import ProgressBar from './components/Progressbar';
// import DrawZone from './components/Drawzone';
import UploadVideo from './components/VideoUpload';
import {BrowserRouter,Routes, Route} from 'react-router-dom'
import CowDetailPage from './pages/CowDetailPage';
import Video from './pages/Video';
import VideoResults from './pages/VideoResults';


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
    <BrowserRouter>
      <Routes>
          <Route exact path="/" element={<Dashboard1/>} />
          <Route exact path="/cow-details" element={<CowDetailPage/>} />
          <Route exact path="/video" element = { <Video />} /> 
          <Route exact path="/video-results" element = { <VideoResults />} />
          {/* <Route path="/cow-details" component={CowDetailPage} /> */}

      </Routes>
    </BrowserRouter>
  
  );
}

export default App;
