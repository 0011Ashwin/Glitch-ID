import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Member } from '../types';

interface QrCodeProps {
  member: Member;
  className?: string;
  size?: number; // pixel size of the QR image
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

const buildFallbackPayload = (member: Member) => {
  // Human-readable fallback payload (scanner can still read enrollment number)
  // Keep concise to make scanning reliable.
  return member.enrollmentNumber;
};

export const QrCode: React.FC<QrCodeProps> = ({ member, className = '', size = 128 }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      let payload: string = buildFallbackPayload(member);

      try {
        const url = `/api/qr?enrollment=${encodeURIComponent(member.enrollmentNumber)}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (isNonEmptyString(json.token)) {
            payload = json.token;
          }
        }
      } catch {
        // ignore and use fallback
      }

      try {
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          width: size,
          margin: 1,
          color: { dark: '#ffffff', light: '#1a112e' },
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        // As a last resort, try again with plain enrollment number
        try {
          const url2 = await QRCode.toDataURL(buildFallbackPayload(member), {
            errorCorrectionLevel: 'M',
            width: size,
            margin: 1,
            color: { dark: '#ffffff', light: '#1a112e' },
          });
          if (!cancelled) setDataUrl(url2);
        } catch {
          // ignore
        }
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [member, size]);

  if (!dataUrl) return null;
  return (
    <img
      src={dataUrl}
      alt={`QR for ${member.enrollmentNumber}`}
      className={className}
      width={size}
      height={size}
    />
  );
};

export default QrCode;
