import React, { useState } from 'react';
import type { View } from '../types';

type ViewSetter = (view: View) => void;

interface AdminLoginProps {
  handleLogin: (password: string) => void;
  error: string;
  setError: (error: string) => void;
  setView: ViewSetter;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ handleLogin, error, setError, setView }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      handleLogin(password);
    } else {
      setError("Please enter the password.");
    }
  };

  const inputStyles = "w-full bg-black/30 border border-purple-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm";
  const labelStyles = "block text-sm font-medium text-purple-300 mb-1";
  
  return (
    <div className="w-full max-w-md p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.5)'}}>Admin Verification</h2>
        <p className="text-purple-300">Enter the password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className={labelStyles}>Password</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => {
              setPassword(e.target.value);
              setError(''); // Clear error on typing
            }} 
            className={inputStyles} 
            required 
          />
        </div>
        
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full py-3 mt-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg">
          Login
        </button>
      </form>
      <button onClick={() => setView('landing')} className="w-full py-2 mt-2 text-sm text-purple-300 hover:text-white transition-colors">
        &larr; Back to Home
      </button>
    </div>
  );
};