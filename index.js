// --- 1. Node v16 互換パッチ & モジュール読み込み ---
const { ReadableStream } = require('node:stream/web');
const { Blob } = require('buffer');
if (!global.ReadableStream) global.ReadableStream = ReadableStream;
if (!global.Blob) global.Blob = Blob;

const path = require('path');
const PORT = 8000;
const express = require("express");
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// --- 簡易キャッシュ用変数 ---
let scheduleCache = {}; 
const CACHE_TIMEOUT = 15 * 60 * 1000; // 15分間保持

// --- 2. 営業日・日付キー取得関数（朝5時切り替え） ---
function getBusinessDateKey() {
    const now = new Date();
    const hour = now.getHours();
    // 朝5時より前なら、日付を1日戻す（深夜営業対応：サイト上の前日枠を見に行く）
    if (hour < 5) {
        now.setDate(now.getDate() - 1);
    }
    return `${now.getMonth() + 1}/${now.getDate()}`;
}

function calculateAge(birthdayStr) {
  if (!birthdayStr) return null;
  const birthDate = new Date(birthdayStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// --- 3. キャスト個別のデータ定義 ---
const cast = {
  // ---AAAAA-----
  asami: {
    name: "あさみ", 
    age: 26,
    shop: "深海魚",
    area: "新宿・歌舞伎町：ソープ／激安",
    img: "https://img2.cityheaven.net/img/girls/tt/sinkaigyo/grpb0060594144_0000000000pc.jpg?cache02=1758080105&imgopt=y/150x200",
    url: "https://www.cityheaven.net/tokyo/A1304/A130401/sinkaigyo/girlid-60594144/?mypage_flg=1",
    prices: { special: "0円", init: "0円", nom: "0円", p50: "19000円", p70: "27000円", p100: "37000円"},
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/tokyo/A1304/A130401/sinkaigyo/girlid-60594144/?mypage_flg=1" }],

      sns: [{ name: "必須アサミ酸", url: "https://x.com/asamin23788686" }],

      movie: [{ name: "", url: "#" }]
    }
  },
  // ---BBBBB-----
  // ---CCCCC-----
  // ---DDDDD-----
  // ---EEEEE-----
  // ---FFFFF-----
  // ---GGGGG-----
  // ---HHHHH-----
  // ---IIIII-----
  // ---JJJJJ-----
  // ---KKKKK-----
  // ---LLLLL-----
  // ---MMMMM-----
  meari: {
    name: "MEARI", 
    age: 20,
    shop: "GINGIRA☆TOKYO",
    area: "新宿・歌舞伎町：デリヘル／ギャル",
    img: "https://img2.cityheaven.net/img/girls/tt/gingira/grpb0049689399_0000000000pc.jpg?cache02=1766746146&imgopt=y/150x200",
    url: "https://www.cityheaven.net/tokyo/A1304/A130401/gingira/girlid-49689399/?lo=1",
    prices: { special: "0円", init: "2000円", nom: "3000円", p60: "22000円", p75: "26000円", p90: "30000円"},
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/tokyo/A1304/A130401/gingira/girlid-49689399/?lo=1" }],

      sns: [{ name: "X", url: "#" }],

      movie: [{ name: "代官山メロンプラス", url: "https://cityheaven-tv.knip.jp/channels/d_melonplus/channel_posts/633" }]
    }
  },
  // ---NNNNN-----
  // ---OOOOO-----
  // ---PPPPP-----
  // ---QQQQQ-----
  // ---RRRRR-----
  rumina: {
    name: "瀬那ルミナ", 
    actressName: "（AV女優：瀬那ルミナ）", 
    birthday: "2002-05-09", 
    shop: "黒ギャル専門池袋ギャルデリ",
    area: "池袋西口・北口：デリヘル／ギャル",
    img: "https://img2.cityheaven.net/img/girls/tt/galdeli-h/grpb0044144081_0000000000pc.jpg?cache02=1765130504&imgopt=y/150x200",
    url: "https://www.cityheaven.net/tokyo/A1305/A130505/galdeli-h/girlid-44144081/",
    prices: { special: "0円", init: "1100円", nom: "2200円", p60: "17600円", p75: "22000円", p90: "26400円",},
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/tokyo/A1305/A130505/galdeli-h/girlid-44144081/?lo=1" }, { name: "アブゾック", url: "https://avzoku.com/senarumina/" }],
      sns: [{ name: "X (Rumina Sena)", url: "https://x.com/senarumina" }, { name: "X (Sub)", url: "https://x.com/senaruminasub" }],
      movie: [{ name: "FANZA", url: "https://video.dmm.co.jp/av/list/?actress=1079245" }, { name: "風俗DX", url: "https://fuzokudx.com/kanto/shop/gyaru/girllist/600734/movie/" }]
    }
  },

  
  // ---SSSSS-----
 sumeragi_yuzu_tokyo: {
    name: "皇ゆず",
    actressName: "（AV女優：皇ゆず）", 
    birthday: "1996-01-16", 
    shop: "風神会館",
    area: "新宿・歌舞伎町：デリヘル／スタンダード",
    img: "https://img2.cityheaven.net/img/girls/tt/shinjuku-deri/grpb0039073257_0000000000pc.jpg?cache02=1768279367&imgopt=y/150x200",
    url: "https://www.cityheaven.net/tokyo/A1304/A130401/shinjuku-deri/girlid-39073257/?lo=1",
    prices: { special: "0円", init: "0円", nom: "3000円", p60: "33000円", p75: "40000円", p90: "45000円"},
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/tokyo/A1304/A130401/shinjuku-deri/girlid-39073257/?lo=1"}, { name: "アブゾック", url: "https://avzoku.com/sumeragi-yuzu/"}],

      sns: [{ name: "皇すめらぎゆず🐳超潮吹き🐳抱けるAV女優❤️🦋東京No.1🗼", url: "https://x.com/sumeragiyuzu1"},{ name: "皇ゆず🗼東京No.1💓風神会館❤️明日香ゆずな🦋", url: "https://x.com/asukayuzuna1"},{ name: "まんまん", url: "https://x.com/yuzuman0116"}],

      movie: [{ name: "FANZA", url: "https://video.dmm.co.jp/av/list/?key=%E7%9A%87%E3%82%86%E3%81%9A"}, { name: "風俗DX", url: "https://fuzokudx.com/kanto/shop/tokyo-idol-academy/girllist/722741/movie/"}]
    }
  },


  sumeragi_yuzu_tokyo_2: {
    name: "皇ゆずaka風俗界の生きる伝説",
    actressName: "（AV女優：皇ゆず）", 
    birthday: "1996-01-16", 
    shop: "TOKYO IDOL ACADEMY",
    area: "新宿・歌舞伎町：デリヘル／学園系",
    img: "https://img2.cityheaven.net/img/girls/tt/tia/grpb0057225504_0000000000pc.jpg?cache02=1768990782&imgopt=y/150x200",
    url: "https://www.cityheaven.net/tokyo/A1304/A130401/tia/girlid-57225504/?lo=1",
    prices: { 
        special: "0円", init: "0円", nom: "3000円", 
        p100: "45000円", p130: "52000円", p180: "85000円"
    },
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/tokyo/A1304/A130401/tia/girlid-57225504/?lo=1"}, { name: "アブゾック", url: "https://avzoku.com/sumeragi-yuzu/"}],

      sns: [{ name: "皇すめらぎゆず🐳超潮吹き🐳抱けるAV女優❤️🦋東京No.1🗼", url: "https://x.com/sumeragiyuzu1"},{ name: "皇ゆず🗼東京No.1💓風神会館❤️明日香ゆずな🦋", url: "https://x.com/asukayuzuna1"},{ name: "まんまん", url: "https://x.com/yuzuman0116"}],

      movie: [{ name: "FANZA", url: "https://video.dmm.co.jp/av/list/?key=%E7%9A%87%E3%82%86%E3%81%9A"}, { name: "風俗DX", url: "https://fuzokudx.com/kanto/shop/tokyo-idol-academy/girllist/722741/movie/"}]
    }
  },


  sumeragi_yuzu_tokyo_3: {
    name: "皇ゆずfrom風神会館",
    actressName: "（AV女優：皇ゆず）", 
    birthday: "1996-01-16", 
    shop: "ミセス虎の穴",
    area: "新宿・歌舞伎町：デリヘル／人妻",
    img: "https://img2.cityheaven.net/img/girls/tt/tora-hitoduma/grpb0056391037_0000000000pc.jpg?cache02=1764935476&imgopt=y/150x200",
    url: "https://www.cityheaven.net/tokyo/A1303/A130301/tora-hitoduma/girlid-56391037/?lo=1",
    prices: { 
        special: "0円", init: "2000円", nom: "3000円", p75: "39000円", p90: "44000円", p105: "49000円"
    },
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/tokyo/A1303/A130301/tora-hitoduma/girlid-56391037/?lo=1"}, { name: "アブゾック", url: "https://avzoku.com/sumeragi-yuzu/"}],

      sns: [{ name: "皇すめらぎゆず🐳超潮吹き🐳抱けるAV女優❤️🦋東京No.1🗼", url: "https://x.com/sumeragiyuzu1"},{ name: "皇ゆず🗼東京No.1💓風神会館❤️明日香ゆずな🦋", url: "https://x.com/asukayuzuna1"},{ name: "まんまん", url: "https://x.com/yuzuman0116"}],

      movie: [{ name: "FANZA", url: "https://video.dmm.co.jp/av/list/?key=%E7%9A%87%E3%82%86%E3%81%9A"}, { name: "風俗DX", url: "https://fuzokudx.com/kanto/shop/tokyo-idol-academy/girllist/722741/movie/"}]
    }
  },

  sumeragi_yuzu_tokyo_4: {
    name: "皇ゆず",
    actressName: "（AV女優：皇ゆず）", 
    birthday: "1996-01-16", 
    shop: "CLUB虎の穴　難波店",
    area: "大阪・日本橋：デリヘル／高級",
    img: "https://img2.cityheaven.net/img/girls/k/clubtoranoana_nanba/grpb0046423705_0000000000pc.jpg?cache02=1769209897&imgopt=y/150x200",
    url: "https://www.cityheaven.net/osaka/A2702/A270202/clubtoranoana_nanba/girlid-46423705/?lo=1",
    prices: { 
        special: "0円", init: "0円", nom: "1000円", p120: "60000円"},
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/osaka/A2702/A270202/clubtoranoana_nanba/girlid-46423705/?lo=1"}, { name: "アブゾック", url: "https://avzoku.com/sumeragi-yuzu/"}],

      sns: [{ name: "皇すめらぎゆず🐳超潮吹き🐳抱けるAV女優❤️🦋東京No.1🗼", url: "https://x.com/sumeragiyuzu1"},{ name: "皇ゆず🗼東京No.1💓風神会館❤️明日香ゆずな🦋", url: "https://x.com/asukayuzuna1"},{ name: "まんまん", url: "https://x.com/yuzuman0116"}],

      movie: [{ name: "FANZA", url: "https://video.dmm.co.jp/av/list/?key=%E7%9A%87%E3%82%86%E3%81%9A"}, { name: "風俗DX", url: "https://fuzokudx.com/kanto/shop/tokyo-idol-academy/girllist/722741/movie/"}]
    }
  },

  sumeragi_yuzu_tokyo_5: {
    name: "皇ゆず",
    actressName: "（AV女優：皇ゆず）", 
    birthday: "1996-01-16", 
    shop: "CLUB虎の穴　福岡店",
    area: "福岡・博多駅周辺：デリヘル／高級",
    img: "https://img2.cityheaven.net/img/girls/k/clubtoranoana_nanba/grpb0046423705_0000000000pc.jpg?cache02=1769209897&imgopt=y/150x200",
    url: "https://www.cityheaven.net/fukuoka/A4001/A400101/tora_fukuoka/girlid-48994274/?lo=1",
    prices: { 
        special: "0円", init: "0円", nom: "1000円", p120: "59000円"},
    links: {
      site: [{ name: "シティヘブン", url: "https://www.cityheaven.net/fukuoka/A4001/A400101/tora_fukuoka/girlid-48994274/?lo=1"}, { name: "アブゾック", url: "https://avzoku.com/sumeragi-yuzu/"}],

      sns: [{ name: "皇すめらぎゆず🐳超潮吹き🐳抱けるAV女優❤️🦋東京No.1🗼", url: "https://x.com/sumeragiyuzu1"},{ name: "皇ゆず🗼東京No.1💓風神会館❤️明日香ゆずな🦋", url: "https://x.com/asukayuzuna1"},{ name: "まんまん", url: "https://x.com/yuzuman0116"}],

      movie: [{ name: "FANZA", url: "https://video.dmm.co.jp/av/list/?key=%E7%9A%87%E3%82%86%E3%81%9A"}, { name: "風俗DX", url: "https://fuzokudx.com/kanto/shop/tokyo-idol-academy/girllist/722741/movie/"}]
    }
  },
    // ---TTTTT-----
    // ---UUUUU-----
    // ---VVVVV-----
    // ---WWWWW-----
    // ---XXXXX-----
    // ---YYYYY-----
    // ---ZZZZZ-----
};

