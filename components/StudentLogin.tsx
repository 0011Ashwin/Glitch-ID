import React, { useState } from 'react';
import type { View } from '../types';

type ViewSetter = (view: View) => void;

interface StudentLoginProps {
  findMember: (name: string, enrollmentNumber: string) => void;
  error: string;
  setError: (error: string) => void;
  setView: ViewSetter;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ findMember, error, setError, setView }) => {
  const [name, setName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(name && enrollmentNumber) {
        findMember(name, enrollmentNumber);
    } else {
        setError("Please fill in both fields.");
    }
  };
  
  const inputStyles = "w-full bg-black/30 border border-purple-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm";
  const labelStyles = "block text-sm font-medium text-purple-300 mb-1";

  return (
    <div className="w-full max-w-md p-8 space-y-6">
        
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.5)'}}>Student Portal</h2>
        <p className="text-purple-300">Access your ID Card</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={labelStyles}>Full Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} required placeholder="e.g. Jane Doe" />
        </div>
        <div>
          <label htmlFor="enrollmentNumber" className={labelStyles}>Enrollment Number</label>
          <input type="text" id="enrollmentNumber" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} className={inputStyles} required placeholder="e.g. TC-2025-001" />
        </div>
        
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full py-3 mt-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg">
          Find My ID
        </button>
      </form>
      <button onClick={() => setView('landing')} className="w-full py-2 mt-2 text-sm text-purple-300 hover:text-white transition-colors">
        &larr; Back to Home
      </button>
    </div>
  );
};