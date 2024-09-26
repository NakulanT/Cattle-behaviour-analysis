import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import { BarChartIcon, HelpCircleIcon } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import TrendControls from '../components/TrendControls';

export default function Navbar({ trendType, setTrendType, date, setDate }) {
  const [data, setCowBehaviorData] = useState([]); // Store fetched data
  const [loading, setLoading] = useState(false);   // Loading state
  const [error, setError] = useState(null);        // Error state
  const navigate = useNavigate(); 

  // Fetch cow behavior data when date changes
  useEffect(() => {
    const fetchCowBehaviorData = async () => {
      setLoading(true);
      try {
        // Fetching API data based on the selected date
        const dateObject = new Date(date);
        const formattedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`;

        const apiUrl = formattedDate 
          ? `http://localhost:5000/get_cattle_behavior?date=${formattedDate}`
          : `http://localhost:5000/get_cattle_behavior`; // Endpoint for all data if no date

        const response = await axios.get(apiUrl);

        if (response.data.error) {
          setError(response.data.error);
          setCowBehaviorData([]);
        } else {
          // Map response data to align with the expected format
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
      } finally {
        setLoading(false);
      }
    };

    fetchCowBehaviorData();
  }, [date]);

  return (
    <div>
      <nav className="bg-gray-800 border-b border-gray-700 p-3 mb-2">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-around h-16">
            <div className="flex items-center">
              <Link to="/" className="ml-2 text-2xl font-bold text-white">Cattle Behaviour</Link>
            </div>
            <div className="flex items-center">
              {/* Trend controls for selecting trends and date */}
              <TrendControls trendType={trendType} setTrendType={setTrendType} date={date} setDate={setDate} />
              
              {/* Button to navigate to cow details with all fetched data */}
              <div 
                onClick={() => navigate('/cow-details', { state: { title: 'ALL', cows: data, trendType, date } })}
                className="cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                <BarChartIcon className="h-5 w-5 inline-block mr-1 text-blue-400" />
                Cattles
              </div>

              {/* Other navigation links */}
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
          {loading && <p className="text-white">Loading data, please wait...</p>}
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </nav>
    </div>
  );
}