// --- 4. 固定地域の割り当て ---
const pageData = {
  "東京都_☆☆☆☆☆": [cast.asami, cast.meari, cast.rumina],
  "東京都_★★★★★": [cast.sumeragi_yuzu_tokyo, cast.sumeragi_yuzu_tokyo_2, cast.sumeragi_yuzu_tokyo_3],
  "大阪府_★★★★★": [cast.sumeragi_yuzu_tokyo_4],
  "福岡県_★★★★★": [cast.sumeragi_yuzu_tokyo_5]
};

// --- 5. スケジュール取得ロジック（キャッシュ対応） ---
async function getScheduleCached(url) {
    const now = Date.now();
    // 15分以内の同じURLへのリクエストがあればキャッシュを返す
    if (scheduleCache[url] && (now - scheduleCache[url].time < CACHE_TIMEOUT)) {
        return scheduleCache[url].data;
    }
    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
        const $ = cheerio.load(data);
        const map = {};
        $('#girl_sukkin li dl').each((i, el) => {
            const dt = $(el).find('dt').text().trim();
            const dd = $(el).find('dd');
            const dateMatch = dt.match(/(\d{1,2}\/\d{1,2})/);
            if (dateMatch) {
                const dateKey = dateMatch[1];
                let rawText = dd.text().trim().replace(/\s+/g, '');
                if (dd.hasClass('holiday2') || !rawText || rawText === "-") {
                    map[dateKey] = { time: "-", shop: null };
                } else {
                    const shopMatch = rawText.match(/\((.+)\)/);
                    const shopName = shopMatch ? shopMatch[1] : null;
                    const timeValue = rawText.replace(/\(.+\)/, '').replace('-', '～');
                    map[dateKey] = { time: timeValue, shop: shopName };
                }
            }
        });
        scheduleCache[url] = { time: now, data: map };
        return map;
    } catch (e) { return {}; }
}

