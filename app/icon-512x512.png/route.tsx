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
          fontSize: 200, 
          fontWeight: 'bold',
          borderRadius: 80
        }}
      >
        TX
      </div>
    ),
    { width: 512, height: 512 }
  );
}
