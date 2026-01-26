// --- 1. Node v16 互換パッチ & モジュール読み込み ---
const { ReadableStream } = require('node:stream/web');
const { Blob } = require('buffer');
if (!global.ReadableStream) global.ReadableStream = ReadableStream;
if (!global.Blob) global.Blob = Blob;

const path = require('path');
const fs = require('fs'); 
const express = require("express");
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 8000; 

app.use(express.static(path.join(__dirname, 'public')));

// --- 2. データの読み込み ---
let cast = {};
try {
    const castsPath = path.join(__dirname, 'casts.json');
    if (fs.existsSync(castsPath)) {
        const rawData = fs.readFileSync(castsPath, 'utf8');
        cast = JSON.parse(rawData);
        console.log("✅ casts.json の読み込みに成功しました");
    } else {
        console.error("⚠️ casts.json が見つかりません。");
    }
} catch (err) {
    console.error("❌ casts.json の読み込み/解析に失敗:", err.message);
}

// --- 3. 固定地域の割り当て ---
const getPageData = () => {
  return {
    "北海道_☆☆☆": [cast?.kaho, cast?.kaho_2].filter(Boolean),
    "東京都_☆☆☆☆☆": [cast?.asami, cast?.furansowa, cast?.hinano_yuna, cast?.koyuki, cast?.minami_shiori, cast?.meari, cast?.rumina, cast?.thuru, cast?.yuutuki_kokona].filter(Boolean), 
    "東京都_☆☆☆☆": [cast?.thukino_aina].filter(Boolean),
    "東京都_☆☆☆": [cast?.juri, cast?.momoka_hotaru].filter(Boolean),
    "東京都_★★★★★": [cast?.hanamo, cast?.sayuu_nanaha, cast?.sayuu_nanaha, cast?.sumeragi_yuzu_tokyo, cast?.sumeragi_yuzu_tokyo_2, cast?.sumeragi_yuzu_tokyo_3].filter(Boolean),
    "神奈川県_☆☆☆☆☆": [cast?.minami_shiori_2].filter(Boolean),
    "新潟県_☆☆☆☆☆": [cast?.minami_shiori_3, cast?.minami_shiori_4].filter(Boolean),
    "新潟県_☆☆☆☆": [cast?.nagisa].filter(Boolean),
    "長野県_☆☆☆☆☆": [cast?.minami_shiori_4].filter(Boolean),
    "愛知県_☆☆☆☆☆": [cast?.minami_shiori_5, cast?.riri].filter(Boolean),
    "静岡県_☆☆☆☆": [cast?.mithiru].filter(Boolean),
    "岐阜県_☆☆☆☆": [cast?.pan].filter(Boolean),
    "大阪府_★★★★★": [cast?.sumeragi_yuzu_tokyo_4].filter(Boolean),
    "京都府_☆☆☆": [cast?.naho].filter(Boolean),
    "岡山県_☆☆☆☆☆": [cast?.minami_shiori_6].filter(Boolean),
    "福岡県_☆☆☆☆": [cast?.ramu_fukuoka].filter(Boolean),
    "福岡県_☆☆☆": [cast?.yumi].filter(Boolean),
    "福岡県_★★★★★": [cast?.sumeragi_yuzu_tokyo_5].filter(Boolean)
  };
};

// --- 4. 簡易キャッシュ用変数 ---
let scheduleCache = {}; 
const CACHE_TIMEOUT = 15 * 60 * 1000; 

