// 1. 地域・県のデータ構造
const regionData = {
  "北海道": { "北海道": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "東北": { "青森県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "岩手県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "宮城県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "秋田県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "山形県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "福島県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "関東": { "東京都": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "神奈川県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "千葉県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "茨城県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "埼玉県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "群馬県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "栃木県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "中部": { "新潟県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "長野県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "山梨県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "石川県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "富山県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "福井県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "愛知県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "静岡県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "岐阜県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "三重県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "関西": { "大阪府": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "兵庫県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "滋賀県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "京都府": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "和歌山県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "奈良県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "中国": { "広島県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "岡山県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "鳥取県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "島根県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "山口県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "四国": { "愛媛県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "香川県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "徳島県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "高知県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] },
  "九州": { "福岡県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "佐賀県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "長崎県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "大分県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "熊本県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "宮崎県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "鹿児島県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"], "沖縄県": ["☆☆☆☆☆","☆☆☆☆", "☆☆☆","☆☆","☆","★★★★★","★★★★","★★★","★★","★"] }
};

// 2. ハンバーガーメニューの開閉
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menuButton');
  sidebar.classList.toggle('open');
  menuButton.classList.toggle('open');
}

// 3. スケジュール描画機能（朝5時切り替え対応）
function renderScheduleTo(headerRow, bodyRow, scheduleData = {}) {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const now = new Date();

  // 【追加】朝5時前なら、カレンダーの起点を1日前（営業日基準）にする
  if (now.getHours() < 5) {
    now.setDate(now.getDate() - 1);
  }

  headerRow.innerHTML = '';
  bodyRow.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date(now); // nowをベースに計算
    d.setDate(now.getDate() + i);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const dateKey = `${month}/${date}`;

    const th = document.createElement('th');
    if (i === 0) th.className = 'today'; 
    th.innerHTML = `${month}/${date}<span>${dayNames[d.getDay()]}</span>`;
    headerRow.appendChild(th);

    const td = document.createElement('td');
    const dayData = scheduleData[dateKey] || { time: "-", shop: null };
    const timeValue = dayData.time || "-"; 

    if (timeValue !== "-" && timeValue.includes('～')) {
      const parts = timeValue.split('～');
      td.innerHTML = `<i>${parts[0]}</i>～<i>${parts[1]}</i>`;
    } else {
      td.innerText = timeValue;
    }
    
    bodyRow.appendChild(td);
  }
}

// 4. ドロップダウン（クリック制御）
function initDropdowns() {
  document.addEventListener('click', (e) => {
    const isButton = e.target.classList.contains('btn-main');
    const allMenus = document.querySelectorAll('.dropdown-content');

    if (isButton) {
      const targetMenu = e.target.nextElementSibling;
      allMenus.forEach(menu => {
        if (menu !== targetMenu) menu.classList.remove('show');
      });
      targetMenu.classList.toggle('show');
    } else {
      if (!e.target.closest('.dropdown-content')) {
        allMenus.forEach(menu => menu.classList.remove('show'));
      }
    }
  });
}

// 5. メニュー生成と初期化
window.addEventListener('DOMContentLoaded', () => {
  initDropdowns();

  const listContainer = document.getElementById('region-list');
  if (listContainer) {
    listContainer.innerHTML = ""; 

    for (let region in regionData) {
        const rLi = document.createElement('li');
        const rLabel = document.createElement('strong');
        rLabel.innerHTML = `▶ ${region}`;
        
        const pUl = document.createElement('ul');
        pUl.className = 'nested';

        rLabel.onclick = (e) => {
            e.stopPropagation();
            pUl.classList.toggle('show');
        };

        for (let pref in regionData[region]) {
            const pLi = document.createElement('li');
            const pLabel = document.createElement('span');
            pLabel.className = 'pref-label';
            pLabel.innerHTML = `▷ ${pref}`;
            
            const sUl = document.createElement('ul');
            sUl.className = 'nested';

            pLabel.onclick = (e) => {
                e.stopPropagation();
                sUl.classList.toggle('show');
            };

            regionData[region][pref].forEach(starMark => {
                const sLi = document.createElement('li');
                sLi.className = 'shop-item show';
                const linkUrl = `/${pref}_${starMark}`;
                sLi.innerHTML = `<a href="${linkUrl}">${starMark}</a>`;
                sUl.appendChild(sLi);
            });

            pLi.appendChild(pLabel);
            pLi.appendChild(sUl);
            pUl.appendChild(pLi);
        }
        rLi.appendChild(rLabel);
        rLi.appendChild(pUl);
        listContainer.appendChild(rLi);
    }
  }
});