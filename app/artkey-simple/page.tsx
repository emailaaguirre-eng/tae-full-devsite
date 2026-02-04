"use client";

import ArtKeyPlaceholder, { InlineArtKeyPlaceholder } from '@/components/ArtKeyPlaceholder';

export default function ArtKeySimplePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f3f3', 
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
        ArtKey QR Code Placeholder
      </h1>

      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Full Version</h2>
        <ArtKeyPlaceholder qrSize={200} />
      </div>

      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Compact Version</h2>
        <ArtKeyPlaceholder qrSize={200} compact={true} />
      </div>

      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Inline Version</h2>
        <InlineArtKeyPlaceholder size={150} />
      </div>
    </div>
  );
}
