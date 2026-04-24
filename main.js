const GEMINI_API_KEY = "AIzaSyBFwQ_YAwlxHZWIXMiyqjAwtgH_kBW-m8I";
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";
const NEWS_JSON_URL = "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fheadlines%2Fsection%2Ftopic%2FBUSINESS%3Fhl%3Dko%26gl%3DKR%26ceid%3DKR%3Ako";
const CACHE_KEY = "tj_final_news_cache_v4";
const CACHE_TIME = 30 * 60 * 1000;

// 고퀄리티 카테고리별 백업 데이터 (6개)
const fallbackData = [
    { title: "엔비디아 주가 독주, AI 반도체 시장 점유율 90% 육박", category: "tech", catName: "테크/산업", summary: [{text:"AI 서버에 들어가는 핵심 칩을 엔비디아가 사실상 독점하고 있어요."}, {text:"전 세계 거대 IT 기업들이 모두 엔비디아의 고객입니다."}, {text:"단순한 유행을 넘어 실적이 증명하는 강력한 성장세예요."}], insight: "AI 시대의 '석유'를 파는 회사라고 보면 돼요. 엔비디아가 흔들리면 전체 기술주가 흔들릴 정도로 영향력이 커졌으니, IT 투자를 하신다면 이 회사의 실적 발표 날짜를 꼭 달력에 적어두세요!" },
    { title: "금리 인하 시점 안갯속, 미국 연준 의장의 선택은?", category: "macro", catName: "거시경제", summary: [{text:"물가가 생각보다 천천히 떨어지고 있어 금리 인하가 늦어지고 있어요."}, {text:"미국 중앙은행은 '확실한 증거'가 나올 때까지 기다리겠다는 입장입니다."}, {text:"고금리 상황이 길어지면서 기업들의 이자 부담도 커지고 있어요."}], insight: "이자율이 높다는 건 돈을 빌리는 값이 비싸다는 뜻이에요. 무리하게 빚을 내서 투자하기보다는 현금을 보유하며 금리가 실제로 내려가는 신호가 나올 때까지 관망하는 지혜가 필요한 시점입니다." },
    { title: "서울 아파트 거래량 회복, 실수요자 중심 매수세 유입", category: "realestate", catName: "부동산", summary: [{text:"급매물이 소진된 후 주요 단지에서 신고가 거래가 나오고 있어요."}, {text:"전셋값이 오르자 '차라리 사자'는 심리가 강해지고 있습니다."}, {text:"정부의 대출 지원책을 활용한 젊은 층의 구매가 많아요."}], insight: "부동산 시장의 온기가 강남에서 주변 지역으로 퍼지고 있어요. 하지만 금리가 여전히 높기 때문에 모든 지역이 다 오르기는 힘들어요. 내가 사고 싶은 아파트의 '전세가율'이 오르고 있는지 먼저 확인해보는 게 가장 중요합니다." },
    { title: "K-배터리 3사, 북미 시장 공략 가속화... 합작 공장 속속 가동", category: "stocks", catName: "증시/투자", summary: [{text:"LG엔솔, 삼성SDI, SK온이 미국에 거대 공장들을 짓고 있어요."}, {text:"전기차 시장이 잠시 주춤하지만 장기 성장은 확실해 보입니다."}, {text:"원재료인 리튬 가격이 안정되면서 이익도 늘어날 전망이에요."}], insight: "전기차 산업은 지금 '캐즘(일시적 정체)' 구간을 지나고 있어요. 주가가 지루할 수 있지만, 기술력이 있는 한국 배터리 기업들의 미래 가치는 여전히 높으니 긴 호흡으로 멀리 보고 투자하는 것이 좋습니다." },
    { title: "반도체 수출 6개월 연속 흑자, 대한민국 경제 견인차", category: "tech", catName: "테크/산업", summary: [{text:"메모리 반도체 가격이 오르면서 수출 효자 노릇을 톡톡히 하고 있어요."}, {text:"자동차와 선박 수출도 역대급 성적을 내는 중입니다."}, {text:"나라에 달러가 많이 들어오면서 환율 안정에도 도움을 줘요."}], insight: "수출이 잘 된다는 건 우리나라 기업들의 체력이 좋아지고 있다는 뜻이에요. 특히 반도체는 모든 IT 기기에 들어가니, 반도체 수출 숫자가 올라간다면 우리나라 주식 시장 전체 분위기도 좋아질 가능성이 매우 큽니다." },
    { title: "신생아 특례대출 인기 폭발, 내 집 마련의 새로운 창구", category: "realestate", catName: "부동산", summary: [{text:"아이를 낳은 가구에 아주 낮은 금리로 돈을 빌려주는 정책이에요."}, {text:"출시 이후 수조 원의 대출이 신청될 만큼 반응이 뜨겁습니다."}, {text:"9억 원 이하 아파트 거래가 이 대출 덕분에 활발해졌어요."}], insight: "정부 정책을 잘 활용하는 것이 재테크의 기본이에요! 조건에 해당한다면 시중 은행보다 훨씬 싼 이자로 집을 마련할 수 있는 절호의 기회이니, 국토교통부 홈페이지에서 상세 조건을 꼼꼼히 체크해보세요." }
];

