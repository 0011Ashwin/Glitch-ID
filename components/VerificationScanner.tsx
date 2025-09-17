import React, { useEffect, useState } from 'react';
import type { VerifiedMember, Member, View } from '../types';

declare var Html5QrcodeScanner: any;
declare var XLSX: any;

interface VerificationScannerProps {
  verifiedMembers: VerifiedMember[];
  verifyMember: (enrollmentNumber: string) => { member: Member; status: 'verified' | 'already_verified' } | null;
  setView: (view: View) => void;
}

interface ScanResult {
  member: Member;
  status: 'verified' | 'already_verified' | 'not_found';
  message: string;
}

export const VerificationScanner: React.FC<VerificationScannerProps> = ({ verifiedMembers, verifyMember, setView }) => {
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [showVerifiedList, setShowVerifiedList] = useState(false);
  
  useEffect(() => {
    const qrCodeScanner = new Html5QrcodeScanner(
      "qr-reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    );

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
      const result = verifyMember(decodedText);
      if (result) {
        if (result.status === 'verified') {
          setLastResult({ member: result.member, status: 'verified', message: 'Verification Successful!' });
        } else {
          setLastResult({ member: result.member, status: 'already_verified', message: 'Already Verified.' });
        }
      } else {
        setLastResult({ member: { name: 'Unknown', enrollmentNumber: decodedText, program: '', gmail: '', hackathonName: '' }, status: 'not_found', message: 'Participant Not Found!' });
      }
      // Optional: Add a sound effect on scan
      // new Audio('/scan-success.mp3').play();
    };

    const onScanFailure = (error: string) => {
      // handle scan failure, usually better to ignore and let the user keep trying.
    };

    qrCodeScanner.render(onScanSuccess, onScanFailure);

    return () => {
      qrCodeScanner.clear().catch((error: any) => {
        console.error("Failed to clear html5-qrcode-scanner.", error);
      });
    };
  }, [verifyMember]);

  const handleExport = () => {
    const dataToExport = verifiedMembers.map(m => ({
      "Name": m.name,
      "Enrollment Number": m.enrollmentNumber,
      "Program": m.program,
      "Team Name": m.teamName || 'N/A',
      "Verified At": m.verifiedAt.toLocaleString(),
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Participants");
    XLSX.writeFile(workbook, "verified_participants.xlsx");
  };

  const getResultBorderColor = () => {
    if (!lastResult) return 'border-purple-500/30';
    switch (lastResult.status) {
      case 'verified': return 'border-green-500';
      case 'already_verified': return 'border-yellow-500';
      case 'not_found': return 'border-red-500';
    }
  };

  return (
    <div className="w-full max-w-2xl p-6 space-y-4 bg-black/20 rounded-2xl backdrop-blur-lg border border-purple-500/30">
      <h2 className="text-3xl font-bold text-center text-white" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.5)'}}>
        Verification Scanner
      </h2>
      
      <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>

      {lastResult && (
        <div className={`p-4 my-4 rounded-lg border-2 animate-fade-in-up bg-black/40 ${getResultBorderColor()}`}>
          <h3 className="text-xl font-bold text-white">{lastResult.message}</h3>
          <p className="font-mono text-purple-300">{lastResult.member.enrollmentNumber}</p>
          <p className="text-lg text-white">{lastResult.member.name}</p>
          {lastResult.member.teamName && <p className="text-sm text-gray-300">Team: {lastResult.member.teamName}</p>}
        </div>
      )}

      <div className="pt-4 space-y-3">
        <button 
          onClick={() => setShowVerifiedList(!showVerifiedList)}
          className="w-full py-2 text-lg font-bold text-white bg-purple-800/50 rounded-lg hover:bg-purple-800/80 transition-colors"
        >
          {showVerifiedList ? 'Hide' : 'Show'} Verified List ({verifiedMembers.length})
        </button>

        {showVerifiedList && (
           <div className="max-h-60 overflow-y-auto p-3 bg-black/40 rounded-lg border border-purple-500/30 animate-fade-in-up">
            {verifiedMembers.length > 0 ? (
                <ul className="space-y-2">
                    {verifiedMembers.map(member => (
                        <li key={member.enrollmentNumber} className="p-2 bg-purple-900/40 rounded-md">
                            <p className="font-bold text-white">{member.name}</p>
                            <p className="text-sm font-mono text-purple-300">{member.enrollmentNumber}</p>
                            <p className="text-xs text-gray-400">Verified at: {member.verifiedAt.toLocaleTimeString()}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-400">No participants verified yet.</p>
            )}
           </div>
        )}

        {verifiedMembers.length > 0 && (
          <button 
            onClick={handleExport}
            className="w-full py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-lg"
          >
            Export Verified List
          </button>
        )}
      </div>

      <button onClick={() => setView('admin')} className="w-full py-2 mt-4 text-sm text-purple-300 hover:text-white transition-colors">
        &larr; Back to Admin Portal
      </button>
    </div>
  );
};