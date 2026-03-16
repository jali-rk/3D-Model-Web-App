import { NextResponse } from 'next/server';
import { UploadResponse, ErrorResponse } from '@/app/types/tripo.types';

export async function POST(request: Request): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to Tripo API
    const tripoFormData = new FormData();
    tripoFormData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_TRIPO_API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO_API_KEY}`
      },
      body: tripoFormData
    });

    const data: UploadResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}