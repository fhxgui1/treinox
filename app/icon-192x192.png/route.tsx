import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div 
        style={{ 
          background: '#10b981', 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white', 
          fontSize: 80, 
          fontWeight: 'bold',
          borderRadius: 40
        }}
      >
        TX
      </div>
    ),
    { width: 192, height: 192 }
  );
}
