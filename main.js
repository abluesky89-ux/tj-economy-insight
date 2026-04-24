const GEMINI_API_KEY = "AIzaSyBFwQ_YAwlxHZWIXMiyqjAwtgH_kBW-m8I";
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";
const NEWS_JSON_URL = "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fheadlines%2Fsection%2Ftopic%2FBUSINESS%3Fhl%3Dko%26gl%3DKR%26ceid%3DKR%3Ako";
const CACHE_KEY = "tj_final_news_cache_v3";
const CACHE_TIME = 60 * 60 * 1000;

// 고퀄리티 경제 용어 데이터 (뉴스 아님!)
const termData = [
    { id: 1, term: '금리 (Interest Rate)', definition: '돈을 빌린 대가로 내는 이자의 비율', easyExplainer: '쉽게 말해 "돈의 빌려 쓰는 가격"이에요. 금리가 낮아지면 은행 대출 이자가 싸져서 사람들이 집도 사고 쇼핑도 더 많이 하게 된답니다.', example: '한국은행이 금리를 내리면 우리 엄마 아빠의 대출 이자 부담이 줄어들어요.' },
    { id: 2, term: '인플레이션 (Inflation)', definition: '물가가 계속 오르고 돈의 가치가 떨어지는 현상', easyExplainer: '작년엔 1,000원에 사던 과자가 올해는 2,000원이 되는 상황이에요. 내 지갑 속 돈의 힘이 약해지는 거죠.', example: '점심 한 끼 가격이 예전보다 훨씬 비싸진 것도 인플레이션 때문이에요.' },
    { id: 3, term: '환율 (Exchange Rate)', definition: '우리나라 돈과 다른 나라 돈을 바꾸는 비율', easyExplainer: '미국 여행을 갈 때 1달러를 사기 위해 우리 돈 얼마를 줘야 하는지를 결정해요.', example: '환율이 오르면(강달러) 해외 직구 물건값이 비싸져요.' },
    { id: 4, term: '공매도 (Short Selling)', definition: '주식을 빌려서 팔고, 나중에 사서 갚는 투자 방식', easyExplainer: '주가가 "내려갈 것 같을 때" 돈을 버는 방법이에요. 비쌀 때 빌려 팔고, 나중에 가격이 떨어지면 싸게 사서 돌려주는 거죠.', example: '주가가 너무 과하게 올랐을 때 거품을 빼는 역할을 하기도 해요.' }
];

const fallbackData = [
    { title: "엔비디아 주가 사상 최고치, AI 산업의 중심", catName: "테크/산업", summary: [{text:"AI 반도체 수요가 폭발적입니다."}, {text:"강력한 실적 성장이 뒷받침됩니다."}, {text:"시장 주도권을 완전히 확보했습니다."}], insight: "AI 대장주 엔비디아의 흐름을 보면 전체 IT 시장이 보여요." }
];

async function fetchNews() {
    try {
        const res = await fetch(NEWS_JSON_URL);
        const data = await res.json();
        if (data.status === 'ok' && data.items.length > 0) {
            return data.items.slice(0, 6).map(i => ({ title: i.title.split(" - ")[0], url: i.link }));
        }
    } catch (e) { return null; }
}

async function analyzeWithAI(headlines) {
    const titlesStr = headlines.map((h, i) => `${i+1}. ${h.title}`).join("\n");
    const prompt = `Economy News Titles:\n${titlesStr}\n\nSummarize each for kids in 3 lines and add one insight. Reply ONLY JSON array: [{"summary": [{"text":"line1"}, {"text":"line2"}, {"text":"line3"}], "insight": "text"}]`;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const json = await res.json();
        const text = json.candidates[0].content.parts[0].text;
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
            const aiRes = JSON.parse(match[0]);
            return headlines.map((h, i) => ({
                id: i, title: h.title, url: h.url, catName: "실시간 속보",
                summary: aiRes[i]?.summary || [], insight: aiRes[i]?.insight || "", isHero: i === 0
            }));
        }
    } catch (e) { return null; }
}

async function init() {
    updateDate();
    fetchMarketData();
    const container = document.getElementById('news-grid');
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
            window.currentNewsData = data;
            renderNews(data);
            return;
        }
    }

    if (container) container.innerHTML = "<div style='grid-column:1/-1;text-align:center;padding:50px;'><h3>경제 트렌드를 정밀 분석 중입니다...</h3></div>";

    const headlines = await fetchNews();
    let finalData = fallbackData.map((d, i) => ({...d, id: i, isHero: i===0, category: 'all'}));
    
    if (headlines) {
        const analyzed = await analyzeWithAI(headlines);
        if (analyzed) finalData = analyzed;
    }

    window.currentNewsData = finalData;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: finalData, timestamp: Date.now() }));
    renderNews(finalData);
}

function renderNews(data, filter = 'all') {
    const container = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (!container || !hero) return;

    // '경제 용어' 탭 처리 로직 (완벽 복구)
    if (filter === 'terms') {
        hero.style.display = 'none';
        container.innerHTML = termData.map(t => `
            <article class="news-card" style="border-top: 5px solid #e67e22; background: #fffaf0;">
                <span class="category-tag" style="color: #e67e22;">💡 알기 쉬운 용어</span>
                <h3 style="margin:10px 0; font-size:20px; color: #d35400;">${t.term}</h3>
                <p style="font-weight: 700; color: #2c3e50; margin-bottom: 12px; font-size: 15px;">${t.definition}</p>
                <div class="insight-box" style="background: #fff; border-left: 4px solid #e67e22; font-size: 14px;">
                    <p style="color: #5d4037;"><b>💬 쉬운 설명:</b> ${t.easyExplainer}</p>
                    <p style="margin-top: 10px; color: #7f8c8d; font-style: italic;">예시: ${t.example}</p>
                </div>
            </article>`).join('');
        return;
    }

    // 뉴스 렌더링
    hero.style.display = 'block';
    const heroItem = data[0];
    hero.innerHTML = `<div class="hero-card"><div class="hero-content">
        <span class="hero-category">${heroItem.catName || "실시간 핫이슈"}</span>
        <h2 style="margin:10px 0; cursor:pointer;" onclick="window.open('${heroItem.url || '#'}')">${heroItem.title}</h2>
        <ul style="margin-bottom:15px; padding-left:20px;">${heroItem.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
        <div class="insight-box"><b>📢 AI 인사이트:</b> ${heroItem.insight}</div>
    </div></div>`;

    container.innerHTML = data.slice(1).map(n => `
        <article class="news-card">
            <span class="category-tag">실시간 속보</span>
            <h3 style="margin:10px 0; font-size:18px; cursor:pointer;" onclick="window.open('${n.url || '#'}')">${n.title}</h3>
            <ul style="margin-bottom:15px; padding-left:20px; color:#555; font-size:14px;">${n.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box" style="font-size:14px;"><b>📢 인사이트:</b><br>${n.insight}</div>
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
    if (el) el.textContent = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
}

window.showPolicy = function(type) {
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    const texts = { about: "실시간 경제 요약 서비스입니다.", privacy: "개인정보를 수집하지 않습니다.", terms: "투자 책임은 본인에게 있습니다." };
    body.innerHTML = `<h2>${type}</h2><p>${texts[type] || '준비 중입니다.'}</p>`;
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
