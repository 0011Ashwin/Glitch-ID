import React, { useRef, MouseEvent } from 'react';
import type { Member } from '../types';
import { LogoPlaceholder } from './icons';
import { QrCode } from './QrCode';

interface CardProps {
  member: Member;
}

const getSemesterWithOrdinal = (semester?: string): string => {
  if (!semester) return '';
  const s = parseInt(semester, 10);
  if (isNaN(s)) return ` (Sem ${semester})`;

  let suffix = 'th';
  if (s % 10 === 1 && s % 100 !== 11) {
    suffix = 'st';
  } else if (s % 10 === 2 && s % 100 !== 12) {
    suffix = 'nd';
  } else if (s % 10 === 3 && s % 100 !== 13) {
    suffix = 'rd';
  }
  return ` (Sem ${s}${suffix})`;
};


export const IdCard = React.forwardRef<HTMLDivElement, CardProps>(({ member }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Use the forwarded ref if it exists, otherwise use the internal ref
  const targetRef = ref || cardRef;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const currentRef = (targetRef as React.RefObject<HTMLDivElement>).current;
    if (!currentRef) return;

    const { left, top, width, height } = currentRef.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateY = ((x - width / 2) / (width / 2)) * 10;
    const rotateX = (-(y - height / 2) / (height / 2)) * 10;

    currentRef.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  const handleMouseLeave = () => {
     const currentRef = (targetRef as React.RefObject<HTMLDivElement>).current;
    if (!currentRef) return;
    currentRef.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale(1)';
  };

  return (
    <div
      ref={targetRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-[360px] h-[640px] bg-[#1a112e] rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-transform duration-200 ease-out"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full text-purple-400/10" width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Purple Glow */}
        <div className="absolute top-0 right-[-150px] w-[400px] h-[400px] bg-purple-600/50 rounded-full blur-3xl" style={{ filter: 'blur(100px)'}}></div>
         {/* Abstract glass shape */}
        <div 
          className="absolute top-1/4 right-[-50px] w-48 h-48 border-2 border-white/20 rounded-full" 
          style={{ 
            transform: 'rotate(45deg)', 
            background: 'linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
            backdropFilter: 'blur(5px)',
          }}
        ></div>
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full text-white" style={{ transform: 'translateZ(20px)' }}>
        {/* Header */}
        <header className="flex flex-col items-center text-center pt-2" style={{ transform: 'translateZ(50px)' }}>
           <h1 className="text-4xl font-bold leading-tight" style={{ textShadow: '0 0 20px rgba(192, 132, 252, 0.6)'}}>
            Techpreneur Club
          </h1>
          <p 
            className="mt-1 text-3xl font-semibold tracking-wider text-purple-200"
            style={{ textShadow: '0 0 15px rgba(192, 132, 252, 0.5)' }}
          >
            {member.hackathonName}
          </p>
        </header>

        {/* Body Section */}
        <section className="flex-grow flex flex-col items-start justify-center pl-2" style={{ transform: 'translateZ(40px)' }}>
          <div className="space-y-4">
            {member.teamName ? (
              <>
                <div>
                  <p className="text-xs font-mono text-purple-300">TEAM NAME</p>
                  <p className="text-xl font-bold tracking-wider">{member.teamName}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-purple-300">TEAM MEMBERS</p>
                  <p className="text-2xl font-bold tracking-wider">{member.name} <span className="text-base font-semibold text-purple-300">(Leader)</span></p>
                  {member.teamMembers && member.teamMembers.length > 0 && (
                    <div className="mt-1 pl-2">
                      {member.teamMembers.map((name, index) => (
                        <p key={index} className="text-lg font-semibold">{name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs font-mono text-purple-300">NAME</p>
                <p className="text-2xl font-bold tracking-wider">{member.name}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-mono text-purple-300">{member.teamName ? 'TEAM LEADER ENROLLMENT' : 'ENROLLMENT NO.'}</p>
              <p className="text-lg font-mono tracking-widest">{member.enrollmentNumber}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-purple-300">PROGRAM</p>
              <p className="text-lg font-semibold">{member.program}{getSemesterWithOrdinal(member.semester)}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-purple-300">{member.teamName ? 'TEAM LEADER GMAIL' : 'GMAIL'}</p>
              <p className="text-md font-mono">{member.gmail}</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between mt-4" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-center gap-2">
            <LogoPlaceholder className="w-8 h-8 text-purple-300"/>
            <span className="text-xs font-mono text-purple-300">Official Participant</span>
          </div>
          <div className="flex flex-col items-center">
            <QrCode member={member} size={84} className="rounded-md shadow-md" />
            <span className="mt-1 text-[10px] text-purple-300">Scan at Check-in</span>
          </div>
        </footer>
      </div>
    </div>
  );
});
