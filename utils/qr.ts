import type { Member } from '../types';

export interface ScanResult {
  member: Member | { name: string; enrollmentNumber: string; program: string; gmail: string; hackathonName: string };
  status: 'verified' | 'already_verified' | 'not_found';
  message: string;
}

const looksLikeToken = (text: string) => text.includes('.') && text.split('.').length >= 2;

export const extractEnrollmentFromScan = async (decodedText: string): Promise<string> => {
  if (looksLikeToken(decodedText)) {
    try {
      const res = await fetch(`/api/verify?token=${encodeURIComponent(decodedText)}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json.enrollment === 'string') return json.enrollment;
      }
    } catch {
      // ignore, fallback to raw text
    }
  }
  return decodedText;
};

export const scanAndVerify = async (
  decodedText: string,
  verifyMember: (enrollmentNumber: string) => { member: Member; status: 'verified' | 'already_verified' } | null,
): Promise<ScanResult> => {
  const enrollment = await extractEnrollmentFromScan(decodedText);
  const result = verifyMember(enrollment);
  if (result) {
    if (result.status === 'verified') {
      return { member: result.member, status: 'verified', message: 'Verification Successful!' };
    } else {
      return { member: result.member, status: 'already_verified', message: 'Already Verified.' };
    }
  }
  return { member: { name: 'Unknown', enrollmentNumber: enrollment, program: '', gmail: '', hackathonName: '' }, status: 'not_found', message: 'Participant Not Found!' };
};
