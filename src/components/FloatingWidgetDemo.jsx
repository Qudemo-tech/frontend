import React from 'react';

/**
 * Demo page for widget functionality
 *
 * NOTE: FloatingQudemoWidget has been removed as part of HeyGen deprecation.
 * This component now serves as a placeholder.
 */

const FloatingWidgetDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Widget Demo
          </h1>
          <p className="text-xl text-gray-600">
            Widget functionality has been deprecated.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center py-12">
            <p className="text-gray-500">
              The FloatingQudemoWidget has been removed as part of HeyGen integration deprecation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingWidgetDemo;
