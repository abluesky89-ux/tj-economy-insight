export async function onRequestPost(context) {
  const { request, env } = context;

  // OpenAI API Key는 Cloudflare Pages 대시보드의 Settings > Environment variables에서 설정해야 합니다.
  const OPENAI_API_KEY = env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OpenAI API Key is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { titles } = await request.json();

    const prompt = `다음은 오늘 주요 경제 뉴스 제목들입니다:\n${titles}\n\n이 뉴스들을 분석하여 다음 형식의 JSON 배열로만 응답해주세요 (다른 텍스트 없이 JSON만 반환):
    [
      {
        "summary": [{"text": "첫 번째 요약 문장"}, {"text": "두 번째 요약 문장"}, {"text": "세 번째 요약 문장"}],
        "insight": "전문가적인 인사이트 내용",
        "category": "macro, stocks, realestate, tech 중 하나"
      }
    ]
    
    각 뉴스는 초등학생도 이해할 수 있게 쉬운 말투로 3줄 요약해주고, 인사이트는 실질적인 투자나 경제 생활에 도움이 되는 팁을 포함해주세요.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 또는 "gpt-3.5-turbo"
        messages: [
          { role: "system", content: "당신은 어려운 경제 뉴스를 쉽게 풀어서 설명해주는 경제 전문가입니다." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // JSON 부분만 추출 (마크다운 코드 블록 제거)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
