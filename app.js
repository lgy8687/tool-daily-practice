(() => {
  const STORAGE_KEY = 'rikey.practice.v1';
  const HEART = [
    { title: '照见五蕴皆空', text: '观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。', note: '开篇从观照自己的身心经验开始。“五蕴皆空”不是说什么都不存在，而是提醒我们：感受、念头与身份都依条件而生，并非固定不变。' },
    { title: '色空与诸法', text: '舍利子，色不异空，空不异色；色即是空，空即是色。受想行识，亦复如是。\n舍利子，是诸法空相，不生不灭，不垢不净，不增不减。\n是故空中无色，无受想行识，无眼耳鼻舌身意，无色声香味触法，无眼界，乃至无意识界；无无明，亦无无明尽，乃至无老死，亦无老死尽；无苦集灭道。', note: '“空”常被解释为无固定自性、依缘而成。经文层层列举身心与认知经验，帮助读者松开对它们永恒不变的执着。' },
    { title: '无所得与无挂碍', text: '无智亦无得，以无所得故。\n菩提萨埵，依般若波罗蜜多故，心无罣碍；无罣碍故，无有恐怖，远离颠倒梦想，究竟涅槃。\n三世诸佛，依般若波罗蜜多故，得阿耨多罗三藐三菩提。', note: '不把智慧和修行成果当作可以占有的东西，心便少了挂碍。这里的“不取”并非放弃行动，而是减少被得失牢牢牵制。' },
    { title: '般若波罗蜜多咒', text: '故知般若波罗蜜多，是大神咒，是大明咒，是无上咒，是无等等咒，能除一切苦，真实不虚。\n故说般若波罗蜜多咒，即说咒曰：\n揭谛揭谛，波罗揭谛，波罗僧揭谛，菩提萨婆诃。', note: '结尾以咒语收束全经。“揭谛”常被意译为去、到彼岸；不同版本在断句与个别用字上可能略有差异。' }
  ];
  const HEART_TRANSLATION = '观自在菩萨在深入修行般若智慧时，照见构成身心的五蕴都没有固定不变的自性，由此超越一切苦难。\n舍利子，物质现象与空性并不分离；物质现象就是空，空也就是物质现象。感受、知觉、意志活动和意识，同样如此。\n舍利子，一切现象都具有空性，没有固定的生灭、污净、增减。\n因此，从空性的角度看，没有独立固定的物质、感受、知觉、意志活动和意识；没有独立固定的眼、耳、鼻、舌、身、意，以及色、声、香、味、触、法；从眼的认知领域直到意识的认知领域，都是如此。没有固定的无明，也没有固定的无明消尽；直到没有固定的衰老和死亡，也没有固定的衰老和死亡消尽；没有固定不变的苦、集、灭、道，也没有可执取的智慧和所得。\n正因为无所得，菩萨依靠般若智慧，心中没有障碍；没有障碍，就没有恐惧，远离颠倒的妄想，究竟达到涅槃。过去、现在、未来的诸佛，也依靠般若智慧，获得无上的正等正觉。\n所以知道，般若智慧是大神咒、大明咒、无上咒、无等等咒，能够解除一切苦难，真实不虚。因此说出般若波罗蜜多咒：揭谛揭谛，波罗揭谛，波罗僧揭谛，菩提萨婆诃。';
  let state = loadState();
  let route = 'today';
  let readingBook = 'dao';
  let reciteBook = null;
  let reciteChapter = 1;
  const fontKey = () => reciteBook === 'heart' ? 'rikey.fontSize.heart' : `rikey.fontSize.dao.${reciteChapter}`;
  const currentFontSize = () => Number(localStorage.getItem(fontKey())) || 18;
  let layoutEditing = false;
  let chapterNumber = 1;
  let statsBook = 'heart';
  let statsMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let statsSelectedDate = localDate();
  let toastTimer;

  function blankDay() { return { daoCount: 0, xinCount: 0, movieViews: 0, readings: [], activities: [] }; }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.version === 1 && saved.days) {
        saved.settings = { movieTitle: '英语电影', movieTarget: 100, ...(saved.settings || {}) };
        return saved;
      }
    } catch (error) { console.warn('Could not load local practice data.', error); }
    return { version: 1, days: {}, settings: { movieTitle: '英语电影', movieTarget: 100 } };
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { showToast('保存失败，请检查浏览器存储空间'); }
  }
  function localDate(date = new Date()) {
    const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function day(date = localDate()) { state.days[date] ||= blankDay(); return state.days[date]; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function sum(key) { return Object.values(state.days).reduce((total, item) => total + (Number(item[key]) || 0), 0); }
  function todayLabel() { return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()); }
  let timerStart = Number(state.activeTimer?.startedAt) || null;
  let timerBook = ['heart','dao'].includes(state.activeTimer?.book) ? state.activeTimer.book : null;
  if (!timerBook) timerStart=null;
  function formatDuration(ms) {
    const seconds=Math.floor(Math.max(0,ms)/1000), h=Math.floor(seconds/3600), m=Math.floor(seconds%3600/60), sec=seconds%60;
    return h ? `${h}小时${String(m).padStart(2,'0')}分${String(sec).padStart(2,'0')}秒` : `${m}分${String(sec).padStart(2,'0')}秒`;
  }
  function startTimer() {
    if (!timerStart && route==='recite' && reciteBook) {
      timerStart=Date.now(); timerBook=reciteBook;
      state.activeTimer={book:timerBook,startedAt:timerStart}; saveState();
    }
  }
  function flushTimer(stop=false) {
    if (!timerStart || !timerBook) return;
    const now=Date.now(); let cursor=timerStart;
    while(cursor<now) {
      const date=new Date(cursor); const midnight=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1).getTime();
      const end=Math.min(now,midnight); const entry=day(localDate(date));
      if(!entry.readingMs) entry.readingMs={heart:0,dao:0};
      entry.readingMs[timerBook]=(Number(entry.readingMs[timerBook])||0)+(end-cursor); cursor=end;
    }
    if(stop) { timerStart=null; timerBook=null; delete state.activeTimer; }
    else { timerStart=now; state.activeTimer={book:timerBook,startedAt:now}; }
    saveState();
  }
  function todayReadingMs(book) {
    const saved=Number(day().readingMs?.[book])||0;
    if(timerStart && timerBook===book && localDate(new Date(timerStart))===localDate()) return saved + Math.max(0,Date.now()-timerStart);
    return saved;
  }
  function updateTimerDisplay() { const el=document.getElementById('reading-timer'); if(el&&reciteBook) el.textContent=`今日 ${formatDuration(todayReadingMs(reciteBook))}`; }
  document.addEventListener('visibilitychange',()=>{ if(timerStart) flushTimer(); updateTimerDisplay(); });
  window.addEventListener('pagehide',()=>flushTimer());
  window.addEventListener('pageshow',()=>{if(timerStart) flushTimer(); updateTimerDisplay();});
  setInterval(()=>{ if(timerStart && Date.now()-timerStart>=5000) flushTimer(); updateTimerDisplay(); },1000);
  function routeTo(name) {
    flushTimer(true);
    route = name;
    layoutEditing=false;
    reciteBook = null;
    document.querySelector('.app-shell').classList.remove('immersive');
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === name));
    history.replaceState(null, '', `#${name}`);
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showToast(message) {
    const node = document.getElementById('toast'); node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 1900);
  }
  function dayReadLabel(current) {
    if (!current.readings.length) return '还没有读书记录';
    const dao = current.readings.filter(value => value.startsWith('dao:')).length;
    const xin = current.readings.includes('heart');
    return [dao ? `《道德经》${dao}章` : '', xin ? '《心经》' : ''].filter(Boolean).join(' · ');
  }
  /* ===== v4 视觉系统：数据工具（见 DESIGN.md） ===== */
  function dayValue(date, book) {
    const item = state.days[date] || blankDay();
    const n = book === 'all'
      ? (Number(item.xinCount) || 0) + (Number(item.daoCount) || 0)
      : (Number(item[book === 'heart' ? 'xinCount' : 'daoCount']) || 0);
    const ms = book === 'all'
      ? (Number(item.readingMs?.heart) || 0) + (Number(item.readingMs?.dao) || 0)
      : (Number(item.readingMs?.[book]) || 0);
    return { n, ms };
  }
  function hasPractice(date, book) { const v = dayValue(date, book); return v.n > 0 || v.ms > 0; }
  function heatLevel(v) {
    if (!v.n && !v.ms) return 0;
    if (v.n >= 6 || v.ms >= 1800000) return 3;
    if (v.n >= 3) return 2;
    return 1;
  }
  function calcStreak(book) {
    const cursor = new Date(); cursor.setHours(12, 0, 0, 0);
    if (!hasPractice(localDate(cursor), book)) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (hasPractice(localDate(cursor), book) && count < 3660) { count++; cursor.setDate(cursor.getDate() - 1); }
    return count;
  }
  function calcBest(book) {
    const dates = Object.keys(state.days).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && hasPractice(date, book)).sort();
    let best = 0, run = 0, prev = null;
    dates.forEach(date => {
      run = prev && (new Date(date + 'T12:00:00') - new Date(prev + 'T12:00:00')) === 86400000 ? run + 1 : 1;
      if (run > best) best = run;
      prev = date;
    });
    return Math.max(best, calcStreak(book));
  }
  function formatDurationShort(ms) {
    const minutes = Math.floor(Math.max(0, ms) / 60000), h = Math.floor(minutes / 60), m = minutes % 60;
    return h ? `${h}时${String(m).padStart(2, '0')}分` : `${m}分`;
  }
  function trendBars(book, days) {
    const dates = lastDays(days), values = dates.map(date => dayValue(date, book).n);
    const max = Math.max(1, ...values), week = ['日', '一', '二', '三', '四', '五', '六'];
    const bars = values.map((value, i) => {
      const isToday = i === values.length - 1;
      return `<i class="trend-bar${isToday ? ' is-today' : ''}" style="height:${Math.max(10, Math.round(value / max * 42))}px" title="${dates[i]} · ${value} 遍"></i>`;
    }).join('');
    const labels = dates.map((date, i) => `<span class="${i === dates.length - 1 ? 'is-today' : ''}">${week[new Date(date + 'T12:00:00').getDay()]}</span>`).join('');
    return { bars, labels, total: values.reduce((a, b) => a + b, 0), avg: Math.round(values.reduce((a, b) => a + b, 0) / days) };
  }

  function renderToday() {
    const card=(name,book,key)=>`<article class="practice-card"><button class="practice-open" data-action="open-recitation" data-book="${book}"><h2>${name}</h2><div class="practice-numbers"><span><b>${day()[key]}</b>今日（遍）</span><span><b>${sum(key)}</b>累计（遍）</span><span><b>${Object.values(state.days).filter(d=>Number(d[key])>0).length}</b>天数</span></div><div class="practice-time">今日时长　${formatDuration(day().readingMs?.[book]||0)}</div></button></article>`;
    document.getElementById('view-today').innerHTML=`${card('般若波罗蜜多心经','heart','xinCount')}${card('道德经','dao','daoCount')}`;
  }
  function daoReader() {
    const chapter = window.DAO_DE_JING.chapters[chapterNumber - 1];
    const done = day().readings.includes(`dao:${chapterNumber}`);
    const chips = window.DAO_DE_JING.chapters.map(item => `<button class="chapter-chip ${item.number === chapterNumber ? 'active' : ''} ${day().readings.includes(`dao:${item.number}`) ? 'done' : ''}" data-action="chapter" data-number="${item.number}" aria-label="第${item.number}章 ${esc(item.title)}">${String(item.number).padStart(2, '0')}</button>`).join('');
    return `<details class="chapter-picker"><summary>选择章节　·　共八十一章</summary><div class="chapter-list" aria-label="选择章节">${chips}</div></details><article class="reading-panel"><div class="reading-meta">第 ${String(chapter.number).padStart(2, '0')} 章</div><h2 class="reading-title">${esc(chapter.title)}</h2><div class="classic-text${pinyinOn()?' with-pinyin':''}">${pinyinOn()?annotatePinyin(esc(chapter.text)):esc(chapter.text)}</div><details class="annotation-fold"><summary>查看本章注释</summary><p>${esc(chapter.note)}</p></details><div class="reading-actions"><button class="text-button" data-action="prev-chapter" ${chapterNumber === 1 ? 'disabled' : ''}>← 上一章</button><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="dao:${chapterNumber}">${done ? '今日已读 ✓' : '标记读过'}</button><button class="text-button" data-action="next-chapter" ${chapterNumber === 81 ? 'disabled' : ''}>下一章 →</button></div></article>`;
  }
  function heartReader() {
    const done=day().readings.includes('heart');
    return `<article class="reading-panel"><div class="reading-meta">唐 · 玄奘译</div><h2 class="reading-title">般若波罗蜜多心经</h2><div class="classic-text">${HEART.map(segment=>esc(segment.text)).join('\n')}</div><details class="annotation-fold"><summary>查看心经注释</summary><div class="annotation-list">${HEART.map(segment=>`<p><b>${esc(segment.title)}</b><br>${esc(segment.note)}</p>`).join('')}</div></details><div class="reading-actions"><span class="muted" style="align-self:center">维基文库 · 玄奘译本</span><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="heart">${done ? '今日已读 ✓' : '标记读过'}</button></div></article>`;
  }
  function renderRead() {
    document.getElementById('view-read').innerHTML = `<div class="page-intro"><h1 id="read-title">读经典</h1></div><div class="switcher"><button class="pill ${readingBook === 'dao' ? 'active' : ''}" data-action="book" data-book="dao">《道德经》</button><button class="pill ${readingBook === 'heart' ? 'active' : ''}" data-action="book" data-book="heart">《心经》</button></div>${readingBook === 'dao' ? `<div class="reader-tools"><button class="pinyin-toggle ${pinyinOn()?'on':''}" data-action="toggle-pinyin" aria-pressed="${pinyinOn()}">拼音标注 · ${pinyinOn()?'开':'关'}</button></div>` : ''}${readingBook === 'dao' ? daoReader() : heartReader()}<p class="source-note">《道德经》王弼本，简体转换；注释为白话导读。<br>《心经》玄奘译本。<br><a href="https://zh.wikisource.org/zh-hans/道德经_(王弼本)" target="_blank" rel="noreferrer">原文来源</a> · <a href="https://zh.wikisource.org/zh-hans/般若波罗蜜多心经_(玄奘)" target="_blank" rel="noreferrer">心经来源</a></p>`;
  }
  function layoutBaseKey() { return reciteBook === 'heart' ? 'heart' : `dao:${reciteChapter}`; }
  const PINYIN_KEY = 'rikey.pinyin.dao';
  const pinyinOn = () => (localStorage.getItem(PINYIN_KEY) ?? '1') !== '0';
  function annotatePinyin(html) {
    const data = window.DAO_PINYIN; if (!data) return html;
    const phrases = [...data.phrases].sort((a,b) => b[0].length - a[0].length).map(([w,p]) => [w, p.split(' ')]);
    const single = data.single;
    const box = document.createElement('div'); box.innerHTML = html;
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue;
      if (!text || !/[\u4e00-\u9fff]/.test(text)) continue;
      const frag = document.createDocumentFragment();
      let i = 0, changed = false;
      while (i < text.length) {
        let hit = null;
        for (const [w, pys] of phrases) { if (text.startsWith(w, i)) { hit = [w, pys]; break; } }
        if (!hit && single[text[i]]) hit = [text[i], [single[text[i]]]];
        if (!hit) { frag.appendChild(document.createTextNode(text[i++])); continue; }
        const [w, pys] = hit;
        for (let k = 0; k < w.length; k++) {
          const py = pys[k];
          if (py && py !== '-') {
            const ruby = document.createElement('ruby');
            ruby.appendChild(document.createTextNode(w[k]));
            const rt = document.createElement('rt'); rt.textContent = py;
            ruby.appendChild(rt); frag.appendChild(ruby);
          } else frag.appendChild(document.createTextNode(w[k]));
        }
        i += w.length; changed = true;
      }
      if (changed) node.parentNode.replaceChild(frag, node);
    }
    return box.innerHTML;
  }
  function defaultLayout(text) {
    const parts=(text || '').replace(/\n/g,'').match(/[^。！？；]*[。！？；]|[^。！？；]+$/g) || [];
    const paragraphs=[];
    for(let i=0;i<parts.length;i+=2) paragraphs.push(`<p>${esc(parts.slice(i,i+2).join(''))}</p>`);
    return paragraphs.join('');
  }
  function cleanLayout(html) {
    const container=document.createElement('div'); container.innerHTML=html;
    const allowed=new Set(['P','DIV','BR','B','STRONG','I','EM','U','SPAN']);
    function clean(node) {
      if(node.nodeType===Node.TEXT_NODE) return document.createTextNode(node.nodeValue);
      if(node.nodeType!==Node.ELEMENT_NODE) return document.createDocumentFragment();
      if(node.tagName==='RT') return document.createDocumentFragment();
      const children=document.createDocumentFragment(); for(const child of [...node.childNodes]) children.appendChild(clean(child));
      if(!allowed.has(node.tagName)) return children;
      const el=document.createElement(node.tagName.toLowerCase());
      const align=node.style.textAlign || node.getAttribute('align');
      if(['left','center','right','justify'].includes(align)) el.style.textAlign=align;
      const weight=node.style.fontWeight; if(weight==='bold' || Number(weight)>=600) el.style.fontWeight='bold';
      if(node.style.fontStyle==='italic') el.style.fontStyle='italic';
      if(node.style.textDecorationLine.includes('underline') || node.style.textDecoration.includes('underline')) el.style.textDecoration='underline';
      el.appendChild(children); return el;
    }
    const out=document.createElement('div'); for(const child of [...container.childNodes]) out.appendChild(clean(child)); return out.innerHTML;
  }
  function layoutHtml(suffix, fallback) {
    const key=`${layoutBaseKey()}:${suffix}`; const saved=state.layouts && state.layouts[key];
    const html = typeof saved==='string' ? cleanLayout(saved) : defaultLayout(fallback);
    return (suffix==='original' && reciteBook==='dao' && pinyinOn()) ? annotatePinyin(html) : html;
  }
  function layoutBlock(suffix, fallback, classes='') {
    const key=`${layoutBaseKey()}:${suffix}`;
    const extra=(suffix==='original' && reciteBook==='dao' && pinyinOn())?' with-pinyin':'';
    return `<div class="layout-content ${classes}${extra}" data-layout-key="${esc(key)}" contenteditable="false" spellcheck="false">${layoutHtml(suffix,fallback)}</div>`;
  }
  function setLayoutEditing(on) {
    layoutEditing=on;
    const screen=document.querySelector('.recitation-screen'); if(!screen) return;
    screen.classList.toggle('editing-layout',on);
    screen.querySelectorAll('[data-layout-key]').forEach(el=>el.contentEditable=on?'true':'false');
    const button=screen.querySelector('[data-action="edit-layout"]');
    if(button) { button.textContent=on?'完成':'✎'; button.setAttribute('aria-label',on?'完成排版':'编辑排版'); }
    if(!on) { document.activeElement?.blur(); showToast('排版已保存'); }
  }
  function reciteFooter(countKey) {
    if (!timerStart) return `<div class="bottom-counter waiting">
        <button class="start-tap" data-action="start-timer"><b>开始诵读</b><small>自动计时 · 轻点记一遍</small></button>
      </div>`;
    return `<div class="bottom-counter running">
        <div class="counter-head"><i class="live-dot"></i><span>诵读中</span><span class="counter-hint">轻点任意处记一遍</span><button class="undo-button" data-action="undo" data-key="${countKey}" aria-label="撤销一遍" title="撤销一遍">↶ 撤销</button></div>
        <button class="count-tap" data-action="count" data-key="${countKey}" aria-label="轻点记一遍">
          <span class="tap-ring"></span>
          <span class="tap-main"><b class="tap-number" id="recite-today-count">${day()[countKey]}</b><span class="tap-unit">遍</span></span>
          <span class="tap-total" id="recite-total-count">累计 ${sum(countKey)}</span>
          <span class="tap-pop">＋1</span>
        </button>
      </div>`;
  }
  function renderRecite() {
    const node=document.getElementById('view-recite');
    const shell=document.querySelector('.app-shell');
    if (!reciteBook) {
      shell.classList.remove('immersive');
      const choice = (book, name, seal, sub, key) => `<button class="recite-choice" data-action="open-recitation" data-book="${book}"><span class="choice-seal">${seal}</span><span class="choice-body"><b>${name}</b><small>${sub}</small></span><span class="choice-meta"><b>${sum(key)}</b><small>累计遍数</small></span><span class="choice-arrow">›</span></button>`;
      node.innerHTML=`<div class="page-intro"><h1 id="recite-title">选择背诵内容</h1></div><div class="recite-choices">${choice('dao','《道德经》','道','八十一章 · 王弼本','daoCount')}${choice('heart','《心经》','心','唐 · 玄奘译','xinCount')}</div><p class="choice-note">诵读时自动计时 · 点木鱼记一遍<br>记录只保存在这台设备</p>`;
      return;
    }
    shell.classList.add('immersive');
    const isHeart=reciteBook==='heart';
    const bookName=isHeart?'《心经》':'《道德经》';
    const countKey=isHeart?'xinCount':'daoCount';
    const todayCount=day()[countKey];
    const content=isHeart ? `<div class="classic-text recitation-text">${layoutBlock("original",HEART.map(segment=>segment.text).join("\n"))}</div><details class="annotation-fold"><summary>白话翻译</summary>${layoutBlock("translation",HEART_TRANSLATION,"translation-layout")}</details><details class="annotation-fold recitation-annotation"><summary>心经注释</summary><div class="annotation-list">${HEART.map(segment=>`<p><b>${esc(segment.title)}</b><br>${esc(segment.note)}</p>`).join('')}</div></details>` : (()=>{const c=window.DAO_DE_JING.chapters[reciteChapter-1];return `<div class="dao-swipe" id="dao-swipe"><button class="chapter-position chapter-select-trigger" data-action="open-chapters">第 ${reciteChapter} 章　⌄</button><div class="classic-text recitation-text">${layoutBlock("original",c.text)}</div><details class="annotation-fold dao-translation" ${(localStorage.getItem("rikey.daoTranslationOpen") ?? localStorage.getItem("rikey.daoNoteOpen"))==="1"?"open":""}><summary>白话翻译</summary>${layoutBlock("translation",c.translation,"translation-layout")}</details><details class="annotation-fold"><summary>本章导读</summary><p>${esc(c.note)}</p></details></div>`;})();
    node.innerHTML=`<div class="recitation-screen" style="--text-size:${currentFontSize()}px"><div class="recite-header"><div class="recite-title-row"><button class="back-button" data-action="back-recitation" aria-label="返回">‹</button><h1>${bookName}</h1></div><div class="recite-meta-row"><div class="reading-timer" id="reading-timer">今日 ${formatDuration(todayReadingMs(reciteBook))}</div><div class="font-controls">${isHeart?'':`<button class="pinyin-button ${pinyinOn()?'on':''}" data-action="toggle-pinyin" aria-pressed="${pinyinOn()}" aria-label="切换拼音标注" title="拼音标注">拼</button>`}<button data-action="font-smaller" aria-label="缩小字体">A−</button><button data-action="font-larger" aria-label="放大字体">A＋</button><button data-action="edit-layout" aria-label="编辑排版">✎</button></div></div></div><div class="layout-toolbar" role="toolbar" aria-label="排版工具"><button data-action="format" data-command="bold" aria-label="加粗"><b>B</b></button><button data-action="format" data-command="italic" aria-label="斜体"><i>I</i></button><button data-action="format" data-command="underline" aria-label="下划线"><u>U</u></button><button data-action="format" data-command="justifyLeft" aria-label="左对齐">☰</button><button data-action="format" data-command="justifyCenter" aria-label="居中">≡</button><button data-action="restore-layout" class="layout-restore">恢复默认</button></div>${content}${!isHeart ? `<dialog class="chapter-dialog" id="chapter-dialog" aria-label="选择章节"><div class="chapter-dialog-head"><h2>选择章节</h2><button data-action="close-chapters" aria-label="关闭">×</button></div><div class="chapter-grid">${window.DAO_DE_JING.chapters.map(ch=>`<button class="chapter-tile ${ch.number===reciteChapter?"selected":""}" data-action="choose-chapter" data-number="${ch.number}" aria-label="第${ch.number}章 ${esc(ch.title)}"><span class="chapter-page">${esc(ch.text.slice(0,75))}</span><span class="chapter-label">第 ${ch.number} 章</span></button>`).join("")}</div></dialog>` : ""}<div class="recite-footer">${reciteFooter(countKey)}</div></div>`;
  }
  let turningChapter = false;
  async function turnChapter(next) {
    if (turningChapter || next < 1 || next > 81 || next === reciteChapter) return;
    turningChapter = true;
    const direction = next > reciteChapter ? 1 : -1;
    const old = document.getElementById('dao-swipe');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (old && !reduced) await old.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*24}px)`}],{duration:130,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
    if (reciteBook !== 'dao' || route !== 'recite') { turningChapter=false; return; }
    layoutEditing=false; reciteChapter = next; renderRecite(); window.scrollTo(0,0);
    const current=document.getElementById('dao-swipe');
    if (current && !reduced) await current.animate([{opacity:0,transform:`translateX(${direction*24}px)`},{opacity:1,transform:'translateX(0)'}],{duration:200,easing:'ease-out'}).finished.catch(()=>{});
    turningChapter=false;
  }
  function updateReciteProgress(key) {
    const todayCount=document.getElementById('recite-today-count');
    const total=document.getElementById('recite-total-count');
    if(todayCount) { todayCount.textContent=String(day()[key]); todayCount.classList.remove('bump'); void todayCount.offsetWidth; todayCount.classList.add('bump'); }
    if(total) total.textContent=`累计 ${sum(key)}`;
  }
  function lastDays(n) {
    const items=[]; const now=new Date(); now.setHours(12,0,0,0);
    for (let i=n-1;i>=0;i--) { const date=new Date(now); date.setDate(now.getDate()-i); items.push(localDate(date)); }
    return items;
  }
  function renderStats(preserveInputs=false) {
    const book=statsBook;
    const year=statsMonth.getFullYear(), month=statsMonth.getMonth();
    const monthPrefix=`${year}-${String(month+1).padStart(2,'0')}`;
    const all=Object.entries(state.days).filter(([date])=>/^\d{4}-\d{2}-\d{2}$/.test(date));
    const thisMonth=all.filter(([date])=>date.startsWith(monthPrefix+'-'));
    const totals=entries=>entries.reduce((acc,[date])=>{const v=dayValue(date,book);acc.count+=v.n;acc.ms+=v.ms;if(v.n>0||v.ms>0)acc.days++;return acc;},{count:0,ms:0,days:0});
    const allStats=totals(all), monthStats=totals(thisMonth), todayStats=totals([[localDate(),state.days[localDate()]||blankDay()]]);
    const streak=calcStreak(book), best=calcBest(book);
    const selected=state.days[statsSelectedDate]||blankDay();
    const isCurrentMonth=year===new Date().getFullYear() && month===new Date().getMonth();
    const today=localDate();
    const metric=(label,obj,accent=false)=>`<div class="metric${accent?' is-today':''}"><span>${label}</span><b>${obj.count}<small>遍</small></b><em>${formatDurationShort(obj.ms)}</em></div>`;
    const trend=trendBars(book,7);

    /* 12 周 × 7 天热力格：以所选月份最后一周为锚，列优先填充 */
    const monthEnd=new Date(year,month+1,0,12);
    const endOffset=(monthEnd.getDay()+6)%7;
    const firstDay=new Date(monthEnd); firstDay.setDate(monthEnd.getDate()-endOffset-77);
    let heat='';
    for(let w=0;w<12;w++) for(let dow=0;dow<7;dow++) {
      const cursor=new Date(firstDay); cursor.setDate(firstDay.getDate()+w*7+dow);
      const date=localDate(cursor), v=dayValue(date,book), level=heatLevel(v), future=date>today;
      heat+=`<button class="heat-cell level-${level}${date===statsSelectedDate?' selected':''}${date===today?' is-today':''}" data-action="stats-day" data-date="${date}" aria-label="${date} · ${v.n} 遍 · ${formatDurationShort(v.ms)}" ${future?'disabled':''}></button>`;
    }

    const recordRow=(name,bookKey,countKey)=>`<div class="record-row"><span>${name}</span><label><input class="inline-count" type="number" min="0" max="100000" step="1" inputmode="numeric" required data-inline-record="count" data-book="${bookKey}" value="${Number(selected[countKey])||0}" aria-label="${name}次数"><small>遍</small></label><input class="inline-time" type="text" maxlength="12" pattern="[0-9]+:[0-5][0-9]:[0-5][0-9]" required data-inline-record="time" data-book="${bookKey}" value="${recordTime(selected.readingMs?.[bookKey]||0)}" aria-label="${name}时长，时分秒"></div>`;
    const reportHtml=`<header class="page-head"><span class="eyebrow">STATISTICS</span><h1 id="stats-title">修习统计</h1><p class="page-head-date">${year} 年 ${month+1} 月 · 累计 ${allStats.days} 天</p></header>
      <div class="segmented" role="group" aria-label="选择经典"><button data-action="stats-book" data-book="heart" class="${book==='heart'?'active':''}" aria-pressed="${book==='heart'}">心经</button><button data-action="stats-book" data-book="dao" class="${book==='dao'?'active':''}" aria-pressed="${book==='dao'}">道德经</button></div>
      <section class="streak-card">
        <div class="streak-top"><div class="streak-seal"><b>${streak}</b><span>连续日</span></div><div class="streak-copy"><h2>连续日课 ${streak} 天</h2><p>最长的坚持 · 历史 ${best} 天</p></div></div>
        <div class="metrics">${metric('今日',todayStats,true)}${metric(isCurrentMonth?'本月':'当月',monthStats)}${metric('累计',allStats)}</div>
      </section>
      <section class="ds-card">
        <div class="card-head"><h2>修习热力</h2><div class="month-switch"><button data-action="stats-prev-month" aria-label="上个月">‹</button><b>${year} 年 ${month+1} 月</b><button data-action="stats-next-month" aria-label="下个月" ${isCurrentMonth?'disabled':''}>›</button></div></div>
        <div class="heat-grid">${heat}</div>
        <div class="heat-legend"><span>少</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><span>多</span></div>
        <details class="record-editor"><summary><span>修改本日记录</span><span class="editor-meta">${statsSelectedDate} ›</span></summary><div class="record-fields">${recordRow('心经','heart','xinCount')}${recordRow('道德经','dao','daoCount')}</div></details>
      </section>
      <section class="ds-card trend-card">
        <div class="card-head"><h2>近 7 日</h2><span>共 ${trend.total} 遍</span></div>
        <div class="trend-bars">${trend.bars}</div><div class="trend-week">${trend.labels}</div>
      </section>`;
    const root=document.getElementById('view-stats');
    if (preserveInputs && root.querySelector('.record-editor')) {
      const fresh=document.createElement('div'); fresh.innerHTML=reportHtml;
      const oldCard=root.querySelector('.streak-card'), newCard=fresh.querySelector('.streak-card');
      if(oldCard&&newCard) oldCard.innerHTML=newCard.innerHTML;
      const oldCells=root.querySelectorAll('.heat-cell'), newCells=fresh.querySelectorAll('.heat-cell');
      oldCells.forEach((cell,i)=>{const next=newCells[i];if(next){cell.className=next.className;cell.setAttribute('aria-label',next.getAttribute('aria-label'));}});
      const oldTrend=root.querySelector('.trend-card'), newTrend=fresh.querySelector('.trend-card');
      if(oldTrend&&newTrend) oldTrend.innerHTML=newTrend.innerHTML;
      return;
    }
    root.innerHTML=reportHtml;
  }
  function render() {
    renderToday(); renderRead(); renderRecite(); renderStats();
  }

  function recordTime(ms) {
    const seconds=Math.floor((Number(ms)||0)/1000);
    return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }
  function updateInlineRecord(input,live) {
    const book=input.dataset.book, kind=input.dataset.inlineRecord, key=book==='heart'?'xinCount':'daoCount';
    const existing=state.days[statsSelectedDate] || blankDay();
    if(!input.checkValidity()) {
      if(!live) { input.value=kind==='count' ? String(Number(existing[key])||0) : recordTime(existing.readingMs?.[book]||0); showToast(kind==='count'?'请输入有效次数':'请按 时:分:秒 输入'); }
      return;
    }
    if(kind==='count') {
      const value=Number(input.value); if(!Number.isInteger(value) || value<0 || value>100000) { if(!live) input.value=String(Number(existing[key])||0); return; }
      if(value===(Number(existing[key])||0)) return;
      day(statsSelectedDate)[key]=value;
    } else {
      const current=Number(existing.readingMs?.[book])||0;
      if(input.value===recordTime(current)) return;
      const [h,m,s]=input.value.split(':').map(Number); const ms=(h*3600+m*60+s)*1000;
      if(!Number.isSafeInteger(ms)) {if(!live){input.value=recordTime(current);showToast('请输入有效时长');}return;}
      const entry=day(statsSelectedDate); entry.readingMs ||= {heart:0,dao:0}; entry.readingMs[book]=ms;
      if(!live) input.value=recordTime(ms);
    }
    saveState(); renderToday(); renderStats(true);
  }
  document.addEventListener('input',event=>{const input=event.target.closest('[data-inline-record]');if(input)updateInlineRecord(input,true);});
  document.addEventListener('change',event=>{const input=event.target.closest('[data-inline-record]');if(input)updateInlineRecord(input,false);});
  document.addEventListener('click', event => {
    const routeButton=event.target.closest('[data-route]');
    if (routeButton) { routeTo(routeButton.dataset.route); return; }
    const button=event.target.closest('[data-action]'); if (!button) return;
    const action=button.dataset.action;
    if (action === 'count' || action === 'undo') {
      const tap=button.closest('.count-tap');
      if (tap) { tap.classList.remove('is-tapped'); void tap.offsetWidth; tap.classList.add('is-tapped'); setTimeout(()=>tap.classList.remove('is-tapped'),700); }
    }
    if (action === 'toggle-pinyin') {
      localStorage.setItem(PINYIN_KEY, pinyinOn() ? '0' : '1');
      if (route==='recite' && reciteBook) renderRecite(); else renderRead();
      showToast(pinyinOn() ? '已开启易错字拼音标注' : '已关闭拼音标注');
      return;
    }
    if (action === 'stats-book') { statsBook=button.dataset.book; renderStats(); return; }
    if (action === 'stats-day') { statsSelectedDate=button.dataset.date; renderStats(); return; }
    if (action === 'stats-prev-month' || action === 'stats-next-month') {
      const delta=action==='stats-prev-month'?-1:1; statsMonth=new Date(statsMonth.getFullYear(),statsMonth.getMonth()+delta,1);
      const today=new Date(); statsSelectedDate=(statsMonth.getFullYear()===today.getFullYear()&&statsMonth.getMonth()===today.getMonth())?localDate():localDate(statsMonth); renderStats(); return;
    }
    if (action === 'open-recitation') { flushTimer(true); reciteBook=button.dataset.book; reciteChapter=1; route='recite'; document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-recite')); renderRecite(); window.scrollTo(0,0); }
    if (action === 'start-timer') { startTimer(); const key=reciteBook==='heart'?'xinCount':'daoCount'; document.querySelector('.recite-footer').innerHTML=reciteFooter(key); updateTimerDisplay(); return; }
    if (action === 'edit-layout') { setLayoutEditing(!layoutEditing); return; }
    if (action === 'format') { if(layoutEditing) document.execCommand(button.dataset.command, false, null); return; }
    if (action === 'restore-layout') { if(confirm('恢复本篇原文和译文的默认排版？')) { const base=layoutBaseKey(); if(state.layouts){delete state.layouts[base+':original'];delete state.layouts[base+':translation'];} saveState(); layoutEditing=false; renderRecite(); showToast('已恢复默认排版'); } return; }
    if (action === 'back-recitation') { routeTo('today'); }
    if (action === 'open-chapters') { const dialog=document.getElementById('chapter-dialog'); dialog.showModal(); const selected=dialog.querySelector('.chapter-tile.selected'); if(selected) selected.scrollIntoView({block:'nearest'}); }
    if (action === 'close-chapters') document.getElementById('chapter-dialog').close();
    if (action === 'choose-chapter') { const next=Number(button.dataset.number); document.getElementById('chapter-dialog').close(); if(next!==reciteChapter) turnChapter(next); }
    if (action === 'swipe-prev') turnChapter(reciteChapter-1);
    if (action === 'swipe-next') turnChapter(reciteChapter+1);
    if (action === 'font-smaller' || action === 'font-larger') { const size=Math.max(10,Math.min(28,currentFontSize()+(action==='font-larger'?1:-1))); localStorage.setItem(fontKey(),size); document.querySelector('.recitation-screen').style.setProperty('--text-size',size+'px'); }
    if (action === 'book') { readingBook=button.dataset.book; renderRead(); }
    if (action === 'chapter') { chapterNumber=Number(button.dataset.number); renderRead(); }
    if (action === 'prev-chapter' && chapterNumber>1) { chapterNumber--; renderRead(); }
    if (action === 'next-chapter' && chapterNumber<81) { chapterNumber++; renderRead(); }
    if (action === 'mark-read') {
      const key=button.dataset.key; const reads=day().readings; const index=reads.indexOf(key);
      if (index >= 0) { reads.splice(index,1); showToast('已取消今日阅读记录'); } else { reads.push(key); showToast('已记下今天读过'); }
      saveState(); render();
    }
    if (action === 'count') {
      const key=button.dataset.key; day()[key]++; saveState(); if (navigator.vibrate) navigator.vibrate(12);
      if (route==='recite' && reciteBook) updateReciteProgress(key); else render();
    }
    if (action === 'undo') { const item=day(); const key=button.dataset.key; if(item[key]>0){item[key]--;saveState();if(route==='recite'&&reciteBook)updateReciteProgress(key);else render();showToast('已撤销一次');} }
    if (action === 'movie') { day().movieViews++; saveState(); render(); showToast('已记录：电影看完一遍'); }
    if (action === 'add-activity') {
      const titleInput=document.getElementById('activity-title'); const minutesInput=document.getElementById('activity-minutes');
      const title=titleInput.value.trim(); if(!title){titleInput.focus();showToast('先写下完成了什么');return;}
      day().activities.unshift({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),title,minutes:Math.max(0,Number(minutesInput.value)||0),time:new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date())});
      saveState(); render(); showToast('已记下今天的工作');
    }
    if (action === 'delete-activity') { const id=button.dataset.id; day().activities=day().activities.filter(item=>item.id!==id); saveState(); render(); }
  });

  document.addEventListener('pointerdown',event=>{if(event.target.closest('.layout-toolbar [data-action="format"]')) event.preventDefault();});
  document.addEventListener('input',event=>{const el=event.target.closest('[data-layout-key]'); if(!el || !layoutEditing) return; state.layouts ||= {}; state.layouts[el.dataset.layoutKey]=cleanLayout(el.innerHTML); saveState();});
  document.addEventListener('paste',event=>{if(!layoutEditing || !event.target.closest('[data-layout-key]')) return; event.preventDefault(); document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));});
  document.addEventListener('toggle',event=>{if(event.target.matches('.dao-translation')) localStorage.setItem('rikey.daoTranslationOpen',event.target.open?'1':'0');},true);
  let touchStart=null;
  document.addEventListener('touchstart',e=>{if(!layoutEditing && e.target.closest('#dao-swipe')) touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  document.addEventListener('touchend',e=>{if(!touchStart||!e.target.closest('#dao-swipe'))return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3){const next=reciteChapter+(dx<0?1:-1);if(next>=1&&next<=81)turnChapter(next);}},{passive:true});
  document.getElementById('open-settings').addEventListener('click',()=>{
    document.getElementById('settings-dialog').showModal();
  });
  document.getElementById('export-data').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=`日课备份-${localDate()}.json`; link.click(); URL.revokeObjectURL(link.href); showToast('备份文件已导出');
  });
  document.getElementById('import-data').addEventListener('change',async event=>{
    const file=event.target.files?.[0]; if(!file)return;
    try { const incoming=JSON.parse(await file.text()); if(incoming.version!==1 || !incoming.days) throw new Error('invalid backup'); state={...incoming,settings:{movieTitle:'英语电影',movieTarget:100,...incoming.settings}}; saveState(); render(); showToast('备份已导入'); }
    catch(error) { showToast('文件格式不正确，未能导入'); }
    event.target.value='';
  });
  window.addEventListener('hashchange',()=>{const target=location.hash.slice(1);if(['today','daily','read','recite','stats','mine'].includes(target))routeTo(target);});
  const initial=location.hash.slice(1); if(['today','daily','read','recite','stats','mine'].includes(initial))route=initial;
  routeTo(route);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) { let refreshing=false; const hadController=!!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!refreshing){refreshing=true;location.reload();}}); navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}); }
})();
