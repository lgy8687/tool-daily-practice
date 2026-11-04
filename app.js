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
  function renderToday() {
    const current = day();
    const minutes = current.activities.reduce((total, activity) => total + (Number(activity.minutes) || 0), 0);
    const movieTarget = Number(state.settings.movieTarget) || 100;
    const movieProgress = Math.min(100, Math.round(sum('movieViews') / movieTarget * 100));
    const activityRows = current.activities.length ? current.activities.map(activity => `
      <div class="activity-row"><span><b>${esc(activity.title)}</b><br><small>${esc(activity.time || '')}</small></span><span><small>${Number(activity.minutes) || 0} 分钟</small> <button class="delete-activity" data-action="delete-activity" data-id="${esc(activity.id)}" aria-label="删除记录">×</button></span></div>`).join('') : '<div class="empty-state">完成一项工作后，在这里记下来。</div>';
    document.getElementById('view-today').innerHTML = `
      <div class="page-intro"><div class="date-line">${todayLabel()} · 今日一页</div><h1 id="today-title">慢慢来，日日有功。</h1><p class="muted">把读过、背过、做过的事，留下一点痕迹。</p></div>
      <section class="hero-card"><div class="hero-top"><div><span class="eyebrow">TODAY'S PRACTICE</span><div class="hero-title">今日修习</div><p class="hero-sub">一日一页，积少成多</p></div><span aria-hidden="true" style="font:24px 'Noto Serif SC';color:#c7b589">☼</span></div>
        <div class="hero-metrics"><div class="hero-metric"><strong>${current.daoCount + current.xinCount}</strong><span>今日背诵遍数</span></div><div class="hero-metric"><strong>${current.readings.length}</strong><span>今日阅读记录</span></div><div class="hero-metric"><strong>${minutes}</strong><span>工作分钟</span></div></div></section>
      <div class="section-heading"><h2>今日进度</h2><span class="aside">所有记录仅保存在本机</span></div>
      <div class="quick-grid"><article class="quick-card"><div class="label"><span>▤</span>经典阅读</div><div class="num">${current.readings.length}<span style="font-size:12px;font-weight:400"> 项</span></div><div class="caption">${esc(dayReadLabel(current))}</div></article><article class="quick-card"><div class="label"><span>◎</span>背诵</div><div class="num accent">${current.daoCount + current.xinCount}<span style="font-size:12px;font-weight:400"> 遍</span></div><div class="caption">《道德经》${current.daoCount} · 《心经》${current.xinCount}</div></article></div>
      <article class="card movie-card"><div class="movie-head"><div><strong>${esc(state.settings.movieTitle || '英语电影')}</strong><small>英语电影 · 100 遍计划</small></div><button class="button small ghost" data-route="read">去读经典</button></div><div class="progress-track"><div class="progress-fill" style="width:${movieProgress}%"></div></div><div class="movie-foot"><span class="movie-count">累计 ${sum('movieViews')} / ${movieTarget} 遍</span><button class="button small secondary" data-action="movie">看完一遍 +1</button></div></article>
      <div class="section-heading"><h2>其他工作</h2><span class="aside">今天 · ${minutes} 分钟</span></div>
      <article class="card activity-card"><div class="activity-form"><input id="activity-title" class="field" maxlength="60" placeholder="做了什么？" aria-label="工作内容"><input id="activity-minutes" class="field" type="number" min="0" max="1440" inputmode="numeric" placeholder="分钟" aria-label="用时分钟"><button class="button primary" data-action="add-activity">记一笔</button></div><div class="activity-list">${activityRows}</div></article>
      <p class="quote">“合抱之木，生于毫末；九层之台，起于累土。”<br><b>——《道德经·第六十四章》</b></p>`;
  }
  function daoReader() {
    const chapter = window.DAO_DE_JING.chapters[chapterNumber - 1];
    const done = day().readings.includes(`dao:${chapterNumber}`);
    const chips = window.DAO_DE_JING.chapters.map(item => `<button class="chapter-chip ${item.number === chapterNumber ? 'active' : ''} ${day().readings.includes(`dao:${item.number}`) ? 'done' : ''}" data-action="chapter" data-number="${item.number}" aria-label="第${item.number}章 ${esc(item.title)}">${String(item.number).padStart(2, '0')}</button>`).join('');
    return `<div class="chapter-list" aria-label="选择章节">${chips}</div><article class="card reading-panel"><div class="reading-meta">《道德经》 · 第 ${String(chapter.number).padStart(2, '0')} 章</div><h2 class="reading-title">${esc(chapter.title)}</h2><div class="classic-text">${esc(chapter.text)}</div><div class="annotation"><b>白话导读</b><br>${esc(chapter.note)}</div><div class="reading-actions"><button class="button ghost small" data-action="prev-chapter" ${chapterNumber === 1 ? 'disabled' : ''}>上一章</button><button class="button ${done ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="dao:${chapterNumber}">${done ? '今日已读 ✓' : '标记今日读过'}</button><button class="button ghost small" data-action="next-chapter" ${chapterNumber === 81 ? 'disabled' : ''}>下一章</button></div></article>`;
  }
  function heartReader() {
    return `<div class="card reading-panel"><div class="reading-meta">唐 · 玄奘译</div><h2 class="reading-title">般若波罗蜜多心经</h2><div class="heart-sections">${HEART.map(segment => `<article class="heart-section"><h3>${esc(segment.title)}</h3><p>${esc(segment.text)}</p><small><b>读后提示</b>　${esc(segment.note)}</small></article>`).join('')}</div><div class="reading-actions"><span class="muted" style="align-self:center">版本来源：维基文库</span><button class="button ${day().readings.includes('heart') ? 'secondary' : 'primary'} small" data-action="mark-read" data-key="heart">${day().readings.includes('heart') ? '今日已读 ✓' : '标记今日读过'}</button></div></div>`;
  }
  function renderRead() {
    document.getElementById('view-read').innerHTML = `<div class="page-intro"><span class="eyebrow">READING</span><h1 id="read-title">读一章，也很好。</h1><p class="muted">原文与白话导读放在一起，按自己的节奏慢慢读。</p></div><div class="switcher"><button class="pill ${readingBook === 'dao' ? 'active' : ''}" data-action="book" data-book="dao">《道德经》 · 八十一章</button><button class="pill ${readingBook === 'heart' ? 'active' : ''}" data-action="book" data-book="heart">《心经》</button></div>${readingBook === 'dao' ? daoReader() : heartReader()}<p class="source-note">《道德经》原文采用维基文库《道德经（王弼本）》并转换为简体；章名与白话导读为本工具整理，供个人阅读参考。<br>《心经》采用玄奘译本，白话提示为本工具整理。<br><a href="https://zh.wikisource.org/zh-hans/道德经_(王弼本)" target="_blank" rel="noreferrer">查看《道德经》来源</a> · <a href="https://zh.wikisource.org/zh-hans/般若波罗蜜多心经_(玄奘)" target="_blank" rel="noreferrer">查看《心经》来源</a></p>`;
  }
  function renderRecite() {
    const current = day();
    document.getElementById('view-recite').innerHTML = `<div class="recite-intro"><span class="eyebrow">RECITATION</span><h1 id="recite-title">背诵，点一下记一次。</h1><p class="muted">每完成一遍，轻触对应按钮。当天次数和累计次数会分别保存。</p></div>
      <article class="card recite-card" data-seal="道"><div class="recite-top"><h2>《道德经》</h2><span class="recite-total">累计 ${sum('daoCount')} 遍</span></div><div class="recite-count"><strong>${current.daoCount}</strong><span>遍 · 今天</span></div><button class="tap-button" data-action="count" data-key="daoCount">完成一遍《道德经》　＋</button><div class="tap-actions"><small>点按一次，计数加一</small><button class="text-button" data-action="undo" data-key="daoCount">撤销一次</button></div></article>
      <article class="card recite-card" data-seal="心"><div class="recite-top"><h2>《心经》</h2><span class="recite-total">累计 ${sum('xinCount')} 遍</span></div><div class="recite-count"><strong>${current.xinCount}</strong><span>遍 · 今天</span></div><button class="tap-button cinnabar" data-action="count" data-key="xinCount">完成一遍《心经》　＋</button><div class="tap-actions"><small>点按一次，计数加一</small><button class="text-button" data-action="undo" data-key="xinCount">撤销一次</button></div></article>
      <button class="button secondary" data-route="read" style="width:100%;margin-top:3px">去阅读原文与导读　→</button>`;
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
    document.getElementById('view-stats').innerHTML = `<div class="page-intro"><span class="eyebrow">YOUR PRACTICE</span><h1 id="stats-title">日积月累，看得见。</h1><p class="muted">这一周的小小记录，都算数。</p></div><div class="stats-overview"><div class="stat-box"><strong>${sum('daoCount')}</strong><span>道德经累计遍数</span></div><div class="stat-box"><strong>${sum('xinCount')}</strong><span>心经累计遍数</span></div><div class="stat-box"><strong>${sum('movieViews')}<small style="font-size:11px;color:var(--muted)">/${Number(state.settings.movieTarget)||100}</small></strong><span>电影累计遍数</span></div></div>
      <article class="card chart-card"><div class="section-heading" style="margin:0"><h2>近 7 日修习</h2><span class="aside">${activeDays} 天有记录 · 阅读 ${allReads} 项</span></div><div class="chart">${dates.map((date,index)=>`<div class="chart-day ${date===localDate()?'today':''}"><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(4,values[index]/max*92)}px"></div></div><span>${date.slice(5).replace('-','/')}</span></div>`).join('')}</div><p class="muted" style="font-size:10px;margin:9px 0 0">柱高汇总当天背诵、电影、阅读和工作记录数量。</p></article>
      <div class="section-heading"><h2>每日记录</h2><span class="aside">最近 7 天</span></div><article class="card" style="padding:0 13px"><div class="history-list">${history}</div></article>
      <div class="section-heading"><h2>累计进度</h2><span class="aside">可在设置中备份数据</span></div><article class="card activity-card"><div class="movie-head"><div><strong>${esc(state.settings.movieTitle || '英语电影')}</strong><small>${sum('movieViews')} 遍 / ${Number(state.settings.movieTarget)||100} 遍</small></div><span class="eyebrow">${Math.min(100,Math.round(sum('movieViews')/(Number(state.settings.movieTarget)||100)*100))}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,Math.round(sum('movieViews')/(Number(state.settings.movieTarget)||100)*100))}%"></div></div></article>`;
  }
  function render() {
    renderToday(); renderRead(); renderRecite(); renderStats();
  }

  document.addEventListener('click', event => {
    const routeButton=event.target.closest('[data-route]');
    if (routeButton) { routeTo(routeButton.dataset.route); return; }
    const button=event.target.closest('[data-action]'); if (!button) return;
    const action=button.dataset.action;
    if (action === 'book') { readingBook=button.dataset.book; renderRead(); }
    if (action === 'chapter') { chapterNumber=Number(button.dataset.number); renderRead(); }
    if (action === 'prev-chapter' && chapterNumber>1) { chapterNumber--; renderRead(); }
    if (action === 'next-chapter' && chapterNumber<81) { chapterNumber++; renderRead(); }
    if (action === 'mark-read') {
      const key=button.dataset.key; const reads=day().readings; const index=reads.indexOf(key);
      if (index >= 0) { reads.splice(index,1); showToast('已取消今日阅读记录'); } else { reads.push(key); showToast('已记下今天读过'); }
      saveState(); render();
    }
    if (action === 'count') { const item=day(); item[button.dataset.key]++; saveState(); if (navigator.vibrate) navigator.vibrate(12); render(); }
    if (action === 'undo') { const item=day(); const key=button.dataset.key; if(item[key]>0){item[key]--;saveState();render();showToast('已撤销一次');} }
    if (action === 'movie') { day().movieViews++; saveState(); render(); showToast('已记录：电影看完一遍'); }
    if (action === 'add-activity') {
      const titleInput=document.getElementById('activity-title'); const minutesInput=document.getElementById('activity-minutes');
      const title=titleInput.value.trim(); if(!title){titleInput.focus();showToast('先写下完成了什么');return;}
      day().activities.unshift({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),title,minutes:Math.max(0,Number(minutesInput.value)||0),time:new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date())});
      saveState(); render(); showToast('已记下今天的工作');
    }
    if (action === 'delete-activity') { const id=button.dataset.id; day().activities=day().activities.filter(item=>item.id!==id); saveState(); render(); }
  });

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
  window.addEventListener('hashchange',()=>{const target=location.hash.slice(1);if(['today','read','recite','stats'].includes(target))routeTo(target);});
  const initial=location.hash.slice(1); if(['today','read','recite','stats'].includes(initial))route=initial;
  routeTo(route);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
})();
