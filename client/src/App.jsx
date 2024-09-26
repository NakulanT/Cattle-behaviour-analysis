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
import CowInfoPage from './components/CowInfoPage';
import Video from './pages/Video';
import VideoResults from './pages/VideoResults';
import Sample from './pages/Sample';
import CowInfoPage1 from './pages/CowInfoPage1';

function App() {

  return (
    <BrowserRouter>
      <Routes>
          <Route exact path="/" element={<Dashboard1/>} />
          <Route exact path="/cow-details" element={<CowDetailPage/>} />
          <Route path="/cow/:cowId" element={<CowInfoPage1 />} />  {/* New route */}

          <Route exact path="/video" element = { <Video />} /> 
          <Route exact path="/video-results" element = { <VideoResults />} />
          <Route exact path="/sample" element = {<Sample />} />
          {/* <Route path="/cow-details" component={CowDetailPage} /> */}

      </Routes>
    </BrowserRouter>
  
  );
}

export default App;
