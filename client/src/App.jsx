import React from 'react';
import Dashboard1 from './pages/Dashboard1';
import './App.css';
import {BrowserRouter,Routes, Route} from 'react-router-dom'
import CowDetailPage from './pages/CowDetailPage';
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

          <Route exact path="/upload" element = { <Video />} /> 
          <Route exact path="/video-results" element = { <VideoResults />} />
          <Route exact path="/sample" element = {<Sample />} />
          {/* <Route path="/cow-details" component={CowDetailPage} /> */}

      </Routes>
    </BrowserRouter>
  
  );
}

export default App;
