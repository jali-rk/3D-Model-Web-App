import { NextResponse } from 'next/server';
import { TaskRequest, TaskResponse, ErrorResponse } from '@/app/types/tripo.types';

export async function POST(request: Request): Promise<NextResponse<TaskResponse | ErrorResponse>> {
  try {
    const body: TaskRequest = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_TRIPO_API_URL}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data: TaskResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}