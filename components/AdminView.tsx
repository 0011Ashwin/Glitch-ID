import React, { useState, useRef } from 'react';
import type { Member, View } from '../types';

declare var XLSX: any;

const LOCAL_STORAGE_KEY = 'members_data';

type ViewSetter = (view: View) => void;

interface AdminViewProps {
  setView: ViewSetter;
  refreshMembers: () => Promise<void>;
  initialMemberCount: number;
}

export const AdminView: React.FC<AdminViewProps> = ({ setView, refreshMembers, initialMemberCount }) => {
  // State for single entry form
  const [name, setName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [program, setProgram] = useState('');
  const [gmail, setGmail] = useState('');
  const [semester, setSemester] = useState('');
  const [isTeamEntry, setIsTeamEntry] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for bulk upload
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  const postData = async (members: Omit<Member, 'hackathonName'>[]) => {
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data to server');
      }
      await refreshMembers();
      return { success: true, count: members.length };
    } catch (error) {
      console.warn("API POST failed, saving to local storage instead.", error);
      try {
        const fullMembers: Member[] = members.map(m => ({ ...m, hackathonName: 'Glitch 1.0' }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullMembers));
        await refreshMembers();
        return { success: true, count: members.length, notice: 'Saved locally (offline).' };
      } catch (localError) {
        console.error("Failed to save to local storage", localError);
        return { success: false, error: 'Failed to save data locally.' };
      }
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && enrollmentNumber && program && gmail) {
      setIsProcessing(true);
      setSuccessMessage('');
       const newMemberData: Omit<Member, 'hackathonName'> = {
        name: name.trim().toUpperCase(),
        enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
        program: program.trim(),
        gmail: gmail.trim(),
        semester: semester.trim() || undefined,
      };

      if (isTeamEntry) {
        newMemberData.teamName = teamName.trim();
        newMemberData.teamMembers = teamMembers.split(',').map(m => m.trim().toUpperCase()).filter(m => m && m !== newMemberData.name);
      }

      const result = await postData([newMemberData]);
      setIsProcessing(false);

      if (result.success) {
        let message = `${name.trim()} has been saved successfully!`;
        if (result.notice) message += ` (${result.notice})`;
        setSuccessMessage(message);

        setName('');
        setEnrollmentNumber('');
        setProgram('');
        setGmail('');
        setSemester('');
        setIsTeamEntry(false);
        setTeamName('');
        setTeamMembers('');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setSuccessMessage(`Error: ${result.error}`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadMessage('');
    }
  };

  const handleFileUpload = () => {
    if (!file) {
      setUploadMessage('Error: Please select a file first.');
      return;
    }
    setIsProcessing(true);
    setUploadMessage('Processing file...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const findValue = (row: any, possibleKeys: string[]): any => {
            for (const key in row) {
                const normalizedKey = key.trim().toLowerCase();
                if (possibleKeys.includes(normalizedKey)) {
                    return row[key];
                }
            }
            return undefined;
        };

        const newMembers: Omit<Member, 'hackathonName'>[] = jsonData.map((row): Omit<Member, 'hackathonName'> | null => {
            const name = findValue(row, ['name', 'student name']);
            const enrollmentNo = findValue(row, ['enrollment no.', 'enrollment number']);
            const email = findValue(row, ['email id.', 'email']);
            const program = findValue(row, ['program']);

            if (!name || !enrollmentNo || !email || !program) {
                console.warn('Skipping row due to missing required data:', row);
                return null;
            }
            
            const teamName = findValue(row, ['team name']);
            const isTeam = !!teamName;
            
            const teamMembersRaw = findValue(row, ['team member names', 'team members']);
            const leaderName = String(name).trim().toUpperCase();
            
            let teamMembersList: string[] = [];
            if (isTeam && teamMembersRaw) {
                teamMembersList = String(teamMembersRaw)
                    .split(',')
                    .map((n: string) => n.trim().toUpperCase())
                    .filter(n => n && n !== leaderName);
            }

            return {
                name: leaderName,
                enrollmentNumber: String(enrollmentNo).trim().toUpperCase(),
                program: String(program).trim(),
                gmail: String(email).trim(),
                semester: findValue(row, ['semester']) ? String(findValue(row, ['semester'])).trim() : undefined,
                teamName: isTeam ? String(teamName).trim() : undefined,
                teamMembers: isTeam ? teamMembersList : undefined,
            };
        }).filter((member): member is Omit<Member, 'hackathonName'> => member !== null);
        
        if (newMembers.length === 0 && jsonData.length > 0) {
            throw new Error("No valid members found. Check column headers (e.g., 'Name', 'Enrollment no.').");
        }
        
        const result = await postData(newMembers);

        if (result.success) {
            let message = `${result.count} members saved successfully!`;
            if (result.notice) message += ` (${result.notice})`;
            setUploadMessage(message);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
             setUploadMessage(`Error: ${result.error}`);
        }

      } catch (error) {
        console.error("Error processing file:", error);
        setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Could not process file.'}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
        setUploadMessage('Error: Could not read the file.');
        setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleClearData = async () => {
    if(window.confirm(`Are you sure you want to delete all ${initialMemberCount} participant records? This action cannot be undone.`)) {
      setIsProcessing(true);
      setUploadMessage('Deleting all data...');
       try {
        const response = await fetch('/api/members', { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to clear data from server');
        await refreshMembers();
        setUploadMessage('All participant data has been cleared.');
      } catch (error) {
         console.warn("API delete failed, clearing data locally instead.", error);
         try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            await refreshMembers();
            setUploadMessage('Data cleared locally (offline mode).');
         } catch (localError) {
             console.error("Could not clear local storage", localError);
             setUploadMessage(`Error: Could not clear data locally.`);
         }
      } finally {
        setIsProcessing(false);
        setActiveTab('bulk');
      }
    }
  }
  
  const inputStyles = "w-full bg-black/30 border border-purple-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm";
  const labelStyles = "block text-sm font-medium text-purple-300 mb-1";
  const tabButtonStyles = (isActive: boolean) => 
    `w-1/2 py-3 text-center font-bold transition-colors duration-300 rounded-t-lg ${
      isActive
        ? 'bg-purple-600/50 text-white'
        : 'bg-transparent text-purple-300 hover:bg-purple-600/20'
    }`;
    
  return (
    <div className="w-full max-w-lg p-8 space-y-6 bg-black/20 rounded-2xl backdrop-blur-lg border border-purple-500/30">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.5)'}}>Admin Portal</h2>
        <p className="text-purple-300">Member Management</p>
      </div>

      <div className="flex border-b border-purple-500/30">
        <button onClick={() => setActiveTab('single')} className={tabButtonStyles(activeTab === 'single')}>
          Single Entry
        </button>
        <button onClick={() => setActiveTab('bulk')} className={tabButtonStyles(activeTab === 'bulk')}>
          Bulk Upload
        </button>
      </div>

      {activeTab === 'single' && (
        <div className="animate-fade-in-up">
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelStyles}>Full Name (Leader or Individual)</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} required />
            </div>
            <div>
              <label htmlFor="enrollmentNumber" className={labelStyles}>Enrollment Number</label>
              <input type="text" id="enrollmentNumber" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} className={inputStyles} required />
            </div>
            <div>
              <label htmlFor="program" className={labelStyles}>Program</label>
              <input type="text" id="program" value={program} onChange={(e) => setProgram(e.target.value)} className={inputStyles} required />
            </div>
             <div>
              <label htmlFor="semester" className={labelStyles}>Semester (Optional)</label>
              <input type="text" id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} className={inputStyles} />
            </div>
            <div>
              <label htmlFor="gmail" className={labelStyles}>Gmail</label>
              <input type="email" id="gmail" value={gmail} onChange={(e) => setGmail(e.target.value)} className={inputStyles} required />
            </div>

            <div className="flex items-center pt-2">
                <input 
                  type="checkbox" 
                  id="isTeamEntry" 
                  checked={isTeamEntry} 
                  onChange={(e) => setIsTeamEntry(e.target.checked)}
                  className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isTeamEntry" className="ml-2 block text-sm text-white">
                  This is a Team Entry
                </label>
            </div>

            {isTeamEntry && (
              <>
                <div className="animate-fade-in-up">
                  <label htmlFor="teamName" className={labelStyles}>Team Name</label>
                  <input type="text" id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputStyles} required={isTeamEntry} />
                </div>
                <div className="animate-fade-in-up">
                  <label htmlFor="teamMembers" className={labelStyles}>Team Members (comma-separated)</label>
                  <input type="text" id="teamMembers" value={teamMembers} onChange={(e) => setTeamMembers(e.target.value)} className={inputStyles} placeholder="e.g. John Doe, Jane Smith"/>
                </div>
              </>
            )}

            <button type="submit" disabled={isProcessing} className="w-full py-3 mt-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isProcessing ? 'Saving...' : 'Add Member'}
            </button>
            {successMessage && <p className={`text-sm text-center ${successMessage.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>{successMessage}</p>}
          </form>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="animate-fade-in-up">
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Upload an Excel file (.xlsx, .xls, .csv) to add/overwrite all member data.
            </p>
            <div className="p-3 bg-black/40 rounded-lg border border-purple-500/30 text-xs text-purple-200 space-y-1">
                <p className="font-bold">Required Columns:</p>
                <ul className="list-disc list-inside pl-2">
                    <li>Name (or Student Name)</li>
                    <li>Enrollment No. (or Enrollment Number)</li>
                    <li>Email Id. (or Email)</li>
                    <li>Program</li>
                </ul>
                <p className="font-bold pt-2">Optional Columns:</p>
                 <ul className="list-disc list-inside pl-2">
                    <li>Semester</li>
                    <li>Team Name</li>
                    <li>Team Member Names (comma-separated)</li>
                </ul>
                <p className="font-bold pt-2">Note for Individuals:</p>
                <p>For individual participants, simply leave the 'Team Name' and 'Team Member Names' columns blank.</p>
            </div>
            <div>
              <label htmlFor="file-upload" className={labelStyles}>Select File</label>
              <input 
                ref={fileInputRef}
                type="file" 
                id="file-upload" 
                onChange={handleFileChange} 
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600/50 file:text-purple-100 hover:file:bg-purple-600/70"
                accept=".xlsx, .xls, .csv"
              />
            </div>
            <button 
              onClick={handleFileUpload} 
              disabled={isProcessing || !file}
              className="w-full py-3 mt-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Saving...' : 'Upload & Overwrite Data'}
            </button>
            {uploadMessage && (
              <p className={`text-sm text-center ${uploadMessage.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>
                {uploadMessage}
              </p>
            )}
             <div className="mt-6 pt-6 border-t border-red-500/30">
                <h3 className="text-lg font-bold text-red-400 text-center">Danger Zone</h3>
                <p className="text-xs text-center text-gray-400 mb-4">This is a permanent action.</p>
                <button 
                  onClick={handleClearData} 
                  disabled={isProcessing}
                  className="w-full py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Clear All Participant Data
                </button>
              </div>
          </div>
        </div>
      )}

      {/* FIX: Add a new section with a button to launch the verification scanner. */}
      <div className="pt-6 border-t border-purple-500/30">
          <h3 className="text-lg font-bold text-white text-center mb-2">Verification Tool</h3>
          <p className="text-xs text-center text-gray-400 mb-4">Scan participant QR codes for event check-in.</p>
          <button 
            onClick={() => setView('verificationScanner')}
            className="w-full py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg"
          >
            Launch QR Scanner
          </button>
      </div>

      <button onClick={() => setView('landing')} className="w-full py-2 mt-2 text-sm text-purple-300 hover:text-white transition-colors">
        &larr; Back to Home
      </button>
    </div>
  );
};