// frontend/src/modules/welcome_banner/WelcomeBannerComponent.tsx
import React from 'react';

const WelcomeBannerComponent: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">Welcome to School ERP!</h1>
        <p className="text-lg text-gray-700 mb-6">Your personalized portal for academic excellence.</p>
        <p className="text-md text-gray-500">Please log in to continue.</p>
      </div>
    </div>
  );
};

export default WelcomeBannerComponent;
