import React from 'react';

/**
 * LoadingFallback Component
 * 
 * A loading fallback component used with React.Suspense for lazy-loaded routes.
 * Displays a centered loading spinner with Portuguese text matching the application's
 * purple/açaí theme.
 */
export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="bg-white px-8 py-6 rounded-3xl shadow-strong border border-purple-200">
        <div className="flex items-center gap-4">
          {/* Spinning loader */}
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          
          {/* Loading text */}
          <div className="text-center">
            <p className="text-purple-900 font-bold text-lg">Carregando...</p>
            <p className="text-purple-600 text-sm mt-1">Preparando para você! 🥥</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
