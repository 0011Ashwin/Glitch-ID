import React, { useEffect, useRef, useState } from 'react';
import type { VerifiedMember, Member, View } from '../types';
import { scanAndVerify } from '../utils/qr';

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
  const [loadError, setLoadError] = useState<string | null>(null);

  const lastScanTimeRef = useRef<number>(0);
  const lastEnrollmentRef = useRef<string>('');

  useEffect(() => {
    let scanner: any = null;
    let cancelled = false;

    const CDN_URLS = [
      'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
      'https://rawcdn.githack.com/mebjas/html5qrcode/2.3.8/minified/html5-qrcode.min.js'
    ];

    const loadScript = (url: string, timeoutMs = 8000) => new Promise<void>((resolve, reject) => {
      try {
        // If already available globally, resolve immediately
        if ((globalThis as any).Html5QrcodeScanner) return resolve();

        // Avoid adding duplicate tags for same url
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
          if ((existing as HTMLScriptElement).getAttribute('data-loaded') === '1') return resolve();
          (existing as HTMLScriptElement).addEventListener('load', () => resolve());
          (existing as HTMLScriptElement).addEventListener('error', () => reject(new Error('Failed to load script')));
          return;
        }

        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        let done = false;
        const t = setTimeout(() => {
          if (done) return;
          done = true;
          s.onerror = null; s.onload = null;
          reject(new Error('Script load timeout'));
        }, timeoutMs);
        s.onload = () => {
          if (done) return;
          done = true;
          clearTimeout(t);
          (s as HTMLScriptElement).setAttribute('data-loaded', '1');
          resolve();
        };
        s.onerror = (e) => {
          if (done) return;
          done = true;
          clearTimeout(t);
          reject(new Error('Failed to load html5-qrcode'));
        };
        document.head.appendChild(s);
      } catch (e) {
        reject(e);
      }
    });

    const loadWithFallback = async () => {
      setLoadError(null);
      for (const url of CDN_URLS) {
        try {
          await loadScript(url);
          if ((globalThis as any).Html5QrcodeScanner) return;
        } catch (err) {
          console.warn('Failed to load html5-qrcode from', url, err);
          // try next
        }
      }
      throw new Error('All CDNs failed');
    };

    const initScanner = async () => {
      try {
        await loadWithFallback();
      } catch (e) {
        console.error('Failed to load html5-qrcode library', e);
        setLoadError('Failed to load scanner library. Check network or allow external scripts.');
        return;
      }

      if (cancelled) return;

      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        const onScanSuccess = async (decodedText: string, decodedResult: any) => {
          const now = Date.now();
          if (now - lastScanTimeRef.current < 1200) return; // debounce rapid scans

          const outcome = await scanAndVerify(decodedText, verifyMember);
          const enrollment = outcome.member.enrollmentNumber;

          if (enrollment === lastEnrollmentRef.current && now - lastScanTimeRef.current < 2500) {
            return; // ignore duplicate of same code in short interval
          }

          lastScanTimeRef.current = now;
          lastEnrollmentRef.current = enrollment;

          setLastResult(outcome);
        };

        const onScanFailure = (error: string) => {
          // ignore failures; scanner continuously tries
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (err) {
        console.error('Failed to initialize QR scanner', err);
        setLoadError('Failed to initialize scanner. See console for details.');
      }
    };

    initScanner();

    return () => {
      cancelled = true;
      if (scanner && typeof scanner.clear === 'function') {
        scanner.clear().catch((error: any) => {
          console.error('Failed to clear html5-qrcode-scanner.', error);
        });
      }
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
