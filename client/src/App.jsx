import React, { useState } from 'react'; // Import useState
import Dashboard1 from './pages/Dashboard1';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CowDetailPage from './pages/CowDetailPage';
import Video from './pages/Video';
import VideoResults from './pages/VideoResults';
import Sample from './pages/Sample';
import CowInfoPage1 from './pages/CowInfoPage1';

function App() {
  const [isLightTheme, setIsLightTheme] = useState(false); // State for theme

  // Toggle theme function
  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  return (
    <BrowserRouter>
      <div className={isLightTheme ? 'light-theme' : 'dark-theme'}> {/* Apply theme class */}
        <Routes>
          <Route 
            exact 
            path="/" 
            element={<Dashboard1 isLightTheme={isLightTheme} toggleTheme={toggleTheme} />} // Pass props
          />
          <Route exact path="/cow-details"
          
          element={<CowDetailPage isLightTheme={isLightTheme} toggleTheme={toggleTheme} />} 
          />
          <Route path="/cow/:cowId" 
          element={<CowInfoPage1 />} />  {/* New route */}
          <Route exact path="/upload" element={<Video isLightTheme={isLightTheme} toggleTheme={toggleTheme} />} /> 
          <Route exact path="/video-results" element={<VideoResults isLightTheme={isLightTheme} toggleTheme={toggleTheme} />} />
          <Route exact path="/sample" element={<Sample isLightTheme={isLightTheme} toggleTheme={toggleTheme} />} />
          {/* <Route path="/cow-details" component={CowDetailPage} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
