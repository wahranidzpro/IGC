'use client';
import { QRCodeSVG } from 'qrcode.react';

interface IGCQRCodeProps {
  value: string;
  size?: number;
  id?: string;
  memberName?: string;
}

export default function IGCQRCode({ value, size = 200, id, memberName }: IGCQRCodeProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-white rounded-2xl p-3 inline-block shadow-lg"
        style={{ width: size + 24, height: size + 24 }}
      >
        <QRCodeSVG
          id={id}
          value={value}
          size={size}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#0f3460"
          imageSettings={{
            src: '/logo-transparent.png',
            height: 36,
            width: 36,
            excavate: true,
          }}
          includeMargin
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {memberName && (
        <p className="text-gray-400 text-sm mt-2 font-medium">{memberName}</p>
      )}
    </div>
  );
}
