import React, { useState } from 'react';
// import Piechart from './components/Piechart';
// import Barchart from './components/Barchart';
// import Linechart from './components/Linechart';
import Upload from './pages/Upload';
import Dashboard1 from './pages/Dashboard1';
import './App.css';
import ProgressBar from './components/Progressbar';
// import DrawZone from './components/Drawzone';
import UploadVideo from './components/UploadVideo';
import {BrowserRouter,Routes, Route} from 'react-router-dom'
import CowDetailPage from './pages/CowDetailPage';
import CowInfoPage from './components/CowInfoPage';


function App() {

  return (
    <BrowserRouter>
      <Routes>
          <Route exact path="/" element={<Dashboard1/>} />
          <Route exact path="/cow-details" element={<CowDetailPage/>} />
          <Route path="/cow/:cowId" element={<CowInfoPage />} />  {/* New route */}

          {/* <Route path="/cow-details" component={CowDetailPage} /> */}

      </Routes>
    </BrowserRouter>
  
  );
}

export default App;
