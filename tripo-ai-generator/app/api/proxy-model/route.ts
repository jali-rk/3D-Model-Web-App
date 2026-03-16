
import { NextResponse } from 'next/server';

// Add DNS fallback - try multiple possible domains if needed
const TRIPO_DOMAINS = [
  'tripo-data.rg1.data.tripo3d.com',
  'data.tripo3d.com',
  'api.tripo3d.com'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelUrl = searchParams.get('url');

  if (!modelUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(modelUrl);
    
    console.log('Attempting to fetch model from:', decodedUrl.substring(0, 100) + '...');
    
    // Try with longer timeout and retry logic
    let lastError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch model...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch(decodedUrl, {
          headers: {
            'Accept': 'application/octet-stream, model/gltf-binary, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; Next.js/14)'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Attempt ${attempt} failed:`, response.status, response.statusText);
          
          if (attempt === 3) {
            if (response.status === 403) {
              return NextResponse.json(
                { error: 'Access forbidden - The model URL may have expired' },
                { status: 403 }
              );
            } else if (response.status === 404) {
              return NextResponse.json(
                { error: 'Model not found - The URL may be invalid' },
                { status: 404 }
              );
            } else {
              throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
            }
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        console.log('✅ Successfully connected!');
        console.log('Content-Type:', contentType);
        console.log('Content-Length:', contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB` : 'unknown');

        const stream = response.body;
        
        if (!stream) {
          throw new Error('No response body');
        }

        return new NextResponse(stream, {
          status: 200,
          headers: {
            'Content-Type': 'model/gltf-binary',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Cache-Control': 'public, max-age=3600',
            'Content-Disposition': 'inline; filename="model.glb"',
            'Content-Length': contentLength || ''
          },
        });
        
      } catch (err: any) {
        lastError = err;
        console.error(`Attempt ${attempt} error:`, err.message);
        
        // Check for DNS errors specifically
        if (err.cause?.code === 'ENOTFOUND') {
          console.log('⚠️ DNS resolution failed - trying alternative approach...');
          
          // Try to extract just the path and use a different base URL
          try {
            const urlObj = new URL(decodedUrl);
            const pathWithQuery = urlObj.pathname + urlObj.search;
            
            // Try alternative domain
            for (const domain of TRIPO_DOMAINS) {
              if (domain !== urlObj.hostname) {
                const altUrl = `https://${domain}${pathWithQuery}`;
                console.log(`Trying alternative URL: ${altUrl.substring(0, 100)}...`);
                
                const altResponse = await fetch(altUrl, {
                  headers: {
                    'Accept': 'application/octet-stream, model/gltf-binary, */*',
                    'User-Agent': 'Mozilla/5.0 (compatible; Next.js/14)'
                  },
                  signal: AbortSignal.timeout(30000)
                });
                
                if (altResponse.ok) {
                  console.log(`✅ Success with alternative domain: ${domain}`);
                  const altStream = altResponse.body;
                  if (altStream) {
                    return new NextResponse(altStream, {
                      status: 200,
                      headers: {
                        'Content-Type': 'model/gltf-binary',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                        'Access-Control-Allow-Headers': '*',
                        'Cache-Control': 'public, max-age=3600',
                        'Content-Disposition': 'inline; filename="model.glb"',
                        'Content-Length': altResponse.headers.get('content-length') || ''
                      },
                    });
                  }
                }
              }
            }
          } catch (altErr) {
            console.error('Alternative domain attempt failed:', altErr);
          }
        }
        
        if (attempt < 3) {
          console.log(`Retrying in ${2 * attempt} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
    
    // If all attempts failed
    if (lastError) {
      if (lastError.name === 'AbortError' || lastError.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'Request timeout - The model file is large and taking too long to download. Please try again.' },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch model after 3 attempts: ${lastError.message}` },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout - The model file is large and taking too long to download. Please try again.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch model' },
      { status: 500 }
    );
  }
}

export async function HEAD(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelUrl = searchParams.get('url');

  if (!modelUrl) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(modelUrl);
    
    console.log('HEAD request for:', decodedUrl.substring(0, 100) + '...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(decodedUrl, { 
        method: 'HEAD',
        headers: {
          'Accept': 'application/octet-stream, model/gltf-binary, */*',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return new NextResponse(null, { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('content-type') || 'model/gltf-binary',
            'Content-Length': response.headers.get('content-length') || '0'
          }
        });
      } else {
        return new NextResponse(null, { status: response.status });
      }
    } catch (headErr) {
      clearTimeout(timeoutId);
      throw headErr;
    }
  } catch (error) {
    console.error('HEAD request error:', error);
    
    // Return 200 anyway to let the GET request try
    // This is a fallback - the HEAD might fail but GET could work
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'model/gltf-binary'
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}