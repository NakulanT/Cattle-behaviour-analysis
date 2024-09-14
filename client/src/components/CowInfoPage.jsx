import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation

const CowInfoPage = () => {
  const { cowId } = useParams();  // Get cow ID from the route
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const { trendType, date } = location.state || {}; // Destructure trendType and date

  const [cowData, setCowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log cowId, trendType, and date for debugging
  console.log("Cow ID:", cowId, "Trend Type:", trendType, "Date:", date);

  
  

  useEffect(() => {
    // Fetch cow details from the API
    const fetchCowData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/cow/${cowId}`); // Call your Flask API
        if (!response.ok) {
          throw new Error('Cow not found');
        }
        const data = await response.json();
        setCowData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCowData();
  }, [cowId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-800 text-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-white">Cow Details: {cowId}</h1>

      <div className="bg-gray-700 shadow-md rounded-lg p-4 text-center text-gray-200">
        {cowData && cowData.length > 0 ? (
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Eating Time (min)</th>
                <th className="px-4 py-2">Lying Time (min)</th>
                <th className="px-4 py-2">Standing Time (min)</th>
                <th className="px-4 py-2">Temperature (°C)</th>
                <th className="px-4 py-2">Weather Condition</th>
              </tr>
            </thead>
            <tbody>
              {cowData.map((entry, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{entry.Date}</td>
                  <td className="border px-4 py-2">{entry.Time}</td>
                  <td className="border px-4 py-2">{entry['Eating Time (min)']}</td>
                  <td className="border px-4 py-2">{entry['Lying Time (min)']}</td>
                  <td className="border px-4 py-2">{entry['Standing Time (min)']}</td>
                  <td className="border px-4 py-2">{entry['Temperature (°C)']}</td>
                  <td className="border px-4 py-2">{entry['Weather Condition']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No data available for this cow.</p>
        )}

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
          onClick={() => navigate('/')}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default CowInfoPage;
