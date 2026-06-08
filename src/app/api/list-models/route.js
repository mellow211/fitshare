import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      return NextResponse.json({ error: 'API Key is not configured' }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `ListModels failed: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Map to simplify output and show only generateContent models
    const availableModels = data.models
      ? data.models.map(m => ({
          name: m.name,
          displayName: m.displayName,
          supportedMethods: m.supportedMethods
        }))
      : [];

    return NextResponse.json({
      message: '성공적으로 모델 목록을 가져왔습니다.',
      models: availableModels
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
