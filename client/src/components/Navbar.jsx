import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChartIcon, HelpCircleIcon } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import TrendControls from '../components/TrendControls';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faAdjust } from '@fortawesome/free-solid-svg-icons';


export default function Navbar({ trendType, setTrendType, date, setDate, isLightTheme, toggleTheme }) {
  const [data, setCowBehaviorData] = useState([]); // Store fetched data
  const [loading, setLoading] = useState(false);   // Loading state
  const [error, setError] = useState(null);        // Error state
  const navigate = useNavigate(); 

  // Fetch cow behavior data when date changes
  useEffect(() => {
    const fetchCowBehaviorData = async () => {
      setLoading(true);
      try {
        const dateObject = new Date(date);
        const formattedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`;

        const apiUrl = formattedDate 
          ? `http://localhost:5000/get_cattle_behavior?date=${formattedDate}`
          : `http://localhost:5000/get_cattle_behavior`;

        const response = await axios.get(apiUrl);

        if (response.data.error) {
          setError(response.data.error);
          setCowBehaviorData([]);
        } else {
          const mappedData = response.data.map((item) => ({
            'Cow ID': item['Cow ID'],
            'standing': item['Standing Time (min)'],
            'eating': item['Eating Time (min)'],
            'lying': item['Lying Time (min)'],
            'notRecognized': item['Not Recognized Time (min)'],
          }));
          setCowBehaviorData(mappedData);
          setError(null);
        }
      } catch (err) {
        setError('An error occurred while fetching data.'); // Handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchCowBehaviorData();
  }, [date]);

  return (
    <div>
      <nav className={`border-b border-gray-700 p-3 mb-2 ${isLightTheme ? 'bg-gray-800' : 'bg-gray-900'}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="ml-1 text-3xl font-bold text-white ">CATTLE ANALYSIS DASHBOARD</Link>
            </div>
            <div className="flex items-center">
              <TrendControls trendType={trendType} setTrendType={setTrendType} date={date} setDate={setDate} isLightTheme={isLightTheme} />
              
              {/* Theme Toggle Button */}
              <button 
  onClick={toggleTheme} 
  className={`text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isLightTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-600'}`}
>
  {isLightTheme ? (
    <FontAwesomeIcon icon={faAdjust} className="w-5 h-5" aria-hidden="true" />
  ) : (
    <FontAwesomeIcon icon={faLightbulb} className="w-5 h-5" aria-hidden="true" />
  )}
</button>



              <div 
                onClick={() => navigate('/cow-details', { state: { title: 'ALL', cows: data, trendType, date } })}
                className="cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                <BarChartIcon className="h-5 w-5 inline-block mr-1 text-blue-400" />
                Cattles
              </div>

              <Link to="/upload" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <BarChartIcon className="h-5 w-5 inline-block mr-1 text-blue-400" />
                Upload
              </Link>

              <Link to="/help" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <HelpCircleIcon className="h-5 w-5 inline-block mr-1 text-red-400" />
                Help
              </Link>
            </div>
          </div>
          {/* Loading and error messages */}
          {/* {loading && <p className="text-white">Loading data, please wait...</p>} */}
          {/* {error && <p className="text-red-500">{error}</p>} */}
        </div>
      </nav>
    </div>
  );
}
