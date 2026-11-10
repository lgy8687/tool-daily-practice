(() => {
  const STORAGE_KEY = 'rikey.practice.v1';
  const BOOKS = [
    { id: 'heart', name: '心经', cardTitle: '般若波罗蜜多心经', countKey: 'xinCount' },
    { id: 'dao', name: '道德经', cardTitle: '道德经', countKey: 'daoCount' },
    { id: 'cao', name: '曹操的诗', cardTitle: '曹操的诗', countKey: 'caoCount' }
  ];
  const SLICE_COLORS = ['#1F3329', '#2F5D50', '#3D6B58', '#5E8F78', '#7FAE92', '#466858', '#6E9A82', '#24483E', '#8FB5A0', '#345E4C'];
  const OTHER_COLOR = '#C5D5C9';
  const EMPTY_RING = '#C9D5CE';
  const fixtureName = (() => {
    try {
      const value = new URLSearchParams(location.search).get('fixture');
      return ['sample', 'books10', 'empty', 'gaps'].includes(value) ? value : '';
    } catch (error) { return ''; }
  })();
  const fixtureMode = fixtureName !== '';
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
  const fontKey = () => reciteBook === 'heart' && reciteChapter > 1 ? `rikey.fontSize.heart.${reciteChapter}` : reciteBook === 'heart' ? 'rikey.fontSize.heart' : isCustomBook(reciteBook) ? `rikey.fontSize.user.${reciteBook}.${reciteChapter}` : reciteBook === 'cao' ? `rikey.fontSize.cao.${reciteChapter}` : `rikey.fontSize.dao.${reciteChapter}`;
  const currentFontSize = () => Number(localStorage.getItem(fontKey())) || 18;
  let layoutEditing = false;
  let chapterNumber = 1;
  let statsBook = 'heart';
  let statsFocus = null;
  let statsOrigin = 'stats';
  let composeMode = null;
  let statsMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let statsSelectedDate = localDate();
  let toastTimer;

  function blankDay() { return { daoCount: 0, xinCount: 0, caoCount: 0, movieViews: 0, readings: [], activities: [] }; }
  function buildFixture(name) {
    const settings = { movieTitle: '英语电影', movieTarget: 100 };
    if (name === 'empty') return { version: 1, days: {}, settings };
    if (name === 'gaps') {
      return { version: 1, settings, days: {
        '2026-01-01': { daoCount: 2, xinCount: 1 },
        '2026-01-02': { readingMs: null, caoCount: 1 },
        '2026-01-03': { readingMs: { heart: '5000', dao: -20, cao: Number.NaN, '<img>': 999 } },
        '2026-01-04': { readingMs: { heart: 40000, dao: 0, cao: undefined } },
        'not-a-date': { readingMs: { heart: 999999 } },
        '2026-01-05': null
      } };
    }
    if (name === 'books10') {
      return { version: 1, settings, days: {
        '2026-03-01': { xinCount: 3, daoCount: 2, caoCount: 1, readingMs: {
          heart: 20 * 3600000, dao: 12 * 3600000, cao: 8 * 3600000,
          论语: 5 * 3600000, 诗经: 3 * 3600000, 楚辞: 90 * 60000,
          唐诗: 40 * 60000, 宋词: 8 * 60000, 古文: 45000, 小品: 8000
        } }
      } };
    }
    return { version: 1, settings, days: {
      '2026-11-01': { xinCount: 2, daoCount: 1, caoCount: 1, readings: ['heart', 'dao:1', 'dao:8'], readingMs: { heart: 3600000 + 5 * 60000 + 3000, dao: 26 * 60000 } },
      '2026-11-07': { xinCount: 1, daoCount: 0, caoCount: 2, readingMs: { cao: 40000 } },
      '2025-06-01': { daoCount: 4 },
      '2025-06-02': { readingMs: { heart: null, dao: undefined } }
    } };
  }
  function loadState() {
    if (fixtureMode) return buildFixture(fixtureName);
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
    if (fixtureMode) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { showToast('保存失败，请检查浏览器存储空间'); }
  }
  function localDate(date = new Date()) {
    const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function day(date = localDate()) {
    if (!dayRecord(state.days[date])) state.days[date] = blankDay();
    const item = state.days[date];
    /* 旧版本备份里没有 caoCount，首次访问时补 0，避免 undefined++ 变成 NaN。缺了的数组也补空，避免读记录时抛错。 */
    if (typeof item.caoCount !== 'number') item.caoCount = Number(item.caoCount) || 0;
    if (!Array.isArray(item.readings)) item.readings = [];
    if (!Array.isArray(item.activities)) item.activities = [];
    return item;
  }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function dayRecord(item) { return item && typeof item === 'object' ? item : null; }
  function userLibrary() {
    if (!state.library || typeof state.library !== 'object') state.library = { pieces: {}, books: [] };
    if (!state.library.pieces || typeof state.library.pieces !== 'object' || Array.isArray(state.library.pieces)) state.library.pieces = {};
    if (!Array.isArray(state.library.books)) state.library.books = [];
    if (!Array.isArray(state.library.pieces.cao)) state.library.pieces.cao = [];
    if (!Array.isArray(state.library.pieces.heart)) state.library.pieces.heart = [];
    return state.library;
  }
  function isCustomBook(id) { return userLibrary().books.some(book => book && book.id === id); }
  function allBooks() {
    const custom = userLibrary().books.filter(book => book && TimeStats.isBookId(String(book.id)) && String(book.title || '').trim()).map(book => ({
      id: String(book.id),
      name: String(book.title).trim(),
      cardTitle: String(book.title).trim(),
      countKey: null,
      custom: true
    }));
    return BOOKS.concat(custom);
  }
  function bookCount(book, item) {
    if (!book || !item) return 0;
    if (book.custom) return Number(item.userCounts && item.userCounts[book.id]) || 0;
    return Number(item[book.countKey]) || 0;
  }
  function setBookCount(book, item, value) {
    if (book.custom) {
      if (!item.userCounts || typeof item.userCounts !== 'object' || Array.isArray(item.userCounts)) item.userCounts = {};
      item.userCounts[book.id] = value;
    } else item[book.countKey] = value;
  }
  function extraPieces(list, startNumber) {
    return (Array.isArray(list) ? list : []).filter(piece => piece && String(piece.title || '').trim()).map((piece, index) => ({
      number: startNumber + index,
      title: String(piece.title).trim(),
      text: String(piece.text || ''),
      meta: '自己添加',
      translation: '',
      note: '',
      user: true
    }));
  }
  function piecesOf(bookId) {
    if (bookId === 'heart') {
      const base = [{ number: 1, title: '心经', text: HEART.map(segment => segment.text).join('\n'), meta: '唐 · 玄奘译', translation: HEART_TRANSLATION, note: '', builtin: true }];
      return base.concat(extraPieces(userLibrary().pieces.heart, 2));
    }
    if (bookId === 'dao' && window.DAO_DE_JING) return window.DAO_DE_JING.chapters;
    if (bookId === 'cao' && window.CAO_POEMS) {
      const base = window.CAO_POEMS.poems;
      return base.concat(extraPieces(userLibrary().pieces.cao, base.length + 1));
    }
    const custom = userLibrary().books.find(book => book && book.id === bookId);
    if (!custom) return [];
    return (Array.isArray(custom.pieces) ? custom.pieces : []).filter(piece => piece && String(piece.title || '').trim()).map((piece, index) => ({
      number: index + 1,
      title: String(piece.title).trim(),
      text: String(piece.text || ''),
      meta: '自己添加',
      translation: '',
      note: '',
      user: true
    }));
  }
  function sum(key) { return Object.values(state.days).reduce((total, item) => total + (Number(dayRecord(item)?.[key]) || 0), 0); }
  function todayLabel() { return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()); }
  let timerStart = Number(state.activeTimer?.startedAt) || null;
  let timerBook = ['heart','dao','cao'].includes(state.activeTimer?.book) ? state.activeTimer.book : null;
  if (!timerBook) timerStart=null;
  function formatDuration(ms) { return TimeStats.formatDuration(ms); }
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
      if(!entry.readingMs) entry.readingMs={heart:0,dao:0,cao:0};
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
  function routeTo(name, keepStats) {
    flushTimer(true);
    route = name;
    layoutEditing=false;
    if (!keepStats) statsFocus=null;
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
    const known = allBooks().find(entry => entry.id === book);
    const n = book === 'all'
      ? allBooks().reduce((total, entry) => total + bookCount(entry, item), 0)
      : (known ? bookCount(known, item) : 0);
    const ms = book === 'all'
      ? allBooks().reduce((total, entry) => total + TimeStats.finiteMs(item.readingMs && item.readingMs[entry.id]), 0)
      : TimeStats.finiteMs(item.readingMs && item.readingMs[book]);
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

  function timeReport() {
    const books = TimeStats.discoverBooks(state.days, allBooks());
    const aggregated = TimeStats.aggregateBookTimes(state.days, books);
    const catalogIds = new Set(allBooks().map(book => book.id));
    const rows = aggregated.filter(row => catalogIds.has(row.id)).concat(
      aggregated.filter(row => !catalogIds.has(row.id)).sort((a, b) => b.ms - a.ms || a.name.localeCompare(b.name, 'zh'))
    );
    const ordered = rows.map(row => ({ id: row.id, name: row.name }));
    const dist = TimeStats.buildTimeDistribution(rows);
    const clocks = TimeStats.allocateSeconds(rows);
    if (!ordered.some(book => book.id === statsBook) && ordered[0]) statsBook = ordered[0].id;
    return { books: ordered, rows, dist, clocks };
  }
  function renderToday() {
    const report = timeReport();
    const card = book => {
      const index = report.books.findIndex(item => item.id === book.id);
      const seconds = index >= 0 ? report.clocks.seconds[index] : 0;
      const todayCount = bookCount(book, day());
      const totalCount = Object.values(state.days).reduce((total, item) => total + bookCount(book, dayRecord(item)), 0);
      const days = Object.values(state.days).filter(item => bookCount(book, dayRecord(item)) > 0).length;
      return `<article class="practice-card"><button type="button" class="card-stats" data-action="open-book-stats" data-book="${book.id}" aria-label="查看${book.name}的统计"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5h16M7.5 19.5v-6M12 19.5V8M16.5 19.5v-9"/></svg></button><button type="button" class="practice-open" data-action="open-recitation" data-book="${book.id}"><h2>${book.cardTitle}</h2><div class="practice-numbers"><span><b>${todayCount}</b>今日（遍）</span><span><b>${totalCount}</b>累计（遍）</span><span><b>${days}</b>天数</span></div><div class="practice-time">总时间　${TimeStats.formatSeconds(seconds)}</div></button></article>`;
    };
    document.getElementById('view-today').innerHTML = allBooks().map(card).join('') + `<button type="button" class="add-card" data-action="add-card">添加卡片</button>`;
  }
  function daoReader() {
    const chapter = window.DAO_DE_JING.chapters[chapterNumber - 1];
    const done = day().readings.includes(`dao:${chapterNumber}`);
    const chips = window.DAO_DE_JING.chapters.map(item => `<button class="chapter-chip ${item.number === chapterNumber ? 'active' : ''} ${day().readings.includes(`dao:${item.number}`) ? 'done' : ''}" data-action="chapter" data-number="${item.number}" aria-label="第${item.number}章 ${esc(item.title)}">${String(item.number).padStart(2, '0')}</button>`).join('');
    return `<details class="chapter-picker"><summary>选择章节　·　共八十一章</summary><div class="chapter-list" aria-label="选择章节">${chips}</div></details><article class="reading-panel"><div class="reading-meta">第 ${String(chapter.number).padStart(2, '0')} 章</div><h2 class="reading-title">${esc(chapter.title)}</h2><div class="classic-text${pinyinOn()?' with-pinyin':''}">${pinyinOn()?annotatePinyin(esc(chapter.text), window.DAO_PINYIN):esc(chapter.text)}</div><details class="annotation-fold"><summary>查看本章注释</summary><p>${esc(chapter.note)}</p></details><div class="reading-actions"><button class="text-button" data-action="prev-chapter" ${chapterNumber === 1 ? 'disabled' : ''}>← 上一章</button><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="dao:${chapterNumber}">${done ? '今日已读 ✓' : '标记读过'}</button><button class="text-button" data-action="next-chapter" ${chapterNumber === 81 ? 'disabled' : ''}>下一章 →</button></div></article>`;
  }
  function heartReader() {
    const done=day().readings.includes('heart');
    return `<article class="reading-panel"><div class="reading-meta">唐 · 玄奘译</div><h2 class="reading-title">般若波罗蜜多心经</h2><div class="classic-text${pinyinOn()?' with-pinyin':''}">${pinyinOn()?annotatePinyin(HEART.map(segment=>esc(segment.text)).join('\n'), window.HEART_PINYIN):HEART.map(segment=>esc(segment.text)).join('\n')}</div><details class="annotation-fold"><summary>查看心经注释</summary><div class="annotation-list">${HEART.map(segment=>`<p><b>${esc(segment.title)}</b><br>${esc(segment.note)}</p>`).join('')}</div></details><div class="reading-actions"><span class="muted" style="align-self:center">维基文库 · 玄奘译本</span><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="heart">${done ? '今日已读 ✓' : '标记读过'}</button></div></article>`;
  }
  function renderRead() {
    document.getElementById('view-read').innerHTML = `<div class="page-intro"><h1 id="read-title">读经典</h1></div><div class="switcher"><button class="pill ${readingBook === 'dao' ? 'active' : ''}" data-action="book" data-book="dao">《道德经》</button><button class="pill ${readingBook === 'heart' ? 'active' : ''}" data-action="book" data-book="heart">《心经》</button></div><div class="reader-tools"><button class="pinyin-toggle ${pinyinOn()?'on':''}" data-action="toggle-pinyin" aria-pressed="${pinyinOn()}">拼音标注 · ${pinyinOn()?'开':'关'}</button></div>${readingBook === 'dao' ? daoReader() : heartReader()}<p class="source-note">《道德经》王弼本，简体转换；注释为白话导读。<br>《心经》玄奘译本。<br><a href="https://zh.wikisource.org/zh-hans/道德经_(王弼本)" target="_blank" rel="noreferrer">原文来源</a> · <a href="https://zh.wikisource.org/zh-hans/般若波罗蜜多心经_(玄奘)" target="_blank" rel="noreferrer">心经来源</a></p>`;
  }
  function layoutBaseKey() { return reciteBook === 'heart' && reciteChapter > 1 ? `heart:${reciteChapter}` : reciteBook === 'heart' ? 'heart' : isCustomBook(reciteBook) ? `user:${reciteBook}:${reciteChapter}` : reciteBook === 'cao' ? `cao:${reciteChapter}` : `dao:${reciteChapter}`; }
  /* v27 起拼音标注对三课统一生效；兼容旧版只用于道德经的开关 key */
  const PINYIN_KEY = 'rikey.pinyin.all';
  const LEGACY_PINYIN_KEY = 'rikey.pinyin.dao';
  const pinyinOn = () => (localStorage.getItem(PINYIN_KEY) ?? localStorage.getItem(LEGACY_PINYIN_KEY) ?? '1') !== '0';
  function pinyinTable() {
    if (isCustomBook(reciteBook)) return null;
    return reciteBook === 'heart' ? window.HEART_PINYIN
         : reciteBook === 'cao' ? window.CAO_PINYIN
         : window.DAO_PINYIN;
  }
  function annotatePinyin(html, data = window.DAO_PINYIN) {
    if (!data) return html;
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
            const rb = document.createElement('rb');
            rb.textContent = w[k];
            const rt = document.createElement('rt'); rt.textContent = py;
            ruby.appendChild(rb); ruby.appendChild(rt); frag.appendChild(ruby);
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
    return (suffix==='original' && pinyinOn()) ? annotatePinyin(html, pinyinTable()) : html;
  }
  function layoutBlock(suffix, fallback, classes='') {
    const key=`${layoutBaseKey()}:${suffix}`;
    const extra=(suffix==='original' && pinyinOn())?' with-pinyin':'';
    return `<div class="layout-content ${classes}${extra}" data-layout-key="${esc(key)}" contenteditable="false" spellcheck="false">${layoutHtml(suffix,fallback)}</div>`;
  }
  function setLayoutEditing(on) {
    layoutEditing=on;
    const screen=document.querySelector('.recitation-screen'); if(!screen) return;
    screen.classList.toggle('editing-layout',on);
    screen.querySelectorAll('[data-layout-key]').forEach(el=>el.contentEditable=on?'true':'false');
    const panel=screen.querySelector('#read-settings');
    const toggle=screen.querySelector('[data-action="toggle-read-settings"]');
    if(panel) panel.hidden=true;
    if(toggle) toggle.setAttribute('aria-expanded','false');
    if(!on) { document.activeElement?.blur(); showToast('排版已保存'); }
  }
  function syncFontControls() {
    const size=currentFontSize();
    const label=document.getElementById('font-size-label');
    if(label) label.textContent=String(size);
    document.querySelectorAll('[data-action="font-smaller"]').forEach(button=>{ button.disabled=size<=10; });
    document.querySelectorAll('[data-action="font-larger"]').forEach(button=>{ button.disabled=size>=28; });
  }
  function openingLine(text) {
    const flat=String(text ?? '').replace(/\s+/g,'');
    if(!flat) return '';
    const piece=flat.split(/[。！？；]/)[0] || flat;
    return piece.length>18 ? `${piece.slice(0,18)}…` : piece;
  }
  function chapterDialog(bookId) {
    const isDao=bookId==='dao';
    const items=piecesOf(bookId);
    const unit=isDao ? '章' : bookId==='heart' ? '篇' : '首';
    const showTitle=!isDao;
    const tiles=items.map(item=>{
      const open=openingLine(item.text);
      const selected=item.number===reciteChapter;
      const title=showTitle ? item.title : '';
      const label=[`第${item.number}${unit}`, title, open].filter(Boolean).join('，');
      return `<button type="button" class="chapter-tile${selected?' selected':''}" data-action="choose-chapter" data-number="${item.number}" aria-label="${esc(label)}" aria-current="${selected?'true':'false'}"><span class="chapter-index">${esc(String(item.number).padStart(2,'0'))}</span><span class="chapter-copy">${title?`<span class="chapter-name">${esc(title)}</span>`:''}<span class="chapter-open">${esc(open || '（这篇没有正文）')}</span></span></button>`;
    }).join('');
    const add=(bookId==='cao' || bookId==='heart' || isCustomBook(bookId)) ? `<button type="button" class="chapter-add" data-action="add-piece" data-book="${esc(bookId)}">添加一篇</button>` : '';
    const heading=isDao ? '选择章节' : '选择篇目';
    return `<dialog class="chapter-dialog" id="chapter-dialog" aria-label="${heading}"><div class="chapter-dialog-head"><h2>${heading}</h2><button type="button" data-action="close-chapters" aria-label="关闭">×</button></div><div class="chapter-grid">${tiles}${add}</div></dialog>`;
  }
  function collectionContent(bookId) {
    const pieces=piecesOf(bookId);
    if(!pieces.length) return `<div class="empty-piece"><p>还没有内容</p><button type="button" class="add-piece" data-action="add-piece" data-book="${esc(bookId)}">添加一篇</button></div>`;
    if(reciteChapter>pieces.length) reciteChapter=pieces.length;
    if(reciteChapter<1) reciteChapter=1;
    const piece=pieces[reciteChapter-1];
    const isDao=bookId==='dao';
    const unit=isDao ? '章' : bookId==='heart' ? '篇' : '首';
    const position=isDao ? `第 ${piece.number} 章` : `第 ${piece.number} ${unit} · ${esc(piece.title)}`;
    const guide=isDao ? `<p>${esc(piece.note||'')}</p>` : `<p>${esc(piece.note || (piece.user ? '这是你添加的一篇。' : ''))}</p>${bookId==='cao' && !piece.user ? `<p class="muted">${esc(window.CAO_POEMS.edition)}</p>` : ''}`;
    const noteTitle=isDao ? '本章导读' : '本篇导读';
    const add=(bookId==='cao' || bookId==='heart' || isCustomBook(bookId)) ? `<button type="button" class="add-piece inline-add" data-action="add-piece" data-book="${esc(bookId)}">添加一篇</button>` : '';
    return `<div class="dao-swipe" id="dao-swipe"><button class="chapter-position chapter-select-trigger" data-action="open-chapters">${position}</button>${piece.meta?`<div class="reading-meta">${esc(piece.meta)}</div>`:''}<div class="classic-text recitation-text">${layoutBlock("original", piece.text || '')}</div><details class="annotation-fold dao-translation" ${(localStorage.getItem("rikey.daoTranslationOpen") ?? localStorage.getItem("rikey.daoNoteOpen"))==="1"?"open":""}><summary>白话翻译</summary>${layoutBlock("translation", piece.translation || '', "translation-layout")}</details><details class="annotation-fold"><summary>${noteTitle}</summary>${guide}</details>${add}</div>`;
  }
  function reciteChrome(name) {
    const canAdd=reciteBook==='heart' || reciteBook==='cao' || isCustomBook(reciteBook);
    const add=canAdd ? `<button type="button" class="add-piece-link" data-action="add-piece" data-book="${esc(reciteBook)}">添加一篇</button>` : '';
    return `<div class="recite-header"><div class="recite-title-row"><button type="button" class="back-button" data-action="back-recitation" aria-label="返回">‹</button><h1 id="recite-title">${name}</h1></div><div class="timer-row"><div class="reading-timer" id="reading-timer">今日 ${formatDuration(todayReadingMs(reciteBook))}</div>${add}</div></div>`;
  }
  function readDock() {
    const on=pinyinOn();
    return `<div class="read-dock"><div class="read-tools"><button type="button" class="pinyin-button${on?' on':''}" data-action="toggle-pinyin" aria-pressed="${on}" aria-label="拼音标注，当前${on?'已开启':'已关闭'}">${on?'拼音开':'拼音关'}</button><div class="font-step"><button type="button" data-action="font-smaller" aria-label="缩小字体">A−</button><b id="font-size-label">${currentFontSize()}</b><button type="button" data-action="font-larger" aria-label="放大字体">A＋</button></div><button type="button" class="settings-edit" data-action="edit-layout">排版</button></div><div class="layout-toolbar" role="toolbar" aria-label="排版工具"><button type="button" data-action="format" data-command="bold" aria-label="加粗"><b>B</b></button><button type="button" data-action="format" data-command="italic" aria-label="斜体"><i>I</i></button><button type="button" data-action="format" data-command="underline" aria-label="下划线"><u>U</u></button><button type="button" data-action="format" data-command="justifyLeft" aria-label="左对齐">左</button><button type="button" data-action="format" data-command="justifyCenter" aria-label="居中">中</button><button type="button" data-action="restore-layout" class="layout-restore">恢复默认</button><button type="button" class="layout-done" data-action="edit-layout">完成</button></div></div>`;
  }
  function reciteFooter(countKey) {
    if (!timerStart) return `<div class="bottom-counter waiting">
        <button class="start-tap" data-action="start-timer"><b>开始诵读</b><small>自动计时 · 轻点记一遍</small></button>
      </div>`;
    return `<div class="bottom-counter running">
        <div class="counter-head"><i class="live-dot"></i><span>诵读中</span><span class="counter-hint">轻点任意处记一遍</span><button class="undo-button" data-action="undo" data-key="${countKey}" aria-label="撤销一遍" title="撤销一遍">↶ 撤销</button></div>
        <button class="count-tap" data-action="count" data-key="${countKey}" aria-label="轻点记一遍">
          <span class="tap-ring"></span>
          <span class="tap-main"><b class="tap-number" id="recite-today-count">${bookCount(allBooks().find(entry=>entry.id===reciteBook), day())}</b><span class="tap-unit">遍</span></span>
          <span class="tap-total" id="recite-total-count">累计 ${bookTotalCount(reciteBook)}</span>
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
      node.innerHTML=`<div class="page-intro"><h1 id="recite-title">选择背诵内容</h1></div><div class="recite-choices">${choice('dao','《道德经》','道','八十一章 · 王弼本','daoCount')}${choice('heart','《心经》','心','唐 · 玄奘译','xinCount')}${choice('cao','曹操的诗','曹',`${window.CAO_POEMS.poems.length} 首 · 建安乐府`,'caoCount')}</div><p class="choice-note">诵读时自动计时 · 轻点记一遍<br>曹操诗据《乐府诗集》通行本整理 · 记录只保存在这台设备</p>`;
      return;
    }
    shell.classList.add('immersive');
    const isHeart=reciteBook==='heart';
    const customBook=allBooks().find(entry=>entry.id===reciteBook && entry.custom);
    const bookName=isHeart?'《心经》':customBook?customBook.cardTitle:reciteBook==='cao'?'曹操的诗':'《道德经》';
    const countKey=isHeart?'xinCount':reciteBook==='cao'?'caoCount':reciteBook==='dao'?'daoCount':'user';
    const heartOriginal=`<div class="classic-text recitation-text">${layoutBlock("original",HEART.map(segment=>segment.text).join("\n"))}</div><details class="annotation-fold"><summary>白话翻译</summary>${layoutBlock("translation",HEART_TRANSLATION,"translation-layout")}</details><details class="annotation-fold recitation-annotation"><summary>心经注释</summary><div class="annotation-list">${HEART.map(segment=>`<p><b>${esc(segment.title)}</b><br>${esc(segment.note)}</p>`).join('')}</div></details><button type="button" class="add-piece inline-add" data-action="add-piece" data-book="heart">添加一篇</button>`;
    const heartPieces=isHeart ? piecesOf('heart') : [];
    const content=isHeart && reciteChapter<=1 ? `${heartPieces.length>1?`<button class="chapter-position chapter-select-trigger" data-action="open-chapters">第 1 篇 · 心经</button>`:''}${heartOriginal}` : collectionContent(reciteBook);
    layoutEditing=false;
    node.innerHTML=`<div class="recitation-screen" style="--text-size:${currentFontSize()}px">${reciteChrome(bookName)}${content}${isHeart && heartPieces.length<2 ? '' : chapterDialog(reciteBook)}<div class="recite-footer">${readDock()}<div class="recite-actions">${reciteFooter(countKey)}</div></div></div>`;
    syncFontControls();
  }
  let turningChapter = false;
  async function turnChapter(next) {
    const maxChapter = piecesOf(reciteBook).length;
    if (turningChapter || next < 1 || next > maxChapter || next === reciteChapter) return;
    turningChapter = true;
    const direction = next > reciteChapter ? 1 : -1;
    const old = document.getElementById('dao-swipe');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (old && !reduced) await old.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*24}px)`}],{duration:130,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
    if ((!piecesOf(reciteBook).length) || route !== 'recite') { turningChapter=false; return; }
    layoutEditing=false; reciteChapter = next; renderRecite(); window.scrollTo(0,0);
    const current=document.getElementById('dao-swipe');
    if (current && !reduced) await current.animate([{opacity:0,transform:`translateX(${direction*24}px)`},{opacity:1,transform:'translateX(0)'}],{duration:200,easing:'ease-out'}).finished.catch(()=>{});
    turningChapter=false;
  }
  function changeBookCount(bookId, delta) {
    const book=allBooks().find(entry=>entry.id===bookId); if(!book) return false;
    const item=day();
    const next=Math.max(0, bookCount(book, item)+delta);
    if(next===bookCount(book, item)) return false;
    setBookCount(book, item, next);
    return true;
  }
  function bookTotalCount(bookId) {
    const book=allBooks().find(entry=>entry.id===bookId); if(!book) return 0;
    return Object.values(state.days).reduce((total, item)=>total+bookCount(book, dayRecord(item)), 0);
  }
  function updateReciteProgress() {
    const book=allBooks().find(entry=>entry.id===reciteBook); if(!book) return;
    const todayCount=document.getElementById('recite-today-count');
    const total=document.getElementById('recite-total-count');
    if(todayCount) { todayCount.textContent=String(bookCount(book, day())); todayCount.classList.remove('bump'); void todayCount.offsetWidth; todayCount.classList.add('bump'); }
    if(total) total.textContent=`累计 ${bookTotalCount(reciteBook)}`;
  }
  function lastDays(n) {
    const items=[]; const now=new Date(); now.setHours(12,0,0,0);
    for (let i=n-1;i>=0;i--) { const date=new Date(now); date.setDate(now.getDate()-i); items.push(localDate(date)); }
    return items;
  }
  function formatCnDate(iso) {
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if(!match) return iso || '';
    return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
  }
  function colorFor(id, books) {
    const index=Math.max(0, books.findIndex(book=>book.id===id));
    return SLICE_COLORS[index % SLICE_COLORS.length];
  }
  function centerMarkup(totalSeconds) {
    const safe=totalSeconds>0 ? totalSeconds : 0;
    const h=Math.floor(safe/3600), m=Math.floor((safe%3600)/60), sec=safe%60;
    const primary=h>0 ? `${h}小时` : `${m}分${String(sec).padStart(2,'0')}秒`;
    const secondary=h>0 ? `${String(m).padStart(2,'0')}分${String(sec).padStart(2,'0')}秒` : '';
    return `<div class="donut-center"><b class="donut-total">${primary}</b>${secondary?`<b class="donut-sub">${secondary}</b>`:''}<span>总时间</span></div>`;
  }
  function donutSvg(dist, books) {
    const cx=100, cy=100, r=72, stroke=16, c=2*Math.PI*r;
    if(dist.empty || dist.total<=0 || !dist.slices.length) {
      return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${EMPTY_RING}" stroke-width="${stroke}"></circle></svg>`;
    }
    if(dist.slices.length===1) {
      const only=dist.slices[0];
      const color=only.id==='other' ? OTHER_COLOR : colorFor(only.id, books);
      return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"></circle></svg>`;
    }
    const gap=2.2; let cursor=0;
    const arcs=dist.slices.map(slice=>{
      const len=(slice.ms/dist.total)*c;
      const draw=Math.max(0, len-gap);
      const color=slice.id==='other' ? OTHER_COLOR : colorFor(slice.id, books);
      const arc=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${draw.toFixed(2)} ${(c-draw).toFixed(2)}" stroke-dashoffset="${(-cursor).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"></circle>`;
      cursor+=len; return arc;
    }).join('');
    return `<svg viewBox="0 0 200 200" aria-hidden="true">${arcs}</svg>`;
  }
  function bookProfile(id) {
    if (id==='heart') {
      const pieces=piecesOf('heart');
      if (pieces.length<=1) return { kind:'single', label:'一篇', unit:'篇', pieces:[] };
      return { kind:'collection', label:`${pieces.length} 篇`, unit:'篇', pieces:pieces.map(ch=>({ number:ch.number, title:ch.title, open:openingLine(ch.text), key:`heart:${ch.number}` })) };
    }
    if (id==='dao' && window.DAO_DE_JING && Array.isArray(window.DAO_DE_JING.chapters) && window.DAO_DE_JING.chapters.length>1) {
      return { kind:'collection', label:`${window.DAO_DE_JING.chapters.length} 章`, unit:'章', pieces:window.DAO_DE_JING.chapters.map(ch=>({ number:ch.number, title:ch.title, open:openingLine(ch.text), key:`dao:${ch.number}` })) };
    }
    if (id==='cao') {
      const pieces=piecesOf('cao');
      return { kind:'collection', label:`${pieces.length} 首`, unit:'首', pieces:pieces.map(ch=>({ number:ch.number, title:ch.title, open:openingLine(ch.text), key:`cao:${ch.number}` })) };
    }
    if (isCustomBook(id)) {
      const pieces=piecesOf(id);
      return { kind:'collection', label:pieces.length?`${pieces.length} 篇`:'空', unit:'篇', pieces:pieces.map(ch=>({ number:ch.number, title:ch.title, open:openingLine(ch.text), key:`${id}:${ch.number}` })) };
    }
    if (BOOKS.some(book=>book.id===id)) return { kind:'single', label:'一篇', unit:'篇', pieces:[] };
    return { kind:'record', label:'单独记录', unit:'', pieces:[] };
  }
  function readDaysFor(key) {
    let count=0;
    Object.entries(state.days).forEach(([date, entry])=>{
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !entry || !Array.isArray(entry.readings)) return;
      if (entry.readings.includes(key)) count+=1;
    });
    return count;
  }
  function timeCard(report) {
    const {books,dist,clocks}=report;
    const center=centerMarkup(clocks.totalSeconds);
    const svg=donutSvg(dist, books);
    const emptyNote=dist.empty ? '<p class="time-empty">还没有读诵时长。开始诵读并计时后，这里会按每本书显示占比。</p>' : '';
    const merged=dist.slices.some(slice=>slice.id==='other');
    const dusty=dist.items.some(item=>item.ms>0 && item.tenth===0);
    const note=!dist.empty && (merged || dusty) ? `<p class="time-round">${merged?'较小占比在图中合并为「其他」，下面仍列出每一本。':''}${dusty?'不足 0.1% 的时长仍计入总时间。':''}</p>` : '';
    const list=books.map((book,index)=>{
      const item=dist.items[index] || {ms:0,percentLabel:'—',merged:false};
      const swatch=item.ms<=0 ? ' is-empty' : '';
      const color=item.ms<=0 ? '' : (item.merged ? OTHER_COLOR : colorFor(book.id, books));
      const profile=bookProfile(book.id);
      const meta=[profile.label, item.merged?'并入其他':''].filter(Boolean).join(' · ');
      return `<li><button type="button" data-action="open-book-stats" data-book="${esc(book.id)}" aria-label="查看${esc(book.name)}的统计，${esc(profile.label)}"><i class="swatch${swatch}" ${color?`style="background:${color}"`:''} aria-hidden="true"></i><span class="time-name"><b>${esc(book.name)}</b>${meta?`<small>${esc(meta)}</small>`:''}</span><span class="time-dur">${TimeStats.formatSeconds(clocks.seconds[index]||0)}</span><span class="time-pct">${esc(item.percentLabel)}</span><span class="time-go" aria-hidden="true">›</span></button></li>`;
    }).join('');
    const label=dist.empty ? `还没有读诵时长，总时间 ${TimeStats.formatSeconds(0)}` : `累计总时间 ${TimeStats.formatSeconds(clocks.totalSeconds)}，各书占比见下方列表`;
    const find=books.length>8 ? '<label class="book-find">查找<input id="book-find" type="search" placeholder="书名" aria-label="按书名查找" autocomplete="off"></label>' : '';
    return `<section class="ds-card" id="time-dist"><div class="card-head"><h2>时间分布</h2><span>累计读诵</span></div><div class="donut" role="img" aria-label="${esc(label)}">${svg}${center}</div>${emptyNote}${find}<ul class="time-list">${list}</ul>${note}</section>`;
  }
  function renderStats(preserveInputs=false) {
    const report=timeReport();
    if (statsFocus && !report.books.some(book=>book.id===statsFocus)) statsFocus=null;
    const html=statsFocus ? bookStatsHtml(report, statsFocus) : overviewHtml(report);
    const root=document.getElementById('view-stats');
    if (preserveInputs && statsFocus && root.querySelector('.record-editor')) {
      const fresh=document.createElement('div'); fresh.innerHTML=html;
      const swap=selector=>{const oldNode=root.querySelector(selector), newNode=fresh.querySelector(selector); if(oldNode&&newNode) oldNode.innerHTML=newNode.innerHTML;};
      swap('#book-total'); swap('.streak-card'); swap('.trend-card');
      const oldCells=root.querySelectorAll('.heat-cell'), newCells=fresh.querySelectorAll('.heat-cell');
      oldCells.forEach((cell,i)=>{const next=newCells[i]; if(!next) return; cell.className=next.className; cell.setAttribute('aria-label',next.getAttribute('aria-label')); if(next.getAttribute('title')) cell.setAttribute('title',next.getAttribute('title'));});
      const oldFocus=root.querySelector('#heat-focus'), newFocus=fresh.querySelector('#heat-focus');
      if(oldFocus&&newFocus) oldFocus.textContent=newFocus.textContent;
      return;
    }
    root.innerHTML=html;
  }
  function overviewHtml(report) {
    const year=statsMonth.getFullYear(), month=statsMonth.getMonth();
    const practiced=Object.keys(state.days).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date) && report.books.some(item=>hasPractice(date,item.id))).length;
    return `<header class="page-head"><span class="eyebrow">STATISTICS</span><h1 id="stats-title">修习统计</h1><p class="page-head-date">${year} 年 ${month+1} 月 · 累计 ${practiced} 天</p></header>${timeCard(report)}`;
  }
  function bookStatsHtml(report, book) {
    const bookMeta=report.books.find(item=>item.id===book) || {id:book,name:book};
    const bookLabel=bookMeta.name || book;
    const profile=bookProfile(book);
    const known=allBooks().find(item=>item.id===book);
    const index=report.books.findIndex(item=>item.id===book);
    const seconds=index>=0 ? report.clocks.seconds[index] : 0;
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
    const metric=(label,obj,accent=false)=>`<div class="metric${accent?' is-today':''}"><span>${label}</span><b>${obj.count}<small>遍</small></b><em>${formatDuration(obj.ms)}</em></div>`;
    const trend=trendBars(book,7);
    const monthEnd=new Date(year,month+1,0,12);
    const endOffset=(monthEnd.getDay()+6)%7;
    const firstDay=new Date(monthEnd); firstDay.setDate(monthEnd.getDate()-endOffset-77);
    let heat='';
    for(let w=0;w<12;w++) for(let dow=0;dow<7;dow++) {
      const cursor=new Date(firstDay); cursor.setDate(firstDay.getDate()+w*7+dow);
      const date=localDate(cursor), v=dayValue(date,book), level=heatLevel(v), future=date>today;
      const label=`${formatCnDate(date)} · ${bookLabel} · ${v.n} 遍 · ${formatDuration(v.ms)}`;
      heat+=`<button type="button" class="heat-cell level-${level}${date===statsSelectedDate?' selected':''}${date===today?' is-today':''}" data-action="stats-day" data-date="${date}" aria-label="${esc(label)}" title="${esc(label)}" ${future?'disabled':''}></button>`;
    }
    const focus=`已选 ${formatCnDate(statsSelectedDate)} · ${bookLabel} · ${dayValue(statsSelectedDate,book).n} 遍 · ${formatDuration(dayValue(statsSelectedDate,book).ms)}`;
    const countValue=known ? bookCount(known, selected) : 0;
    const countField=known ? `<label><input class="inline-count" type="number" min="0" max="100000" step="1" inputmode="numeric" required data-inline-record="count" data-book="${esc(book)}" value="${countValue}" aria-label="${esc(bookLabel)}次数"><small>遍</small></label>` : '';
    const timeField=`<input class="inline-time" type="text" maxlength="12" pattern="[0-9]+:[0-5][0-9]:[0-5][0-9]" required data-inline-record="time" data-book="${esc(book)}" value="${recordTime(TimeStats.finiteMs(selected.readingMs && selected.readingMs[book]))}" aria-label="${esc(bookLabel)}时长，时分秒">`;
    const kindCopy=profile.kind==='collection'
      ? `共 ${profile.pieces.length} ${profile.unit}。诵读遍数和时长记在整本书上，不拆到每一${profile.unit}。`
      : profile.kind==='single'
        ? '只有一篇。遍数和时长都是这一篇的。'
        : '这是单独一条记录，没有篇目。';
    const pieces=profile.kind==='collection' ? pieceListHtml(profile) : '';
    return `<div class="book-stats" data-kind="${profile.kind}"><div class="stats-back-row"><button type="button" class="stats-back" data-action="close-book-stats" aria-label="${statsOrigin==='today'?'返回首页':'返回时间分布'}">‹</button><div><span class="eyebrow">${profile.kind==='collection'?'多篇':profile.kind==='single'?'单篇':'记录'}</span><h1 id="stats-title">${esc(bookLabel)}</h1></div></div><p class="stats-kind">${kindCopy}</p><p class="book-total" id="book-total"><span>总时间</span><b>${TimeStats.formatSeconds(seconds)}</b></p><section class="streak-card"><div class="streak-top"><div class="streak-seal"><b>${streak}</b><span>连续日</span></div><div class="streak-copy"><h2>连续 ${streak} 天</h2><p>最长的坚持 · 历史 ${best} 天</p></div></div><div class="metrics">${metric('今日',todayStats,true)}${metric(isCurrentMonth?'本月':'当月',monthStats)}${metric('累计',allStats)}</div></section>${pieces}<section class="ds-card"><div class="card-head"><h2>修习热力</h2><div class="month-switch"><button type="button" data-action="stats-prev-month" aria-label="上个月">‹</button><b>${year} 年 ${month+1} 月</b><button type="button" data-action="stats-next-month" aria-label="下个月" ${isCurrentMonth?'disabled':''}>›</button></div></div><div class="heat-grid">${heat}</div><p id="heat-focus" class="heat-focus" aria-live="polite">${esc(focus)}</p><div class="heat-legend"><span>少</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><span>多</span></div><details class="record-editor"><summary><span>修改本日记录</span><span class="editor-meta">${statsSelectedDate} ›</span></summary><div class="record-fields"><div class="record-row"><span>${esc(bookLabel)}</span>${countField}${timeField}</div></div></details></section><section class="ds-card trend-card"><div class="card-head"><h2>近 7 日</h2><span>共 ${trend.total} 遍</span></div><div class="trend-bars">${trend.bars}</div><div class="trend-week">${trend.labels}</div></section></div>`;
  }
  function pieceListHtml(profile) {
    const rows=profile.pieces.map(piece=>{
      const days=readDaysFor(piece.key);
      const title=profile.unit==='首' ? piece.title : (piece.open || piece.title);
      const sub=profile.unit==='首' ? piece.open : '';
      return `<li class="piece-row"><span class="piece-index">${esc(String(piece.number).padStart(2,'0'))}</span><span class="piece-copy"><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span><span class="piece-stat">${days>0?`读过 ${days} 天`:'未读过'}</span></li>`;
    }).join('');
    const touched=profile.pieces.filter(piece=>readDaysFor(piece.key)>0).length;
    return `<section class="ds-card piece-card"><div class="card-head"><h2>篇目</h2><span>读过 ${touched} / ${profile.pieces.length} ${profile.unit}</span></div><p class="piece-note">每一${profile.unit}只统计实际标记过的天数。历史时长没有按篇分开，这里不补成 0 秒。</p><ul class="piece-list">${rows}</ul></section>`;
  }
  function ensureFixtureBanner() {
    if (!fixtureMode || document.getElementById('fixture-banner')) return;
    const bar=document.createElement('div');
    bar.id='fixture-banner'; bar.className='fixture-banner'; bar.setAttribute('role','note');
    bar.textContent='测试数据 · 不会写入本机记录';
    document.querySelector('.app-shell').prepend(bar);
  }
  function render() {
    ensureFixtureBanner();
    renderToday(); renderRead(); renderRecite(); renderStats();
  }

  function recordTime(ms) {
    const seconds=Math.floor((Number(ms)||0)/1000);
    return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }
  function countKeyFor(book) { const found=allBooks().find(entry=>entry.id===book); return found && !found.custom ? found.countKey || '' : ''; }
  function updateInlineRecord(input,live) {
    const book=input.dataset.book, kind=input.dataset.inlineRecord, key=countKeyFor(book);
    const existing=state.days[statsSelectedDate] || blankDay();
    if(!input.checkValidity()) {
      if(!live) { input.value=kind==='count' ? String(Number(existing[key])||0) : recordTime(TimeStats.finiteMs(existing.readingMs && existing.readingMs[book])); showToast(kind==='count'?'请输入有效次数':'请按 时:分:秒 输入'); }
      return;
    }
    if(kind==='count') {
      const found=allBooks().find(entry=>entry.id===book);
      const value=Number(input.value); if(!Number.isInteger(value) || value<0 || value>100000) { if(!live && found) input.value=String(bookCount(found, existing)); return; }
      if(!found || value===bookCount(found, existing)) return;
      setBookCount(found, day(statsSelectedDate), value);
    } else {
      const current=TimeStats.finiteMs(existing.readingMs && existing.readingMs[book]);
      if(input.value===recordTime(current)) return;
      const [h,m,s]=input.value.split(':').map(Number); const ms=(h*3600+m*60+s)*1000;
      if(!Number.isSafeInteger(ms) || ms<0) {if(!live){input.value=recordTime(current);showToast('请输入有效时长');}return;}
      const entry=day(statsSelectedDate); if(!entry.readingMs || typeof entry.readingMs!=='object' || Array.isArray(entry.readingMs)) entry.readingMs={};
      entry.readingMs[book]=ms;
      if(!live) input.value=recordTime(ms);
    }
    saveState(); renderToday(); renderStats(true);
  }
  document.addEventListener('input',event=>{
    const find=event.target.closest('#book-find');
    if(find) {
      const query=find.value.trim();
      document.querySelectorAll('.time-list > li').forEach(item=>{
        const name=item.querySelector('.time-name')?.innerText || '';
        item.hidden=!!query && !name.includes(query);
      });
      const shown=[...document.querySelectorAll('.time-list > li')].filter(item=>!item.hidden).length;
      let empty=document.querySelector('.book-find-empty');
      if(!empty) {
        empty=document.createElement('p'); empty.className='book-find-empty'; empty.textContent='没有这本书';
        document.querySelector('.time-list')?.after(empty);
      }
      empty.hidden=shown!==0;
      return;
    }
    const input=event.target.closest('[data-inline-record]'); if(input) updateInlineRecord(input,true);
  });
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
    if (action === 'toggle-read-settings') {
      const panel=document.getElementById('read-settings'); if(!panel) return;
      panel.hidden=!panel.hidden;
      button.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      syncFontControls();
      return;
    }
    if (action === 'open-book-stats' || action === 'stats-book') {
      if(!TimeStats.isBookId(button.dataset.book)) return;
      statsOrigin = route==='today' ? 'today' : 'stats';
      statsFocus=button.dataset.book; statsBook=statsFocus;
      if (route==='stats') { renderStats(); window.scrollTo(0,0); return; }
      routeTo('stats', true); return;
    }
    if (action === 'close-book-stats') {
      const backHome=statsOrigin==='today';
      statsFocus=null;
      if (backHome) { routeTo('today'); return; }
      renderStats(); window.scrollTo(0,0); return;
    }
    if (action === 'add-card') { openCompose('card'); return; }
    if (action === 'add-piece') {
      const chapterDialogNode=document.getElementById('chapter-dialog');
      if (chapterDialogNode && chapterDialogNode.open) chapterDialogNode.close();
      openCompose('piece', button.dataset.book || reciteBook); return;
    }
    if (action === 'stats-day') { statsSelectedDate=button.dataset.date; renderStats(); return; }
    if (action === 'stats-prev-month' || action === 'stats-next-month') {
      const delta=action==='stats-prev-month'?-1:1; statsMonth=new Date(statsMonth.getFullYear(),statsMonth.getMonth()+delta,1);
      const today=new Date(); statsSelectedDate=(statsMonth.getFullYear()===today.getFullYear()&&statsMonth.getMonth()===today.getMonth())?localDate():localDate(statsMonth); renderStats(); return;
    }
    if (action === 'open-recitation') { flushTimer(true); reciteBook=button.dataset.book; reciteChapter=1; route='recite'; document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-recite')); renderRecite(); window.scrollTo(0,0); }
    if (action === 'start-timer') { startTimer(); const key=reciteBook==='heart'?'xinCount':reciteBook==='cao'?'caoCount':'daoCount'; const slot=document.querySelector('.recite-actions'); if(slot) slot.innerHTML=reciteFooter(key); updateTimerDisplay(); return; }
    if (action === 'edit-layout') { setLayoutEditing(!layoutEditing); return; }
    if (action === 'format') { if(layoutEditing) document.execCommand(button.dataset.command, false, null); return; }
    if (action === 'restore-layout') { if(confirm('恢复本篇原文和译文的默认排版？')) { const base=layoutBaseKey(); if(state.layouts){delete state.layouts[base+':original'];delete state.layouts[base+':translation'];} saveState(); layoutEditing=false; renderRecite(); showToast('已恢复默认排版'); } return; }
    if (action === 'back-recitation') { routeTo('today'); }
    if (action === 'open-chapters') { const dialog=document.getElementById('chapter-dialog'); dialog.showModal(); const selected=dialog.querySelector('.chapter-tile.selected'); if(selected) selected.scrollIntoView({block:'nearest'}); }
    if (action === 'close-chapters') document.getElementById('chapter-dialog').close();
    if (action === 'choose-chapter') { const next=Number(button.dataset.number); document.getElementById('chapter-dialog').close(); if(next!==reciteChapter) turnChapter(next); }
    if (action === 'swipe-prev') turnChapter(reciteChapter-1);
    if (action === 'swipe-next') turnChapter(reciteChapter+1);
    if (action === 'font-smaller' || action === 'font-larger') {
      const next=currentFontSize()+(action==='font-larger'?1:-1);
      if(next<10 || next>28) return;
      localStorage.setItem(fontKey(),next);
      const screen=document.querySelector('.recitation-screen');
      if(screen) screen.style.setProperty('--text-size',next+'px');
      syncFontControls();
      return;
    }
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
      if (route==='recite' && reciteBook) { changeBookCount(reciteBook, 1); saveState(); if (navigator.vibrate) navigator.vibrate(12); updateReciteProgress(); return; }
      const key=button.dataset.key; day()[key]++; saveState(); render();
    }
    if (action === 'undo') {
      if (route==='recite' && reciteBook) { if(changeBookCount(reciteBook, -1)) { saveState(); updateReciteProgress(); showToast('已撤销一次'); } return; }
      const item=day(); const key=button.dataset.key; if(item[key]>0){item[key]--;saveState();render();showToast('已撤销一次');}
    }
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
  document.addEventListener('touchend',e=>{if(!touchStart||!e.target.closest('#dao-swipe'))return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3){const next=reciteChapter+(dx<0?1:-1);const maxChapter=piecesOf(reciteBook).length;if(next>=1&&next<=maxChapter)turnChapter(next);}},{passive:true});
  function openCompose(mode, bookId) {
    composeMode={mode, bookId: bookId || null};
    const dialog=document.getElementById('compose-dialog');
    document.getElementById('compose-heading').textContent=mode==='card'?'添加卡片':'添加一篇';
    document.getElementById('compose-body-label').hidden=mode==='card';
    document.getElementById('compose-title').value='';
    document.getElementById('compose-text').value='';
    dialog.showModal();
    document.getElementById('compose-title').focus();
  }
  function saveCompose() {
    const title=document.getElementById('compose-title').value.trim();
    const text=document.getElementById('compose-text').value.trim();
    if(!title) { showToast('先写标题'); document.getElementById('compose-title').focus(); return; }
    if(title.length>40) { showToast('标题请少于 40 字'); return; }
    if(text.length>4000) { showToast('正文太长了'); return; }
    const lib=userLibrary();
    if(composeMode && composeMode.mode==='card') {
      const id='u'+Date.now().toString(36);
      lib.books.push({id, title, pieces:[]});
      saveState();
      document.getElementById('compose-dialog').close();
      render();
      showToast('已添加卡片');
      return;
    }
    const bookId=composeMode && composeMode.bookId;
    if(bookId==='cao' || bookId==='heart') {
      if(!Array.isArray(lib.pieces[bookId])) lib.pieces[bookId]=[];
      lib.pieces[bookId].push({id:'p'+Date.now().toString(36), title, text});
    }
    else {
      const book=lib.books.find(item=>item.id===bookId);
      if(!book) { showToast('没有找到这张卡片'); return; }
      if(!Array.isArray(book.pieces)) book.pieces=[];
      book.pieces.push({id:'p'+Date.now().toString(36), title, text});
    }
    saveState();
    document.getElementById('compose-dialog').close();
    if(route==='recite' && reciteBook===bookId) { reciteChapter=Math.max(1, piecesOf(bookId).length); renderRecite(); }
    else render();
    showToast('已添加一篇');
  }
  document.getElementById('compose-save').addEventListener('click', saveCompose);
  document.getElementById('compose-cancel').addEventListener('click', ()=>document.getElementById('compose-dialog').close());
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
