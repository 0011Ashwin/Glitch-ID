
export interface Member {
  name: string;
  enrollmentNumber: string;
  program: string;
  gmail: string;
  hackathonName: string;
  semester?: string;
  teamName?: string;
  teamMembers?: string[];
}

// FIX: Add VerifiedMember interface to extend Member with a verification timestamp.
export interface VerifiedMember extends Member {
  verifiedAt: Date;
}

// FIX: Add 'verification' view to enable the scanner component.
export type View = 'landing' | 'adminLogin' | 'admin' | 'studentLogin' | 'idCard' | 'verification';
