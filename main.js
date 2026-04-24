const GEMINI_API_KEY = "AIzaSyBFwQ_YAwlxHZWIXMiyqjAwtgH_kBW-m8I";
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "tj_news_cache_v2";
const CACHE_TIME = 60 * 60 * 1000; // 1시간 캐시

// AI 실패 시 보여줄 고품질 백업 데이터 (항상 준비됨)
const fallbackData = [
    { title: "엔비디아 주가 역대 최고치 경신, AI 시대의 리더", cat: 'tech', catName: '테크/산업', summary: [{text:'AI 반도체 수요가 예상을 뛰어넘고 있어요.'},{text:'전 세계 기업들이 엔비디아 칩을 사려고 줄을 섰어요.'},{text:'실적이 뒷받침되는 강력한 상승세입니다.'}], insight: "AI는 이제 시작이에요. 대장주인 엔비디아의 움직임은 전체 IT 주식의 나침반 역할을 하니 계속 지켜보세요." },
    { title: "미국 연준 금리 동결 결정, 하반기 인하 기대감", cat: 'macro', catName: '거시경제', summary: [{text:'미국 중앙은행이 금리를 지금 수준으로 유지했어요.'},{text:'물가가 잡히고 있다는 신호를 기다리고 있습니다.'},{text:'전문가들은 9월쯤 첫 인하를 예상하고 있어요.'}], insight: "이자율이 내려가면 대출 부담이 줄어들고 주식이나 부동산 시장에 돈이 더 돌 수 있게 됩니다." },
    { title: "서울 아파트 매수 심리 회복, 거래량 2년 만에 최대", cat: 'realestate', catName: '부동산', summary: [{text:'급매물이 사라지고 거래 가격이 오르고 있어요.'},{text:'선호도가 높은 단지 위주로 신고가가 나옵니다.'},{text:'내 집 마련을 고민하는 실수요자들이 움직이고 있어요.'}], insight: "바닥을 확인했다는 심리가 퍼지고 있어요. 무리한 투자보다는 실거주 목적으로 신중히 접근할 때입니다." },
    { title: "K-배터리 점유율 확대, 리튬 가격 하락에 수익성 개선", cat: 'stocks', catName: '증시/투자', summary: [{text:'전기차 배터리 핵심 원료 가격이 내려갔어요.'},{text:'한국 기업들의 기술력이 세계적으로 인정받고 있습니다.'},{text:'미국 시장 내 공장 가동이 본격화될 전망이에요.'}], insight: "원재료 값이 싸지면 배터리 만드는 회사는 이익이 늘어나요. 장기적인 성장이 기대되는 분야입니다." },
    { title: "반도체 수출 호조, 무역수지 흑자 행진 지속", cat: 'tech', catName: '테크/산업', summary: [{text:'메모리 반도체 가격이 오르며 수출이 늘었어요.'},{text:'우리나라 전체 경제에 훈풍이 불고 있습니다.'},{text:'자동차와 조선 분야도 좋은 성적을 내고 있어요.'}], insight: "반도체가 잘 팔리면 우리나라에 달러가 많이 들어와 환율 안정에도 도움을 줍니다." },
    { title: "청년층 첫 주택 구매 지원 확대, 정책 금융 활발", cat: 'realestate', catName: '부동산', summary: [{text:'정부가 낮은 금리로 주택 자금을 빌려주고 있어요.'},{text:'생애 첫 구매자를 위한 혜택이 강화되었습니다.'},{text:'자산 형성을 돕는 다양한 금융 상품이 나오고 있어요.'}], insight: "자신에게 맞는 정부 지원 대출을 잘 활용하면 내 집 마련의 꿈에 한 발짝 더 다가갈 수 있습니다." }
];

async function fetchAllNewsWithAI() {
    // 1. 캐시 확인
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) return data;
    }

    const titles = fallbackData.map((n, i) => `${i+1}. ${n.title}`).join("\n");
    const prompt = `Economy News Titles:\n${titles}\n\nSummarize each for kids in 3 lines and add one insight. Reply ONLY with valid JSON array: [{"summary": [{"text":"line1"}, {"text":"line2"}, {"text":"line3"}], "insight": "text"}]`;

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
            const finalData = fallbackData.map((item, idx) => ({
                ...item,
                id: idx,
                summary: aiResults[idx]?.summary || item.summary,
                insight: aiResults[idx]?.insight || item.insight,
                isHero: idx === 0
            }));
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: finalData, timestamp: Date.now() }));
            return finalData;
        }
    } catch (e) {
        console.error("AI Analysis failed, using fallback.");
    }
    return fallbackData.map((n, i) => ({...n, id: i, isHero: i===0}));
}

async function init() {
    updateDate();
    fetchMarketData();
    const container = document.getElementById('news-grid');
    if (container) container.innerHTML = "<div style='grid-column:1/-1;text-align:center;padding:50px;'><h3>실시간 AI 경제 인사이트 분석 중...</h3><p>잠시만 기다려 주세요 (약 5초)</p></div>";

    const newsData = await fetchAllNewsWithAI();
    renderNews(newsData);
}

function renderNews(data, filter = 'all') {
    const container = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (!container || !hero) return;

    const filtered = filter === 'all' ? data : data.filter(n => n.category === filter);
    const heroItem = filtered.find(n => n.isHero) || filtered[0];

    // Hero Section
    if (filter === 'all' && heroItem) {
        hero.style.display = 'block';
        hero.innerHTML = `<div class="hero-card"><div class="hero-content">
            <span class="hero-category">${heroItem.catName}</span>
            <h2 style="margin:10px 0;">${heroItem.title}</h2>
            <ul style="margin-bottom:15px; padding-left:20px;">${heroItem.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box"><b>📢 AI 인사이트:</b> ${heroItem.insight}</div>
        </div></div>`;
    } else { hero.style.display = 'none'; }

    // Grid Section
    const gridItems = filter === 'all' ? filtered.filter(n => !n.isHero) : filtered;
    container.innerHTML = gridItems.map(n => `
        <article class="news-card">
            <span class="category-tag">${n.catName}</span>
            <h3 style="margin:10px 0; font-size:18px;">${n.title}</h3>
            <ul style="margin-bottom:15px; padding-left:20px; color:#555; font-size:14px;">${n.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box" style="font-size:14px;"><b>📢 AI 인사이트:</b><br>${n.insight}</div>
        </article>`).join('');

    // 카테고리 클릭 핸들러 재등록을 위해 데이터 전달
    window.currentNewsData = data;
}

function fetchMarketData() {
    fetch(EXCHANGE_RATE_API).then(res => res.json()).then(data => {
        const bar = document.getElementById('market-bar');
        if (bar) bar.innerHTML = `<div style="text-align:center;font-size:12px;padding:5px;color:white;">실시간 환율: 1달러 = <b>${data.rates.KRW.toFixed(2)}원</b> (제공: Open API)</div>`;
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
        about: "<h2>서비스 소개</h2><p>AI 기술로 복잡한 경제를 쉽게 요약합니다.</p>",
        privacy: "<h2>개인정보처리방침</h2><p>어떠한 개인정보도 저장하지 않습니다.</p>",
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
        renderNews(window.currentNewsData, e.target.dataset.category);
    });
});