const termData = [
    { id: 1, term: '금리 (Interest Rate)', definition: '돈을 빌린 대가로 내는 이자의 비율', easyExplainer: '쉽게 말해 "돈을 빌려 쓰는 가격"이에요. 금리가 낮아지면 이자가 싸지니까 사람들이 집도 사고 쇼핑도 더 많이 해서 경제가 북적북적해진답니다.', example: '금리가 내려가면 우리 집 대출 이자가 줄어들어 가계 살림에 보탬이 돼요.' },
    { id: 2, term: '인플레이션 (Inflation)', definition: '물가가 오르고 돈의 가치가 떨어지는 현상', easyExplainer: '작년엔 1,000원에 사던 사과가 올해는 2,000원이 되는 상황이에요. 내 지갑 속 돈의 힘이 약해지는 거라 경제에 주의가 필요한 상태입니다.', example: '짜장면 가격이 옛날보다 훨씬 비싸진 것도 인플레이션 때문이에요.' },
    { id: 3, term: '환율 (Exchange Rate)', definition: '우리나라 돈과 다른 나라 돈을 바꾸는 비율', easyExplainer: '1달러를 사기 위해 우리 돈 얼마를 줘야 하는지를 결정해요. 환율이 오르면(강달러) 외국에서 물건을 사올 때 더 많은 돈을 써야 해서 물가가 오를 수 있어요.', example: '미국 직구를 할 때 환율이 오르면 물건값이 비싸지게 돼요.' }
];

async function fetchAndAnalyze() {
    try {
        const res = await fetch(NEWS_JSON_URL);
        const data = await res.json();
        if (data.status !== 'ok') throw new Error();
        
        const headlines = data.items.slice(0, 6).map(i => i.title.split(" - ")[0]);
        const titlesStr = headlines.map((h, i) => `${i+1}. ${h}`).join("\n");
        
        const prompt = `Economy News Titles:\n${titlesStr}\n\nTask: Summarize each for kids in 3 lines, provide a detailed practical insight, and assign one category from [macro, stocks, realestate, tech]. 
        Reply ONLY with JSON array: [{"summary": [{"text":"line1"}, {"text":"line2"}, {"text":"line3"}], "insight": "detailed text", "category": "category_id"}]`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiData = await aiRes.json();
        const match = aiData.candidates[0].content.parts[0].text.match(/\[[\s\S]*\]/);
        
        if (match) {
            const results = JSON.parse(match[0]);
            return headlines.map((h, i) => ({
                id: i, title: h, url: data.items[i].link,
                category: results[i].category,
                catName: results[i].category === 'macro' ? '거시경제' : results[i].category === 'stocks' ? '증시/투자' : results[i].category === 'realestate' ? '부동산' : '테크/산업',
                summary: results[i].summary, insight: results[i].insight
            }));
        }
    } catch (e) { console.error("Using fallback"); }
    return fallbackData.map((d, i) => ({...d, id: i}));
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

    if (container) container.innerHTML = "<div style='grid-column:1/-1;text-align:center;padding:50px;'><h3>실시간 경제 이슈를 카테고리별로 분석 중입니다...</h3></div>";

    const finalData = await fetchAndAnalyze();
    window.currentNewsData = finalData;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: finalData, timestamp: Date.now() }));
    renderNews(finalData);
}

function renderNews(data, filter = 'all') {
    const container = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (!container || !hero) return;

    if (filter === 'terms') {
        hero.style.display = 'none';
        container.innerHTML = termData.map(t => `
            <article class="news-card" style="border-top: 5px solid #e67e22; background: #fffaf0;">
                <span class="category-tag" style="color: #e67e22;">💡 경제 용어 사전</span>
                <h3 style="margin:10px 0; font-size:20px;">${t.term}</h3>
                <p style="font-weight:700; margin-bottom:10px;">${t.definition}</p>
                <div class="insight-box" style="background:#fff; border-left-color:#e67e22;">
                    <p><b>💬 쉬운 설명:</b> ${t.easyExplainer}</p>
                    <p style="margin-top:10px; font-style:italic; color:#7f8c8d;">예: ${t.example}</p>
                </div>
            </article>`).join('');
        return;
    }

    const filtered = filter === 'all' ? data : data.filter(n => n.category === filter);
    
    if (filtered.length === 0) {
        hero.style.display = 'none';
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px;">해당 카테고리에 최신 뉴스가 없습니다. '전체'를 확인해주세요!</p>`;
        return;
    }

    // Hero Section (전체보기일 때만 첫 기사 크게 표시)
    if (filter === 'all') {
        const heroItem = filtered[0];
        hero.style.display = 'block';
        hero.innerHTML = `<div class="hero-card"><div class="hero-content">
            <span class="hero-category">${heroItem.catName}</span>
            <h2 style="margin:10px 0; cursor:pointer;" onclick="window.open('${heroItem.url || '#'}')">${heroItem.title}</h2>
            <ul style="margin-bottom:15px; padding-left:20px;">${heroItem.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box"><b>📢 AI 전문가 인사이트:</b><br>${heroItem.insight}</div>
        </div></div>`;
        
        container.innerHTML = filtered.slice(1).map(n => renderCard(n)).join('');
    } else {
        hero.style.display = 'none';
        container.innerHTML = filtered.map(n => renderCard(n)).join('');
    }
}

function renderCard(n) {
    return `
        <article class="news-card">
            <span class="category-tag">${n.catName}</span>
            <h3 style="margin:10px 0; font-size:18px; cursor:pointer;" onclick="window.open('${n.url || '#'}')">${n.title}</h3>
            <ul style="margin-bottom:15px; padding-left:20px; color:#555; font-size:14px;">${n.summary.map(s => `<li>${s.text}</li>`).join('')}</ul>
            <div class="insight-box" style="font-size:14px;"><b>📢 AI 인사이트:</b><br>${n.insight}</div>
        </article>`;
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
    const texts = { about: "최신 경제 뉴스를 AI가 분석하여 전달합니다.", privacy: "개인정보를 수집하지 않습니다.", terms: "투자 책임은 사용자 본인에게 있습니다." };
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
