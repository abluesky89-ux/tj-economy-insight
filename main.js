// 1. 설정 및 API 연결
const GEMINI_API_KEY = "AIzaSyBFwQ_YAwlxHZWIXMiyqjAwtgH_kBW-m8I";
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";

let marketData = [
    { name: 'KOSPI', value: '2,647.50', change: '+0.45%', up: true },
    { name: 'KOSDAQ', value: '862.10', change: '-0.12%', up: false },
    { name: 'NASDAQ', value: '16,274.90', change: '+1.10%', up: true },
    { name: '환율(USD/KRW)', value: '로딩 중...', change: '-', up: true }
];

let newsData = []; // AI가 생성한 뉴스가 담길 배열

// 2. Gemini AI에게 요약 요청하는 함수
async function summarizeNewsWithAI(newsTitle) {
    const prompt = `
    다음 경제 뉴스 제목을 바탕으로 초등학생도 이해할 수 있게 내용을 요약해줘.
    뉴스 제목: "${newsTitle}"
    
    응답은 반드시 아래의 JSON 형식으로만 해줘:
    {
        "summary": [
            {"text": "첫 번째 요약 문장"},
            {"text": "두 번째 요약 문장"},
            {"text": "세 번째 요약 문장"}
        ],
        "insight": "이 뉴스가 우리에게 주는 의미를 아주 쉽게 설명한 문장"
    }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        // JSON 부분만 추출 (마크다운 제거)
        const jsonStr = responseText.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI 요약 실패:", error);
        return null;
    }
}

// 3. 실시간 뉴스 업데이트 메인 로직
async function updateRealTimeNews() {
    const newsContainer = document.getElementById('news-grid');
    if (newsContainer) newsContainer.innerHTML = "<p style='padding: 20px;'>AI가 실시간 경제 뉴스를 읽고 요약하는 중입니다...</p>";

    // 실제로는 뉴스 API에서 제목들을 가져오지만, 여기서는 최신 트렌드 제목 3개를 예시로 사용합니다.
    const latestTitles = [
        "엔비디아 주가 또 사상 최고치, AI 반도체 독주 체제 굳히나",
        "한국 소비자물가 상승폭 둔화, 금리 인하 시점 당겨질까",
        "서울 아파트 거래 가뭄 해소 조짐, 강남권 위주로 급매물 소진"
    ];

    const updatedNews = [];
    for (let i = 0; i < latestTitles.length; i++) {
        const aiResponse = await summarizeNewsWithAI(latestTitles[i]);
        if (aiResponse) {
            updatedNews.push({
                id: Date.now() + i,
                category: i === 0 ? 'tech' : i === 1 ? 'macro' : 'realestate',
                categoryName: i === 0 ? '테크/산업' : i === 1 ? '거시경제' : '부동산',
                title: latestTitles[i],
                summary: aiResponse.summary,
                insight: aiResponse.insight,
                isHero: i === 0
            });
        }
    }

    newsData = updatedNews;
    renderNews();
}

// 4. 기존 렌더링 로직 (유지 및 보완)
function renderMarketBar() {
    const marketBar = document.getElementById('market-bar');
    if (!marketBar) return;

    const indicesHtml = marketData.map(item => `
        <div class="market-item">
            <span class="market-label">${item.name}</span>
            <span class="market-value">${item.value}</span>
            <span class="market-change ${item.up ? 'up' : 'down'}">${item.change}</span>
        </div>
    `).join('');
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    marketBar.innerHTML = `
        <div class="market-container" style="display: flex; width: 100%; max-width: 1000px; margin: 0 auto; align-items: center; justify-content: space-between; padding: 0 20px;">
            <div class="market-scroll-area" style="display: flex; gap: 25px; overflow-x: auto; scrollbar-width: none;">
                ${indicesHtml}
            </div>
            <div class="market-timestamp" style="font-size: 11px; color: #bdc3c7; white-space: nowrap; margin-left: 20px;">
                최근 갱신: ${timeString}
            </div>
        </div>
    `;
}

async function fetchMarketData() {
    try {
        const response = await fetch(EXCHANGE_RATE_API);
        const data = await response.json();
        if (data && data.rates && data.rates.KRW) {
            marketData[3].value = data.rates.KRW.toFixed(2);
            renderMarketBar();
        }
    } catch (error) { console.error(error); }
}

function renderNews(filter = 'all') {
    const container = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (!container || !hero) return;

    const filtered = filter === 'all' ? newsData : newsData.filter(n => n.category === filter);
    
    // Hero Section
    const heroNews = filtered.find(n => n.isHero);
    if (filter === 'all' && heroNews) {
        hero.innerHTML = `
            <div class="hero-card">
                <div class="hero-content">
                    <span class="hero-category">${heroNews.categoryName}</span>
                    <h2 class="hero-title">${heroNews.title}</h2>
                    <ul class="news-summary-list hero-summary">
                        ${heroNews.summary.map(s => `<li>${s.text}</li>`).join('')}
                    </ul>
                    <div class="insight-box">
                        <span class="insight-label">💡 AI의 쉬운 한마디</span>
                        <p>${heroNews.insight}</p>
                    </div>
                </div>
            </div>`;
        hero.style.display = 'block';
    } else {
        hero.style.display = 'none';
    }

    // Grid Section
    const gridNews = filter === 'all' ? filtered.filter(n => !n.isHero) : filtered;
    container.innerHTML = gridNews.map(n => `
        <article class="news-card">
            <span class="category-tag">${n.categoryName}</span>
            <h3 class="news-title">${n.title}</h3>
            <ul class="news-summary-list">
                ${n.summary.map(s => `<li>${s.text}</li>`).join('')}
            </ul>
            <div class="insight-box">
                <span class="insight-label">💡 AI 핵심 포인트</span>
                <p>${n.insight}</p>
            </div>
        </article>`).join('');
}

// 5. 초기 실행
document.addEventListener('DOMContentLoaded', () => {
    fetchMarketData();
    updateRealTimeNews(); // 페이지 로드 시 AI 요약 실행
    
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderNews(e.target.dataset.category);
        });
    });
});
