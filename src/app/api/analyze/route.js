import { NextResponse } from 'next/server';

const KIDS_STANDARD_SIZES = {
  '상의': {
    '120': { shoulder: 32, chest: 37, sleeve: 43, length: 48 },
    '130': { shoulder: 34, chest: 39, sleeve: 47, length: 52 },
    '140': { shoulder: 36, chest: 42, sleeve: 51, length: 57 },
    '150': { shoulder: 38, chest: 45, sleeve: 55, length: 62 },
    '160': { shoulder: 40, chest: 48, sleeve: 59, length: 67 }
  },
  '아우터': {
    '120': { shoulder: 33, chest: 38, sleeve: 44, length: 49 },
    '130': { shoulder: 35, chest: 40, sleeve: 48, length: 53 },
    '140': { shoulder: 37, chest: 43, sleeve: 52, length: 58 },
    '150': { shoulder: 39, chest: 46, sleeve: 56, length: 63 },
    '160': { shoulder: 41, chest: 49, sleeve: 60, length: 68 }
  },
  '하의': {
    '120': { waist: 25, length: 68 },
    '130': { waist: 26, length: 74 },
    '140': { waist: 28, length: 80 },
    '150': { waist: 30, length: 86 },
    '160': { waist: 32, length: 92 }
  }
};

export async function POST(req) {
  try {
    const { image, categoryHint, mode, standardSize } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Extract base64 clean content
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey === 'your-gemini-api-key';

    if (isMock) {
      // Mock AI analysis after a short delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));

      const isPants = categoryHint === '하의' || (categoryHint !== '상의' && Math.random() > 0.5);
      const detectedCategory = isPants ? '하의' : (categoryHint === '아우터' ? '아우터' : '상의');
      const detectedStyle = detectedCategory === '아우터' ? '교복' : '체육복';
      
      let measurements = {};
      if (detectedCategory === '하의') {
        measurements = {
          waist: 28 + Math.floor(Math.random() * 4), // 28 ~ 31 cm
          length: 68 + Math.floor(Math.random() * 10) // 68 ~ 77 cm
        };
      } else {
        measurements = {
          shoulder: 36 + Math.floor(Math.random() * 6), // 36 ~ 41 cm
          chest: 42 + Math.floor(Math.random() * 6),    // 42 ~ 47 cm
          sleeve: 48 + Math.floor(Math.random() * 8),   // 48 ~ 55 cm
          length: 54 + Math.floor(Math.random() * 8)    // 54 ~ 61 cm
        };
      }

      // If easy mode is active and standard size is provided, override with standard sizes
      if (mode === 'easy' && standardSize && KIDS_STANDARD_SIZES[detectedCategory]?.[standardSize]) {
        measurements = KIDS_STANDARD_SIZES[detectedCategory][standardSize];
      }

      if (detectedCategory === '하의') {
        return NextResponse.json({
          category: '하의',
          color: '네이비',
          style: detectedStyle,
          measurements,
          guidelines: {
            waist_y: 15,
            length_start_y: 15,
            length_end_y: 95
          }
        });
      } else {
        return NextResponse.json({
          category: detectedCategory,
          color: '네이비',
          style: detectedStyle,
          measurements,
          guidelines: {
            shoulder_y: 20,
            chest_y: 36,
            sleeve_start_x: 26,
            sleeve_end_x: 12,
            length_start_y: 20,
            length_end_y: 88
          }
        });
      }
    }

    // Call real Gemini API via REST endpoint
    const prompt = `
You are an expert school clothing tailor and size analyzer.
Analyze the clothing photo provided.
First, detect the clothing category: '상의' (Tops like shirts,생활복), '하의' (Bottoms like trousers,skirts,shorts), or '아우터' (Outerwear like blazer,cardigan,jumper).
Second, detect the main color in Korean (e.g. '네이비', '화이트', '블랙', '그레이', '옐로우', '그린').
Third, detect the style classification: '교복' (Official School Uniform), '체육복' (School Gym Wear), or '일상복' (Casual Everyday Wear).

Fourth, estimate reasonable flat-laid dimensions in centimeters (cm) for an elementary school child.
- For '상의' or '아우터', output these measurements:
  * shoulder (shoulder width, flat laid)
  * chest (chest width, flat laid)
  * sleeve (sleeve length)
  * length (total length from high shoulder point to bottom)
- For '하의', output these measurements:
  * waist (waist flat laid width, not circumference)
  * length (total side length from waist top to hem)

Fifth, output approximate visual coordinate percentages (0 to 100) indicating where the measurement lines should be drawn relative to the bounding box of the clothing in the image:
- For '상의' / '아우터':
  * 'shoulder_y': Y-axis percentage line for shoulder-to-shoulder width (typically around 18-22%)
  * 'chest_y': Y-axis percentage line for chest width (typically around 32-38%)
  * 'sleeve_start_x': X-axis percentage from left where sleeve begins (typically around 25-28%)
  * 'sleeve_end_x': X-axis percentage from left where sleeve ends (typically around 10-15%)
  * 'length_start_y': Y-axis percentage from top where length measurement starts (typically around 18-22%)
  * 'length_end_y': Y-axis percentage from top where length measurement ends (typically around 85-90%)
- For '하의':
  * 'waist_y': Y-axis percentage for waist width line (typically around 12-16%)
  * 'length_start_y': Y-axis percentage where trousers length starts (typically around 12-16%)
  * 'length_end_y': Y-axis percentage where trousers length ends (typically around 92-96%)

IMPORTANT: Return ONLY a valid JSON object matching the schema below, without any markdown formatting or explanation text.

Schema:
{
  "category": "상의" | "하의" | "아우터",
  "color": "네이비" | "화이트" | "블랙" | "그레이" | "기타...",
  "style": "교복" | "체육복" | "일상복",
  "measurements": {
    // for 상의/아우터:
    "shoulder": number,
    "chest": number,
    "sleeve": number,
    "length": number
    // or for 하의:
    "waist": number,
    "length": number
  },
  "guidelines": {
    // for 상의/아우터:
    "shoulder_y": number,
    "chest_y": number,
    "sleeve_start_x": number,
    "sleeve_end_x": number,
    "length_start_y": number,
    "length_end_y": number
    // or for 하의:
    "waist_y": number,
    "length_start_y": number,
    "length_end_y": number
  }
}
`;

    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];

    let lastError = null;
    let responseText = null;

    // Retry loop through available models to bypass 503 (high demand) or 429 (rate limits)
    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${modelName} responded with status ${response.status}: ${errText}`);
        }

        const resJson = await response.json();
        responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          console.log(`Successfully analyzed image using model: ${modelName}`);
          break;
        } else {
          throw new Error(`${modelName} returned empty content`);
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next fallback. Error: ${err.message}`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // Strip markdown code fences (like ```json ... ```) if returned by the model
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(cleanText.trim());

    // If easy mode is active and standard size is provided, override measurements with standard chart
    const detectedCategory = result.category || '상의';
    if (mode === 'easy' && standardSize && KIDS_STANDARD_SIZES[detectedCategory]?.[standardSize]) {
      result.measurements = KIDS_STANDARD_SIZES[detectedCategory][standardSize];
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Gemini analysis route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
