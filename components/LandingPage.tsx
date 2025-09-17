import React, { useState, useEffect } from 'react';
import type { View } from '../types';

type ViewSetter = (view: View) => void;

interface LandingPageProps {
  setView: ViewSetter;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const buttonStyles = "w-full md:w-56 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 shadow-[0_0_15px_rgba(192,132,252,0.6)] hover:shadow-[0_0_25px_rgba(192,132,252,0.8)]";

  if (showSplash) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 min-h-[300px]">
        <h1 
          className="text-6xl md:text-8xl font-bold font-mono text-white splash-glitch" 
          data-text="Techpreneur Club"
        >
          Techpreneur Club
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[300px]">
      <div className="flex flex-col items-center w-full animate-fade-in-up">
        <h1 
          className="text-5xl font-bold font-mono text-white mb-2 glitch-effect" 
          data-text="GLITCH 1.0"
          style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(192, 132, 252, 0.6)'}}
        >
          GLITCH 1.0
        </h1>
        <p className="text-lg text-gray-300 mb-10">
          Member ID Portal
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <button onClick={() => setView('adminLogin')} className={buttonStyles}>
            Admin Portal
          </button>
          <button onClick={() => setView('studentLogin')} className={buttonStyles}>
            Get Your ID Card
          </button>
        </div>
      </div>
    </div>
  );
};