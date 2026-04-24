const GEMINI_API_KEY = "AIzaSyBFwQ_YAwlxHZWIXMiyqjAwtgH_kBW-m8I";
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "tj_news_cache";
const CACHE_TIME = 30 * 60 * 1000; // 30분 캐시

let newsData = [];
const termData = [
    { id: 1, term: '금리', definition: '돈의 가격', easyExplainer: '이자율이 낮아지면 대출받기 쉬워져요.' },
    { id: 2, term: '인플레이션', definition: '물가 상승', easyExplainer: '돈의 가치가 떨어지는 현상이에요.' }
];

const newsTitles = [
    { title: "엔비디아 주가 역대 최고치 경신, AI 칩 독점의 힘", cat: 'tech', catName: '테크/산업' },
    { title: "미국 연준 금리 동결, 시장은 하반기 인하 기대", cat: 'macro', catName: '거시경제' },
    { title: "서울 주요 아파트 단지 신고가 속출, 바닥 확인했나", cat: 'realestate', catName: '부동산' },
    { title: "K-배터리 북미 시장 점유율 확대, 리튬 가격 하락이 변수", cat: 'stocks', catName: '증시/투자' },
    { title: "반도체 수출 5개월 연속 증가, 수출 회복세 뚜렷", cat: 'tech', catName: '테크/산업' },
    { title: "청년층 생애 첫 주택 구매 비중 역대 최고 기록", cat: 'realestate', catName: '부동산' }
];

async function fetchAllNewsWithAI() {
    // 1. 캐시 확인
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
            console.log("Loading from cache...");
            return data;
        }
    }

    // 2. 통합 질문(Batch) 생성
    const titlesStr = newsTitles.map((n, i) => `${i+1}. ${n.title}`).join("\n");
    const prompt = `다음 6개 경제 뉴스 제목을 각각 초등학생 수준으로 3줄 요약하고 인사이트를 적어줘. 
    반드시 다음 JSON 배열 형식으로만 답해: 
    [
      {"summary": [{"text":"요약1"}, {"text":"요약2"}, {"text":"요약3"}], "insight": "인사이트 내용"},
      ... (총 6개)
    ]
    뉴스 제목들:
    ${titlesStr}`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
            const aiResults = JSON.parse(match[0]);
            const finalData = newsTitles.map((item, idx) => ({
                ...item,
                id: idx,
                summary: aiResults[idx].summary,
                insight: aiResults[idx].insight,
                isHero: idx === 0
            }));
            
            // 캐시 저장
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: finalData, timestamp: Date.now() }));
            return finalData;
        }
    } catch (e) {
        console.error("AI Batch Error:", e);
        return null;
    }
}

async function init() {
    updateDate();
    fetchMarketData();
    const container = document.getElementById('news-grid');
    
    // 로딩 화면
    if (container) container.innerHTML = "<div style='grid-column:1/-1;text-align:center;padding:40px;'><h3>초고속 AI 분석 엔진 가동 중...</h3><p>한 번 분석하면 30분 동안 즉시 로딩됩니다.</p></div>";

    const results = await fetchAllNewsWithAI();
    
    if (results) {
        newsData = results;
        renderNews();
    } else {
        container.innerHTML = "<p style='grid-column:1/-1;text-align:center;'>분석 중 오류가 발생했습니다. 잠시 후 새로고침 해주세요.</p>";
    }
}

function renderNews(filter = 'all') {
    const container = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (!container || !hero) return;

    if (filter === 'terms') {
        hero.style.display = 'none';
        container.innerHTML = termData.map(t => `<article class="news-card"><h3>${t.term}</h3><p>${t.easyExplainer}</p></article>`).join('');
        return;
    }

    const filtered = filter === 'all' ? newsData : newsData.filter(n => n.category === filter);
    const heroNews = newsData.find(n => n.isHero);
    
    if (filter === 'all' && heroNews) {
        hero.style.display = 'block';
        hero.innerHTML = `
            <div class="hero-card">
                <div class="hero-content">
                    <span class="hero-category">${heroNews.categoryName}</span>
                    <h2 style="margin:10px 0;">${heroNews.title}</h2>
                    <ul style="margin-bottom:15px; padding-left:20px;">${heroNews.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
                    <div class="insight-box" style="background: #eef2f7; border-left: 5px solid #3498db;">
                        <b>📢 AI 인사이트:</b> ${heroNews.insight}
                    </div>
                </div>
            </div>`;
    } else { hero.style.display = 'none'; }
    
    const gridNews = filter === 'all' ? filtered.filter(n => !n.isHero) : filtered;
    container.innerHTML = gridNews.map(n => `
        <article class="news-card">
            <span class="category-tag">${n.categoryName}</span>
            <h3 style="margin:10px 0; font-size: 18px;">${n.title}</h3>
            <ul style="margin-bottom:15px; padding-left:20px; color: #555; font-size:14px;">${n.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box" style="font-size:14px;">
                <b>📢 AI 인사이트:</b><br>${n.insight}
            </div>
        </article>`).join('');
}

function fetchMarketData() {
    fetch(EXCHANGE_RATE_API).then(res => res.json()).then(data => {
        const bar = document.getElementById('market-bar');
        if (bar) bar.innerHTML = `<div style="text-align:center;font-size:12px;padding:5px;color:white;">실시간 환율: 1달러 = <b>${data.rates.KRW.toFixed(2)}원</b></div>`;
    });
}

function updateDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
}

window.showPolicy = function(type) {
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    const content = {
        about: "<h2>서비스 소개</h2><p>TJ Economy Insight는 초고속 AI 기술로 경제 뉴스를 요약합니다.</p>",
        privacy: "<h2>개인정보처리방침</h2><p>정보를 수집하지 않습니다.</p>",
        terms: "<h2>이용약관</h2><p>투자 책임은 본인에게 있습니다.</p>",
        contact: "<h2>문의하기</h2><p>Email: contact@tjinsight.com</p>"
    };
    body.innerHTML = content[type];
    modal.style.display = 'block';
};

document.querySelector('.close-modal').onclick = () => { document.getElementById('detail-modal').style.display = 'none'; };
document.addEventListener('DOMContentLoaded', init);
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderNews(e.target.dataset.category);
    });
});
