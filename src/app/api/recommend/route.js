import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { clothes, childSize } = await req.json();

    if (!clothes || !Array.isArray(clothes) || clothes.length === 0) {
      return NextResponse.json({ error: 'Clothes list is empty' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey === 'your-gemini-api-key';

    // Group clothes by category
    const tops = clothes.filter(i => i.status === 'available' && (i.category === '상의' || i.category === '아우터'));
    const bottoms = clothes.filter(i => i.status === 'available' && i.category === '하의');

    if (tops.length === 0 || bottoms.length === 0) {
      return NextResponse.json([]); // Not enough clothes to make outfits
    }

    if (isMock) {
      // Mock Fashion recommendation
      await new Promise(resolve => setTimeout(resolve, 800));

      const recommendations = [];
      const maxCombos = Math.min(3, tops.length * bottoms.length);
      
      let count = 0;
      for (const top of tops) {
        for (const bottom of bottoms) {
          if (count >= maxCombos) break;

          const isSameStyle = top.style === bottom.style;
          const isSameColor = top.color === bottom.color;

          let title = '꾸안꾸 상큼 캐주얼 셋업';
          let commentary = `화사한 ${top.color} 상의와 단정한 ${bottom.color} 하의를 톤인톤으로 조화롭게 매치하여 세련되면서도 편안한 느낌을 주는 자연스러운 일상 통학 룩입니다.`;
          let score = 85;
          let tags = ['#데일리캐주얼', '#톤인톤배색', '#편안함'];

          if (isSameStyle) {
            if (top.style === '체육복') {
              title = `활동성 만점 ${top.color} 체육복 세트`;
              commentary = `상하의 모두 편안하고 튼튼한 체육복 소재로 매치하여 하루 종일 에너지를 뽐내며 뛰어놀기 좋은 스포티 룩입니다. 일치하는 스타일 라인이 일체감을 줍니다.`;
              score = 95;
              tags = ['#애슬레저룩', '#활동성최고', '#스포티'];
            } else if (top.style === '교복' || top.style === '교복/생활복') {
              title = `단정한 프리미엄 스쿨룩`;
              commentary = `정갈하고 차분한 상하의 교복 조합으로 단정하고 스마트한 느낌을 주는 베이직 등교 코디입니다. 학교 수업이나 단체 활동에 가장 완벽하게 잘 어울립니다.`;
              score = 98;
              tags = ['#클래식스쿨룩', '#단정한등교', '#프레피룩'];
            }
          } else if (isSameColor) {
            title = `${top.color} 톤온톤 깔끔 코디`;
            commentary = `상의와 하의를 세련된 ${top.color} 단색 톤온톤 배색으로 맞추어 시각적 일체감을 주며, 키가 더 크고 비율이 좋아 보이는 효과를 연출하는 코디입니다.`;
            score = 90;
            tags = ['#톤온톤코디', '#비율깡패', '#미니멀스타일'];
          }

          recommendations.push({
            topId: top.id,
            bottomId: bottom.id,
            top,
            bottom,
            title,
            score,
            commentary,
            tags
          });

          count++;
        }
      }

      return NextResponse.json(recommendations.sort((a, b) => b.score - a.score));
    }

    // Call real Gemini API
    const cleanClothes = clothes.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      color: i.color,
      style: i.style,
      measurements: i.measurements
    }));

    const prompt = `
You are a professional junior fashion stylist.
Analyze the list of available school clothing items provided and generate up to 3 stylish outfit sets (each set must have a top and a bottom, and optionally an outerwear item if available).

Fashion Principles to apply:
1. Tone-on-Tone (same color family with different shades) or Tone-in-Tone (similar saturation/brightness with different colors).
2. Style matching (e.g. matching school uniform pieces, matching gym wear, matching casual clothing).
3. Contrast and balance (e.g. clean white top with dark navy pants).

For each recommended outfit, provide:
1. The topId (garment id for the top)
2. The bottomId (garment id for the bottom)
3. The outerId (optional outerwear garment id)
4. A creative theme name in Korean (e.g., '활동성 만점 등교 셋업', '단정한 프리미엄 스쿨룩')
5. A fashion compatibility score (0-100)
6. A professional and encouraging styling commentary in Korean explaining the color coordination and fashion choices (around 2-3 sentences)
7. An array of style hashtags (e.g. '#톤온톤', '#단정함', '#체육복룩')

Available Clothes:
${JSON.stringify(cleanClothes, null, 2)}

IMPORTANT: Return ONLY a valid JSON array matching the schema below, without any markdown formatting, explanation, or code blocks.

Schema:
[
  {
    "topId": "string",
    "bottomId": "string",
    "outerId": "string (optional)",
    "title": "string",
    "score": number,
    "commentary": "string",
    "tags": ["string", "string"]
  }
]
`;

    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];

    let lastError = null;
    let responseText = null;

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
                  parts: [{ text: prompt }]
                }
              ]
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
          console.log(`Successfully analyzed recommendations using model: ${modelName}`);
          break;
        } else {
          throw new Error(`${modelName} returned empty content`);
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying fallback. Error: ${err.message}`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    let cleanText = responseText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const aiOutfits = JSON.parse(cleanText.trim());

    // Map the selected IDs back to the actual clothing objects for the client response
    const finalRecommendations = aiOutfits.map(rec => {
      const topObj = clothes.find(i => i.id === rec.topId);
      const bottomObj = clothes.find(i => i.id === rec.bottomId);
      const outerObj = rec.outerId ? clothes.find(i => i.id === rec.outerId) : null;

      if (!topObj || !bottomObj) return null;

      return {
        topId: rec.topId,
        bottomId: rec.bottomId,
        outerId: rec.outerId || null,
        top: topObj,
        bottom: bottomObj,
        outer: outerObj,
        title: rec.title || '스타일리시한 등교룩',
        score: rec.score || 80,
        commentary: rec.commentary || '두 옷의 스타일과 실루엣이 자연스럽게 연출되는 조합입니다.',
        tags: rec.tags || ['#데일리코디', '#등교룩']
      };
    }).filter(Boolean);

    return NextResponse.json(finalRecommendations);

  } catch (error) {
    console.error('Gemini recommendation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
