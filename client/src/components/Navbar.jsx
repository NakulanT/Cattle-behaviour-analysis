import React from 'react';
import { CalendarIcon, EyeIcon, EyeOffIcon, BarChartIcon, SettingsIcon, HelpCircleIcon } from "lucide-react";
import { Link } from 'react-router-dom'; // Import Link

export default function Navbar() {
  return (
    <div>
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="ml-2 text-2xl font-bold text-white">Cattle Monitor</span>
              <span className="mr-2 text-xl">🐄</span> {/* Cow emoji */}
            </div>
            <div className="flex items-center">
              <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <BarChartIcon className="h-5 w-5 inline-block mr-1 text-blue-400" />
                Dashboard
              </Link>
              <Link to="/cattles" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <BarChartIcon className="h-5 w-5 inline-block mr-1 text-blue-400" />
                Cattles
              </Link>
              <span  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <SettingsIcon className="h-5 w-5 inline-block mr-1 text-green-400" />
                Settings
              </span>
              <Link to="/help" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <HelpCircleIcon className="h-5 w-5 inline-block mr-1 text-red-400" />
                Help
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
