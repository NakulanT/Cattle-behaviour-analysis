import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CowDetailPage = ({ isLightTheme, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, cows, trendType, date } = location.state || {}; 
  // const [isLightTheme, setIsLightTheme] = useState(true); // State for theme

  // Toggle theme function
 
  if (!cows) {
    navigate('/');
    return null;
  }

  const handleCowClick = (cowId) => {
    navigate(`/cow/${cowId}`, { state: { period: trendType, date: date } });
  };

  // Group cows by Camera Field
  const cowsByCameraField = cows.reduce((acc, cow) => {
    const cameraField = cow['Camera Field'];
    if (!acc[cameraField]) {
      acc[cameraField] = [];
    }
    acc[cameraField].push(cow);
    return acc;
  }, {});

  return (
    <div className='bg-gray-800 max-h-full max-w-full'>
      <Navbar
      isLightTheme={isLightTheme} // Pass theme state
      toggleTheme={toggleTheme} // Pass toggle function
       />
      <div className="min-h-screen w-full bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <div className="container max-w-6xl mx-auto p-4 bg-gray-950 rounded-lg">
          <h1 className="text-3xl font-bold mb-4 text-white text-center">{title}</h1>

          <div className="bg-gray-700 shadow-md rounded-lg p-4 text-center text-gray-200">
            <h2 className="text-2xl font-semibold mb-4">Cow IDs in this category
            </h2>
            
            {Object.keys(cowsByCameraField).length > 0 ? (
              <div>
                {Object.keys(cowsByCameraField).map((cameraField, index) => (
                  <div key={index} className="mb-6">
                    {/* <h3 className="text-xl font-semibold mb-2 text-white">
                      Camera Field: {cameraField}
                    </h3> */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {cowsByCameraField[cameraField].map((cow, cowIndex) => (
                        <div
                          key={cowIndex}
                          className="bg-gray-600 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-500 transition duration-200"
                          onClick={() => handleCowClick(cow['Cow ID'])}
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-5xl mb-2">
                              <span className="text-2xl font-bold text-white mb-2">{cow['Cow ID']}</span>
                              🐄
                            </div> {/* Cow emoji */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No cows available in this category.</p>
            )}

            <button
              className="bg-blue-500 text-white px-6 py-3 rounded-lg mt-6"
              onClick={() => navigate('/')}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CowDetailPage;
