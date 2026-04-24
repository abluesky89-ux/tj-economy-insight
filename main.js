const GEMINI_API_KEY = "AIzaSyBFwQ_YAwlxHZWIXMiyqjAwtgH_kBW-m8I";
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";
const NEWS_RSS_URL = "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko";
const CACHE_KEY = "tj_realtime_news_cache";
const CACHE_TIME = 60 * 60 * 1000; // 1시간 유지

let newsData = [];

// 1. 실시간 뉴스 헤드라인 가져오기 (CORS 우회 프록시 사용)
async function fetchRealtimeHeadlines() {
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(NEWS_RSS_URL)}`;
        const response = await fetch(proxyUrl);
        const json = await response.json();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(json.contents, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        
        const headlines = [];
        for (let i = 0; i < 6; i++) {
            if (items[i]) {
                const fullTitle = items[i].querySelector("title").textContent;
                // 매체명 제거 (예: "기사제목 - 연합뉴스" -> "기사제목")
                const cleanTitle = fullTitle.split(" - ")[0];
                headlines.push({ title: cleanTitle, url: items[i].querySelector("link").textContent });
            }
        }
        return headlines;
    } catch (e) {
        console.error("News Fetch Error:", e);
        return null;
    }
}

// 2. AI 통합 분석
async function analyzeNewsWithAI(headlines) {
    const titlesStr = headlines.map((n, i) => `${i+1}. ${n.title}`).join("\n");
    const prompt = `Economy News Titles:\n${titlesStr}\n\nSummarize each for kids in 3 lines and add one practical insight. Reply ONLY with valid JSON array: [{"summary": [{"text":"line1"}, {"text":"line2"}, {"text":"line3"}], "insight": "practical advice"}]`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const json = await res.json();
        const text = json.candidates[0].content.parts[0].text;
        const match = text.match(/\[[\s\S]*\]/);
        
        if (match) {
            const aiResults = JSON.parse(match[0]);
            return headlines.map((item, idx) => ({
                id: idx,
                title: item.title,
                url: item.url,
                category: 'all',
                catName: '실시간 핫이슈',
                summary: aiResults[idx]?.summary || [],
                insight: aiResults[idx]?.insight || "",
                isHero: idx === 0
            }));
        }
    } catch (e) { return null; }
}

async function init() {
    updateDate();
    fetchMarketData();
    const container = document.getElementById('news-grid');
    
    // 캐시 확인
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
            newsData = data;
            renderNews(newsData);
            return;
        }
    }

    if (container) container.innerHTML = "<div style='grid-column:1/-1;text-align:center;padding:50px;'><h3>지금 이 순간 가장 중요한 뉴스를 수집 중...</h3><p>AI가 실시간 헤드라인을 읽고 있습니다.</p></div>";

    const headlines = await fetchRealtimeHeadlines();
    if (headlines) {
        const analyzedData = await analyzeNewsWithAI(headlines);
        if (analyzedData) {
            newsData = analyzedData;
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newsData, timestamp: Date.now() }));
            renderNews(newsData);
            return;
        }
    }
    
    container.innerHTML = "<p style='grid-column:1/-1;text-align:center;'>뉴스를 가져오지 못했습니다. 잠시 후 새로고침 해주세요.</p>";
}

function renderNews(data, filter = 'all') {
    const container = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (!container || !hero) return;

    // 실시간 데이터는 카테고리가 섞여 있으므로 '전체' 위주로 표시
    const heroItem = data[0];

    if (filter === 'all' && heroItem) {
        hero.style.display = 'block';
        hero.innerHTML = `<div class="hero-card"><div class="hero-content">
            <span class="hero-category">실시간 핫이슈</span>
            <h2 style="margin:10px 0; cursor:pointer;" onclick="window.open('${heroItem.url}')">${heroItem.title}</h2>
            <ul style="margin-bottom:15px; padding-left:20px;">${heroItem.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box"><b>📢 실시간 AI 인사이트:</b> ${heroItem.insight}</div>
        </div></div>`;
    } else { hero.style.display = 'none'; }

    const gridItems = filter === 'all' ? data.slice(1) : data;
    container.innerHTML = gridItems.map(n => `
        <article class="news-card">
            <span class="category-tag">실시간 속보</span>
            <h3 style="margin:10px 0; font-size:18px; cursor:pointer;" onclick="window.open('${n.url}')">${n.title}</h3>
            <ul style="margin-bottom:15px; padding-left:20px; color:#555; font-size:14px;">${n.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box" style="font-size:14px;"><b>📢 AI 인사이트:</b><br>${n.insight}</div>
        </article>`).join('');

    window.currentNewsData = data;
}

function fetchMarketData() {
    fetch(EXCHANGE_RATE_API).then(res => res.json()).then(data => {
        const bar = document.getElementById('market-bar');
        if (bar) bar.innerHTML = `<div style="text-align:center;font-size:12px;padding:5px;color:white;">실시간 환율: 1달러 = <b>${data.rates.KRW.toFixed(2)}원</b></div>`;
    });
}

function updateDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
}

window.showPolicy = function(type) {
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    const contents = {
        about: "<h2>서비스 소개</h2><p>실시간 구글 뉴스를 AI로 요약합니다.</p>",
        privacy: "<h2>개인정보처리방침</h2><p>정보를 수집하지 않습니다.</p>",
        terms: "<h2>이용약관</h2><p>투자 책임은 본인에게 있습니다.</p>",
        contact: "<h2>문의하기</h2><p>Email: contact@tjinsight.com</p>"
    };
    body.innerHTML = contents[type];
    modal.style.display = 'block';
};

document.querySelector('.close-modal').onclick = () => { document.getElementById('detail-modal').style.display = 'none'; };
document.addEventListener('DOMContentLoaded', init);
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderNews(window.currentNewsData, e.target.dataset.category);
    });
});