// --- 5. 営業日・日付キー取得関数 (日本時間 & 朝5時切り替え) ---
function getBusinessDateKey() {
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
  if (now.getHours() < 5) {
      now.setDate(now.getDate() - 1);
  }
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

function calculateAge(birthdayStr) {
  if (!birthdayStr) return null;
  try {
    const birthDate = new Date(birthdayStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  } catch(e) { return null; }
}

// --- 6. スケジュール取得ロジック (3サイト対応 & 日付キー統一版) ---
async function getScheduleCached(url) {
  if (!url || url === "#") return {};
  const now = Date.now();
  if (scheduleCache[url] && (now - scheduleCache[url].time < CACHE_TIMEOUT)) {
      return scheduleCache[url].data;
  }
  try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
      const $ = cheerio.load(data);
      const map = {};

      if (url.includes('xenispa.com')) {
          // --- ゼニスパ構造 ---
          $('.schedule-item').each((i, el) => {
              const dateRaw = $(el).find('.schedule-date').text().trim();
              const timeRaw = $(el).find('.schedule-time').text().trim();
              const dateMatch = dateRaw.match(/(\d{1,2})\/(\d{1,2})/);
              if (dateMatch) {
                  const dateKey = `${parseInt(dateMatch[1])}/${parseInt(dateMatch[2])}`;
                  map[dateKey] = (timeRaw.includes('休み') || !/\d/.test(timeRaw)) ? { time: "-", shop: "ゼニスパ" } : { time: timeRaw.replace('〜', '～'), shop: "ゼニスパ" };
              }
          });
      } else if (url.includes('kami-sugamo.com')) {
          // --- カミスガ構造 ---
          $('table.schedule tr').each((i, el) => {
              const dateRaw = $(el).find('th').text().trim();
              const timeRaw = $(el).find('td').text().trim();
              const dateMatch = dateRaw.match(/(\d{1,2})\/(\d{1,2})/);
              if (dateMatch) {
                  const dateKey = `${parseInt(dateMatch[1])}/${parseInt(dateMatch[2])}`;
                  map[dateKey] = (timeRaw.includes('休み') || !/\d/.test(timeRaw)) ? { time: "-", shop: "カミスガ" } : { time: timeRaw.replace('〜', '～'), shop: "カミスガ" };
              }
          });
      } else {
          // --- シティヘブン構造 ---
          $('#girl_sukkin li').each((i, el) => {
              const dt = $(el).find('dt').text().trim();
              const dd = $(el).find('dd');
              const dateMatch = dt.match(/(\d{1,2})\/(\d{1,2})/);
              if (dateMatch) {
                  const dateKey = `${parseInt(dateMatch[1])}/${parseInt(dateMatch[2])}`;
                  let rawText = dd.text().trim().replace(/\s+/g, '');
                  const hasNumber = /\d/.test(rawText);
                  const isHoliday = $(el).hasClass('holiday2') || dd.hasClass('holiday2') || !rawText || rawText === "-" || rawText.includes("休") || !hasNumber;
                  if (isHoliday) {
                      map[dateKey] = { time: "-", shop: null };
                  } else {
                      const shopMatch = rawText.match(/\((.+)\)/);
                      const shopName = shopMatch ? shopMatch[1] : null;
                      const timeValue = rawText.replace(/\(.+\)/, '').replace('-', '～');
                      map[dateKey] = { time: timeValue, shop: shopName };
                  }
              }
          });
      }
      scheduleCache[url] = { time: now, data: map };
      return map;
  } catch (e) { return {}; }
}

// --- 7. メインサーバー処理 ---
app.get("/:pageId?", async (req, res) => {
    const pageId = req.params.pageId;
    const dateKey = getBusinessDateKey(); 
    const rankOrder = ["☆☆☆☆☆","★★★★★","☆☆☆☆","★★★★", "☆☆☆","★★★","☆☆","★★","☆","★"];
    const pageData = getPageData(); 

    if (!pageId || pageId === "today") {
        const title = `✨ 本日の出勤者 (${dateKey} 営業分) ✨`;
        const allCasts = Object.values(cast).filter(g => g && g.url);
        const allSchedules = await Promise.all(allCasts.map(g => getScheduleCached(g.url)));
        
        const castToRank = {};
        Object.entries(pageData).forEach(([pName, members]) => {
            const foundRank = rankOrder.find(r => pName.includes(r));
            if (foundRank) members.forEach(m => { if(m && m.url) castToRank[m.url] = foundRank; });
        });

        let presentGirls = allCasts.map((g, i) => ({
            data: g,
            rank: castToRank[g.url] || "★",
            todayInfo: allSchedules[i][dateKey] || { time: "-", shop: null },
            fullSchedule: allSchedules[i]
        })).filter(item => {
            const t = item.todayInfo.time;
            return t && t !== "-" && /\d/.test(t);
        });

        presentGirls.sort((a, b) => {
            const rA = rankOrder.indexOf(a.rank);
            const rB = rankOrder.indexOf(b.rank);
            if (rA !== rB) return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
            const timeA = (a.todayInfo.time.split('～')[0] || "99:99").replace(':', '').padStart(4, '0');
            const timeB = (b.todayInfo.time.split('～')[0] || "99:99").replace(':', '').padStart(4, '0');
            return parseInt(timeA) - parseInt(timeB);
        });

        let itemsHtml = `<h2 class="page-title">${title}</h2>`;
        let currentRank = "";
        if (presentGirls.length === 0) {
            itemsHtml += `<p style="text-align:center; padding:50px; color:#888;">本日の出勤予定者はまだ登録されていないか、全員休日です。</p>`;
        } else {
            presentGirls.forEach(item => {
                if (currentRank !== item.rank) {
                    if (currentRank !== "") itemsHtml += `</ul>`;
                    currentRank = item.rank;
                    itemsHtml += `<div class="rank-divider">${currentRank}</div><ul class="item-list">`;
                }
                itemsHtml += generateCastHtml(item.data, item.fullSchedule, dateKey);
            });
            itemsHtml += '</ul>';
        }
        res.send(renderFullPage(title, itemsHtml));
    } else {
        const title = pageId;
        const girls = pageData[pageId] || [];
        const results = await Promise.all(girls.map(g => (g && g.url) ? getScheduleCached(g.url) : {}));
        let itemsHtml = `<h2 class="page-title">${title}</h2><ul class="item-list">`;
        girls.forEach((g, i) => { if(g) itemsHtml += generateCastHtml(g, results[i], dateKey); });
        itemsHtml += '</ul>';
        res.send(renderFullPage(title, itemsHtml));
    }

    function generateCastHtml(g, schedule, dateKey) {
        if (!g) return "";
        const todayData = schedule[dateKey] || { time: "-", shop: null };
        const displayAge = g.birthday ? calculateAge(g.birthday) : (g.age || "");
        const actressHtml = g.actressName ? `<div class="actress-name">${g.actressName}</div>` : "";
        const shopDisplay = todayData.shop ? `<dd class="sn" style="color:#ff4500; font-weight:bold;">本日：${todayData.shop}</dd>` : `<dd class="sn">${g.shop || ""}</dd>`;
        
        const prices = g.prices || {};
        const base = [];
        if (prices.special) base.push(`<th>特別</th><td>${prices.special}</td>`);
        if (prices.init) base.push(`<th>入会</th><td>${prices.init}</td>`);
        if (prices.nom) base.push(`<th>指名</th><td>${prices.nom}</td>`);

        const timeP = Object.keys(prices).filter(k => k.startsWith('p')).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1)))
                    .map(k => `<th>${k.slice(1)}分</th><td>${prices[k]}</td>`);

        const priceHtml = `<table class="price-table"><tr>${base.join('')}</tr><tr>${timeP.slice(0, 4).join('')}</tr>${timeP.length > 4 ? `<tr>${timeP.slice(4).join('')}</tr>` : ''}</table>`;
        const genLinks = (arr) => arr ? arr.map(l => `<a href="${l.url}" target="_blank">${l.name}</a>`).join('') : '';

        return `<li class="item">
            <figure class="thumbnail"><img src="${g.img || ''}" alt="画像"></figure>
            <dl>
                <dt class="gn"><a href="${g.url || '#'}" target="_blank">${g.name || '名前なし'}<i class="age">${displayAge}</i></a>${actressHtml}</dt>
                ${shopDisplay}<dd class="ag">${g.area || ""}</dd>
            </dl>
            <div class="link-buttons">
                <div class="dropdown"><button class="btn-main btn-site">サイト ▾</button><div class="dropdown-content">${genLinks(g.links?.site)}</div></div>
                <div class="dropdown"><button class="btn-main btn-sns">SNS ▾</button><div class="dropdown-content">${genLinks(g.links?.sns)}</div></div>
                <div class="dropdown"><button class="btn-main btn-movie">動画 ▾</button><div class="dropdown-content">${genLinks(g.links?.movie)}</div></div>
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

app.listen(PORT, () => console.log(`Running on port ${PORT}`));