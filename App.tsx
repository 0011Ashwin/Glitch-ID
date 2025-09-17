import React, { useState, useRef, useEffect } from 'react';
import { IdCard } from './components/IdCard';
import { LandingPage } from './components/LandingPage';
import { AdminView } from './components/AdminView';
import { StudentLogin } from './components/StudentLogin';
import { AdminLogin } from './components/AdminLogin';
// FIX: Import VerificationScanner to use the component.
import { VerificationScanner } from './components/VerificationScanner';
// FIX: Import VerifiedMember type to support the verification feature.
import type { Member, View, VerifiedMember } from './types';
import html2canvas from 'html2canvas';

const LOCAL_STORAGE_KEY = 'members_data';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [members, setMembers] = useState<Member[]>([]);
  // FIX: Add state to manage verified members for the scanner.
  const [verifiedMembers, setVerifiedMembers] = useState<VerifiedMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [error, setError] = useState<string>('');
  const idCardRef = useRef<HTMLDivElement>(null);
  
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/members');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      const serverMembers = data.members || [];
      setMembers(serverMembers);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverMembers));
      console.log('Fetched data from server API.');
    } catch (err) {
      console.warn("API fetch failed, falling back to local storage.", err);
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        setMembers(localData ? JSON.parse(localData) : []);
        setError(''); // Clear error, run in offline mode silently
      } catch (localErr) {
        console.error("Could not read from local storage.", localErr);
        setError('Could not load participant data from any source.');
        setMembers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const findMember = (name: string, enrollmentNumber: string) => {
    const foundMember = members.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() && m.enrollmentNumber.toLowerCase() === enrollmentNumber.toLowerCase()
    );

    if (foundMember) {
      setCurrentMember(foundMember);
      setView('idCard');
      setError('');
    } else {
      setError('No member found with these details. Please check and try again.');
    }
  };

  const handleAdminLogin = (password: string) => {
    if (password === 'glitch2025') {
      setView('admin');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };
  
  // FIX: Implement verifyMember function to handle QR code scan logic.
  const verifyMember = (enrollmentNumber: string): { member: Member; status: 'verified' | 'already_verified' } | null => {
    const normalizedEnrollment = enrollmentNumber.trim().toLowerCase();
    
    const isAlreadyVerified = verifiedMembers.find(m => m.enrollmentNumber.toLowerCase() === normalizedEnrollment);
    if (isAlreadyVerified) {
      return { member: isAlreadyVerified, status: 'already_verified' };
    }

    const memberToVerify = members.find(m => m.enrollmentNumber.toLowerCase() === normalizedEnrollment);
    if (memberToVerify) {
      const newVerifiedMember: VerifiedMember = { ...memberToVerify, verifiedAt: new Date() };
      setVerifiedMembers(prev => [...prev, newVerifiedMember].sort((a,b) => b.verifiedAt.getTime() - a.verifiedAt.getTime()));
      return { member: newVerifiedMember, status: 'verified' };
    }

    return null;
  };

  const handleDownload = () => {
    if (idCardRef.current) {
      html2canvas(idCardRef.current, {
        backgroundColor: null,
        scale: 2,
      }).then((canvas) => {
        const link = document.createElement('a');
        if (currentMember) {
          link.download = `Techpreneur-ID-${currentMember.name.replace(/\s+/g, '-')}.png`;
        } else {
          link.download = 'Techpreneur-ID-Card.png';
        }
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const renderView = () => {
    if (isLoading) {
      return (
         <div className="text-center">
          <p className="text-2xl font-bold text-purple-300 animate-pulse">Loading Participants...</p>
        </div>
      )
    }
    
    switch (view) {
      case 'adminLogin':
        return <AdminLogin handleLogin={handleAdminLogin} error={error} setError={setError} setView={setView} />;
      case 'admin':
        return <AdminView setView={setView} refreshMembers={fetchMembers} initialMemberCount={members.length} />;
      // FIX: Add a case to render the VerificationScanner component.
      case 'verificationScanner':
        return <VerificationScanner verifiedMembers={verifiedMembers} verifyMember={verifyMember} setView={setView} />;
      case 'studentLogin':
        return <StudentLogin findMember={findMember} error={error} setError={setError} setView={setView} />;
      case 'idCard':
        if (currentMember) {
          return (
            <div className="flex flex-col items-center gap-6">
              <IdCard ref={idCardRef} member={currentMember} />
              <div className="flex items-center gap-4">
                 <button
                  onClick={handleDownload}
                  className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg"
                >
                  Download ID
                </button>
                <button
                  onClick={() => {
                    setCurrentMember(null);
                    setView('landing');
                  }}
                  className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-300"
                >
                  Back to Home
                </button>
              </div>
            </div>
          );
        }
        return null;
      case 'landing':
      default:
        return <LandingPage setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-transparent font-sans">
      {renderView()}
    </div>
  );
};

export default App;