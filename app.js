(() => {
  const STORAGE_KEY = 'rikey.practice.v1';
  const HEART = [
    { title: '照见五蕴皆空', text: '观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。', note: '开篇从观照自己的身心经验开始。“五蕴皆空”不是说什么都不存在，而是提醒我们：感受、念头与身份都依条件而生，并非固定不变。' },
    { title: '色空与诸法', text: '舍利子，色不异空，空不异色；色即是空，空即是色。受想行识，亦复如是。\n舍利子，是诸法空相，不生不灭，不垢不净，不增不减。\n是故空中无色，无受想行识，无眼耳鼻舌身意，无色声香味触法，无眼界，乃至无意识界；无无明，亦无无明尽，乃至无老死，亦无老死尽；无苦集灭道。', note: '“空”常被解释为无固定自性、依缘而成。经文层层列举身心与认知经验，帮助读者松开对它们永恒不变的执着。' },
    { title: '无所得与无挂碍', text: '无智亦无得，以无所得故。\n菩提萨埵，依般若波罗蜜多故，心无罣碍；无罣碍故，无有恐怖，远离颠倒梦想，究竟涅槃。\n三世诸佛，依般若波罗蜜多故，得阿耨多罗三藐三菩提。', note: '不把智慧和修行成果当作可以占有的东西，心便少了挂碍。这里的“不取”并非放弃行动，而是减少被得失牢牢牵制。' },
    { title: '般若波罗蜜多咒', text: '故知般若波罗蜜多，是大神咒，是大明咒，是无上咒，是无等等咒，能除一切苦，真实不虚。\n故说般若波罗蜜多咒，即说咒曰：\n揭谛揭谛，波罗揭谛，波罗僧揭谛，菩提萨婆诃。', note: '结尾以咒语收束全经。“揭谛”常被意译为去、到彼岸；不同版本在断句与个别用字上可能略有差异。' }
  ];
  let state = loadState();
  let route = 'today';
  let readingBook = 'dao';
  let reciteBook = null;
  let reciteChapter = 1;
  let chapterNumber = 1;
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
  function routeTo(name) {
    route = name;
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
  function renderDaily() {
    const current = day();
    const minutes = current.activities.reduce((total, activity) => total + (Number(activity.minutes) || 0), 0);
    const movieTarget = Number(state.settings.movieTarget) || 100;
    const movieProgress = Math.min(100, Math.round(sum('movieViews') / movieTarget * 100));
    const activityRows = current.activities.length ? current.activities.map(activity => `
      <div class="activity-row"><span>${esc(activity.title)} <small>${esc(activity.time || '')}</small></span><span><small>${Number(activity.minutes) || 0} 分钟</small> <button class="delete-activity" data-action="delete-activity" data-id="${esc(activity.id)}" aria-label="删除记录">×</button></span></div>`).join('') : '<div class="empty-state">今天还没有记录</div>';
    document.getElementById('view-daily').innerHTML = `
      <div class="page-intro"><div class="date-line">${todayLabel()}</div><h1 id="today-title">今日</h1></div>
      <div class="daily-summary"><span>背诵 <b>${current.daoCount + current.xinCount}</b> 遍</span><span>阅读 <b>${current.readings.length}</b> 项</span><span>工作 <b>${minutes}</b> 分钟</span></div>
      <section class="simple-section"><div class="section-heading"><h2>英语电影</h2><span class="aside">${sum('movieViews')} / ${movieTarget} 遍</span></div><div class="movie-line"><div class="movie-head"><div><strong>${esc(state.settings.movieTitle || '英语电影')}</strong><small>100 遍计划</small></div><button class="button small secondary" data-action="movie">看完一遍 +1</button></div><div class="progress-track"><div class="progress-fill" style="width:${movieProgress}%"></div></div></div></section>
      <section class="simple-section"><div class="section-heading"><h2>其他工作</h2><span class="aside">${current.activities.length} 项</span></div><div class="activity-form"><input id="activity-title" class="field" maxlength="60" placeholder="记一项工作" aria-label="工作内容"><input id="activity-minutes" class="field" type="number" min="0" max="1440" inputmode="numeric" placeholder="分钟" aria-label="用时分钟"><button class="button primary" data-action="add-activity">添加</button></div><div class="activity-list">${activityRows}</div></section>`;
  }
  function renderToday() {
    const card=(name,book,key)=>`<article class="practice-card"><button class="practice-open" data-action="open-recitation" data-book="${book}"><h2>${name}</h2><div class="practice-numbers"><span><b>${day()[key]}</b>今日（遍）</span><span><b>${sum(key)}</b>累计（遍）</span><span><b>${Object.values(state.days).filter(d=>Number(d[key])>0).length}</b>天数</span></div></button><div class="practice-actions"><button data-action="report" data-key="${key}">报数</button><button data-action="count" data-key="${key}">计数 +1</button></div></article>`;
    document.getElementById('view-today').innerHTML=`<div class="page-intro"><h1 id="today-title">日课</h1></div>${card('般若波罗蜜多心经','heart','xinCount')}${card('道德经','dao','daoCount')}`;
  }
  function daoReader() {
    const chapter = window.DAO_DE_JING.chapters[chapterNumber - 1];
    const done = day().readings.includes(`dao:${chapterNumber}`);
    const chips = window.DAO_DE_JING.chapters.map(item => `<button class="chapter-chip ${item.number === chapterNumber ? 'active' : ''} ${day().readings.includes(`dao:${item.number}`) ? 'done' : ''}" data-action="chapter" data-number="${item.number}" aria-label="第${item.number}章 ${esc(item.title)}">${String(item.number).padStart(2, '0')}</button>`).join('');
    return `<details class="chapter-picker"><summary>选择章节　·　共八十一章</summary><div class="chapter-list" aria-label="选择章节">${chips}</div></details><article class="reading-panel"><div class="reading-meta">第 ${String(chapter.number).padStart(2, '0')} 章</div><h2 class="reading-title">${esc(chapter.title)}</h2><div class="classic-text">${esc(chapter.text)}</div><details class="annotation-fold"><summary>查看本章注释</summary><p>${esc(chapter.note)}</p></details><div class="reading-actions"><button class="text-button" data-action="prev-chapter" ${chapterNumber === 1 ? 'disabled' : ''}>← 上一章</button><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="dao:${chapterNumber}">${done ? '今日已读 ✓' : '标记读过'}</button><button class="text-button" data-action="next-chapter" ${chapterNumber === 81 ? 'disabled' : ''}>下一章 →</button></div></article>`;
  }
  function heartReader() {
    const done=day().readings.includes('heart');
    return `<article class="reading-panel"><div class="reading-meta">唐 · 玄奘译</div><h2 class="reading-title">般若波罗蜜多心经</h2><div class="classic-text">${HEART.map(segment=>esc(segment.text)).join('\n')}</div><details class="annotation-fold"><summary>查看心经注释</summary><div class="annotation-list">${HEART.map(segment=>`<p><b>${esc(segment.title)}</b><br>${esc(segment.note)}</p>`).join('')}</div></details><div class="reading-actions"><span class="muted" style="align-self:center">维基文库 · 玄奘译本</span><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="heart">${done ? '今日已读 ✓' : '标记读过'}</button></div></article>`;
  }
  function renderRead() {
    document.getElementById('view-read').innerHTML = `<div class="page-intro"><h1 id="read-title">读经典</h1></div><div class="switcher"><button class="pill ${readingBook === 'dao' ? 'active' : ''}" data-action="book" data-book="dao">《道德经》</button><button class="pill ${readingBook === 'heart' ? 'active' : ''}" data-action="book" data-book="heart">《心经》</button></div>${readingBook === 'dao' ? daoReader() : heartReader()}<p class="source-note">《道德经》王弼本，简体转换；注释为白话导读。<br>《心经》玄奘译本。<br><a href="https://zh.wikisource.org/zh-hans/道德经_(王弼本)" target="_blank" rel="noreferrer">原文来源</a> · <a href="https://zh.wikisource.org/zh-hans/般若波罗蜜多心经_(玄奘)" target="_blank" rel="noreferrer">心经来源</a></p>`;
  }
  function renderRecite() {
    const node=document.getElementById('view-recite');
    const shell=document.querySelector('.app-shell');
    if (!reciteBook) {
      shell.classList.remove('immersive');
      node.innerHTML=`<div class="page-intro"><h1 id="recite-title">选择背诵内容</h1></div><div class="recite-choices"><button class="recite-choice" data-action="open-recitation" data-book="dao"><span>《道德经》</span><small>累计 ${sum('daoCount')} 遍　→</small></button><button class="recite-choice" data-action="open-recitation" data-book="heart"><span>《心经》</span><small>累计 ${sum('xinCount')} 遍　→</small></button></div>`;
      return;
    }
    shell.classList.add('immersive');
    const isHeart=reciteBook==='heart';
    const bookName=isHeart?'《心经》':'《道德经》';
    const countKey=isHeart?'xinCount':'daoCount';
    const todayCount=day()[countKey];
    const content=isHeart ? `<div class="classic-text recitation-text">${HEART.map(segment=>esc(segment.text)).join('\n')}</div><details class="annotation-fold recitation-annotation"><summary>心经注释</summary><div class="annotation-list">${HEART.map(segment=>`<p><b>${esc(segment.title)}</b><br>${esc(segment.note)}</p>`).join('')}</div></details>` : (()=>{const c=window.DAO_DE_JING.chapters[reciteChapter-1];return `<div class="dao-swipe" id="dao-swipe"><div class="chapter-position">${reciteChapter} / 81</div><h2>第${reciteChapter}章</h2><div class="classic-text recitation-text">${esc(c.text)}</div><details class="annotation-fold"><summary>本章注释</summary><p>${esc(c.note)}</p></details><div class="chapter-controls"><button data-action="swipe-prev" ${reciteChapter===1?'disabled':''}>← 上一章</button><button data-action="swipe-next" ${reciteChapter===81?'disabled':''}>下一章 →</button></div></div>`;})();
    node.innerHTML=`<div class="recitation-screen"><button class="back-button" data-action="back-recitation">‹　返回</button><h1>${bookName}</h1><div class="recitation-origin">完整经文 · 慢慢背诵</div>${content}<div class="recite-footer"><div class="recite-progress"><b id="recite-today-count">今日 ${todayCount} 遍</b><span>累计 ${sum(countKey)} 遍</span><button class="text-button" data-action="undo" data-key="${countKey}">撤销</button></div><button class="text-button report-inside" data-action="report" data-key="${countKey}">报数</button><button class="tap-button ${isHeart?'cinnabar':''}" data-action="count" data-key="${countKey}">点一下 · 完成一遍</button></div></div>`;
  }
  function updateReciteProgress(key) {
    const todayCount=document.getElementById('recite-today-count');
    const total=document.querySelector('.recite-progress span');
    if(todayCount) todayCount.textContent=`今日 ${day()[key]} 遍`;
    if(total) total.textContent=`累计 ${sum(key)} 遍`;
  }
  function lastDays(n) {
    const items=[]; const now=new Date(); now.setHours(12,0,0,0);
    for (let i=n-1;i>=0;i--) { const date=new Date(now); date.setDate(now.getDate()-i); items.push(localDate(date)); }
    return items;
  }
  function renderStats() {
    const dates=lastDays(7);
    const values=dates.map(date => { const item=state.days[date] || blankDay(); return item.daoCount+item.xinCount+item.movieViews+item.readings.length+item.activities.length; });
    const max=Math.max(...values,1);
    const activeDays=Object.entries(state.days).filter(([,item]) => (item.daoCount+item.xinCount+item.movieViews+item.readings.length+item.activities.length)>0).length;
    const allReads=Object.values(state.days).reduce((total,item)=>total+(item.readings?.length||0),0);
    const history=dates.slice().reverse().map(date => { const item=state.days[date] || blankDay(); const sumRecite=item.daoCount+item.xinCount; const activities=item.activities.length; const mins=item.activities.reduce((total,a)=>total+(Number(a.minutes)||0),0); return `<div class="history-row"><b>${date === localDate() ? '今天' : date.slice(5).replace('-',' / ')}</b><span>诵 ${sumRecite} · 读 ${item.readings.length}</span><span>电影 ${item.movieViews} · 工作 ${activities} 项 / ${mins} 分</span></div>`; }).join('');
    document.getElementById('view-stats').innerHTML = `<div class="page-intro"><h1 id="stats-title">统计</h1></div><div class="stats-line"><span>道德经 <b>${sum('daoCount')}</b></span><span>心经 <b>${sum('xinCount')}</b></span><span>电影 <b>${sum('movieViews')}</b></span></div>
      <section class="simple-section"><div class="section-heading"><h2>近 7 日</h2><span class="aside">${activeDays} 天有记录 · 阅读 ${allReads} 项</span></div><div class="chart">${dates.map((date,index)=>`<div class="chart-day ${date===localDate()?'today':''}"><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(4,values[index]/max*92)}px"></div></div><span>${date.slice(5).replace('-','/')}</span></div>`).join('')}</div></section>
      <section class="simple-section"><div class="section-heading"><h2>每日记录</h2><span class="aside">最近 7 天</span></div><div class="history-list">${history}</div></section>`;
  }
  function render() {
    renderToday(); renderDaily(); renderRead(); renderRecite(); renderStats();
  }

  document.addEventListener('click', event => {
    const routeButton=event.target.closest('[data-route]');
    if (routeButton) { routeTo(routeButton.dataset.route); return; }
    const button=event.target.closest('[data-action]'); if (!button) return;
    const action=button.dataset.action;
    if (action === 'open-recitation') { reciteBook=button.dataset.book; reciteChapter=1; route='recite'; document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-recite')); renderRecite(); window.scrollTo(0,0); }
    if (action === 'back-recitation') { routeTo('today'); }
    if (action === 'swipe-prev' && reciteChapter>1) { reciteChapter--; renderRecite(); window.scrollTo(0,0); }
    if (action === 'swipe-next' && reciteChapter<81) { reciteChapter++; renderRecite(); window.scrollTo(0,0); }
    if (action === 'report') { const value=prompt('请输入本次背诵的遍数'); if(value!==null && /^\d+$/.test(value.trim()) && Number(value)>0 && Number(value)<=100000){const key=button.dataset.key;day()[key]+=Number(value);saveState();if(route==='recite'&&reciteBook)updateReciteProgress(key);else render();} else if(value!==null) showToast('请输入大于零的整数'); }
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

  let touchStart=null;
  document.addEventListener('touchstart',e=>{if(e.target.closest('#dao-swipe')) touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  document.addEventListener('touchend',e=>{if(!touchStart||!e.target.closest('#dao-swipe'))return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3){const next=reciteChapter+(dx<0?1:-1);if(next>=1&&next<=81){reciteChapter=next;renderRecite();window.scrollTo(0,0);}}},{passive:true});
  document.getElementById('open-settings').addEventListener('click',()=>{
    document.getElementById('movie-title').value=state.settings.movieTitle || '';
    document.getElementById('movie-target').value=state.settings.movieTarget || 100;
    document.getElementById('settings-dialog').showModal();
  });
  document.getElementById('save-settings').addEventListener('click',event=>{
    event.preventDefault(); const title=document.getElementById('movie-title').value.trim(); const target=Math.max(1,Number(document.getElementById('movie-target').value)||100);
    state.settings.movieTitle=title || '英语电影'; state.settings.movieTarget=target; saveState(); document.getElementById('settings-dialog').close(); render(); showToast('设置已保存');
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
  window.addEventListener('hashchange',()=>{const target=location.hash.slice(1);if(['today','daily','read','recite','stats'].includes(target))routeTo(target);});
  const initial=location.hash.slice(1); if(['today','daily','read','recite','stats'].includes(initial))route=initial;
  routeTo(route);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
})();
