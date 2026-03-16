import { NextResponse } from 'next/server';
import { TaskStatusResponse, ErrorResponse } from '@/app/types/tripo.types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<TaskStatusResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    const response = await fetch(`${process.env.NEXT_PUBLIC_TRIPO_API_URL}/task/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO_API_KEY}`
      }
    });

    const data: TaskStatusResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}