// --- 6. メインサーバー処理 ---
app.get("/:pageId?", async (req, res) => {
    const pageId = req.params.pageId;
    const dateKey = getBusinessDateKey(); // 深夜帯対応の日付
    const rankOrder = ["☆☆☆☆☆","★★★★★","☆☆☆☆","★★★★", "☆☆☆","★★★","☆☆","★★","☆","★"];

    if (!pageId || pageId === "today") {
        const title = `✨ 本日の出勤者 (${dateKey} 営業分) ✨`;
        const allCasts = Object.values(cast);
        const allSchedules = await Promise.all(allCasts.map(g => getScheduleCached(g.url)));
        
        const castToRank = {};
        Object.entries(pageData).forEach(([pName, members]) => {
            const foundRank = rankOrder.find(r => pName.includes(r));
            if (foundRank) members.forEach(m => { castToRank[m.url] = foundRank; });
        });

        // 「営業日」に基いて出勤者をフィルタリング
        let presentGirls = allCasts.map((g, i) => ({
            data: g,
            rank: castToRank[g.url] || "★",
            todayInfo: allSchedules[i][dateKey] || { time: "-", shop: null },
            fullSchedule: allSchedules[i]
        })).filter(item => item.todayInfo.time !== "-");

        presentGirls.sort((a, b) => {
            const rA = rankOrder.indexOf(a.rank);
            const rB = rankOrder.indexOf(b.rank);
            if (rA !== rB) return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
            const timeA = a.todayInfo.time.split('～')[0].replace(':', '').padStart(4, '0');
            const timeB = b.todayInfo.time.split('～')[0].replace(':', '').padStart(4, '0');
            return parseInt(timeA) - parseInt(timeB);
        });

        let itemsHtml = `<h2 class="page-title">${title}</h2>`;
        let currentRank = "";
        presentGirls.forEach(item => {
            if (currentRank !== item.rank) {
                if (currentRank !== "") itemsHtml += `</ul>`;
                currentRank = item.rank;
                itemsHtml += `<div class="rank-divider">${currentRank}</div><ul class="item-list">`;
            }
            itemsHtml += generateCastHtml(item.data, item.fullSchedule, dateKey);
        });
        itemsHtml += '</ul>';
        res.send(renderFullPage(title, itemsHtml));
    } else {
        const title = pageId;
        const girls = pageData[pageId] || [];
        const results = await Promise.all(girls.map(g => getScheduleCached(g.url)));
        let itemsHtml = `<h2 class="page-title">${title}</h2><ul class="item-list">`;
        girls.forEach((g, i) => { itemsHtml += generateCastHtml(g, results[i], dateKey); });
        itemsHtml += '</ul>';
        res.send(renderFullPage(title, itemsHtml));
    }

    function generateCastHtml(g, schedule, dateKey) {
        const todayData = schedule[dateKey] || { time: "-", shop: null };
        const displayAge = g.birthday ? calculateAge(g.birthday) : (g.age || "");
        const actressHtml = g.actressName ? `<div class="actress-name">${g.actressName}</div>` : "";
        const shopDisplay = todayData.shop ? `<dd class="sn" style="color:#ff4500; font-weight:bold;">本日：${todayData.shop}</dd>` : `<dd class="sn">${g.shop}</dd>`;
        
        const prices = g.prices;
        const base = [];
        if (prices.special) base.push(`<th>特別</th><td>${prices.special}</td>`);
        if (prices.init) base.push(`<th>入会</th><td>${prices.init}</td>`);
        if (prices.nom) base.push(`<th>指名</th><td>${prices.nom}</td>`);

        const timeP = Object.keys(prices).filter(k => k.startsWith('p')).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1)))
                    .map(k => `<th>${k.slice(1)}分</th><td>${prices[k]}</td>`);

        const priceHtml = `<table class="price-table"><tr>${base.join('')}</tr><tr>${timeP.slice(0, 4).join('')}</tr>${timeP.length > 4 ? `<tr>${timeP.slice(4).join('')}</tr>` : ''}</table>`;
        const genLinks = (arr) => arr.map(l => `<a href="${l.url}" target="_blank">${l.name}</a>`).join('');

        return `<li class="item">
            <figure class="thumbnail"><img src="${g.img}" alt="画像"></figure>
            <dl>
                <dt class="gn"><a href="${g.url}" target="_blank">${g.name}<i class="age">${displayAge}</i></a>${actressHtml}</dt>
                ${shopDisplay}<dd class="ag">${g.area}</dd>
            </dl>
            <div class="link-buttons">
                <div class="dropdown"><button class="btn-main btn-site">サイト ▾</button><div class="dropdown-content">${genLinks(g.links.site)}</div></div>
                <div class="dropdown"><button class="btn-main btn-sns">SNS ▾</button><div class="dropdown-content">${genLinks(g.links.sns)}</div></div>
                <div class="dropdown"><button class="btn-main btn-movie">動画 ▾</button><div class="dropdown-content">${genLinks(g.links.movie)}</div></div>
            </div>
            <div class="price-section">${priceHtml}</div>
            <div class="schedule show"><table><tr class="day schedule-header"></tr><tr class="time schedule-body"></tr></table></div>
            <script>schedules.push(${JSON.stringify(schedule)});</script>
        </li>`;
    }

    function renderFullPage(title, content) {
        return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><link rel="stylesheet" href="/style.css"><script>const schedules = [];</script></head><body><main id="content">${content}</main><div class="menu-button" id="menuButton" onclick="toggleMenu()"><span></span><span></span><span></span></div><nav id="sidebar"><div class="sidebar-home"><a href="/" style="display:block; padding:15px; background:#333; color:gold; text-decoration:none; font-weight:bold; text-align:center; border-radius:5px; margin-bottom:10px;">🏠 本日出勤の一覧</a></div><ul id="region-list"></ul></nav><script src="/js/script.js"></script><script>window.addEventListener('load', () => {const hs = document.querySelectorAll('.schedule-header');const bs = document.querySelectorAll('.schedule-body');schedules.forEach((d, i) => {if (hs[i] && bs[i] && typeof renderScheduleTo === 'function') renderScheduleTo(hs[i], bs[i], d);});});</script></body></html>`;
    }
});

app.listen(PORT, () => console.log(`Running: http://localhost:${PORT}`));