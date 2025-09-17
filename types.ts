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

// FIX: Add VerifiedMember interface to resolve import error in VerificationScanner.tsx.
export interface VerifiedMember extends Member {
  verifiedAt: Date;
}

// FIX: Add 'verificationScanner' view to enable scanner component integration.
export type View = 'landing' | 'adminLogin' | 'admin' | 'studentLogin' | 'idCard' | 'verificationScanner';
