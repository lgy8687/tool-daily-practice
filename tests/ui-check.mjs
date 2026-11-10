import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = (() => {
  try { return require('puppeteer-core'); }
  catch { return require('/tmp/ui-deps/node_modules/puppeteer-core'); }
})();

const ROOT = '/workspace';
const OUT = '/opt/cursor/artifacts';
const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const CHROME = '/usr/bin/google-chrome';
const PROFILE = '/tmp/rikey-ui-profile';

function parseDuration(text) {
  const source = String(text || '');
  const h = /(\d+)小时/.exec(source);
  const m = /(\d+)分/.exec(source);
  const s = /(\d+)秒/.exec(source);
  if (!h && !m && !s) return null;
  return (h ? Number(h[1]) : 0) * 3600 + (m ? Number(m[1]) : 0) * 60 + (s ? Number(s[1]) : 0);
}

function parsePercent(text) {
  const source = String(text || '').trim();
  if (source === '—' || source === '不足0.1%') return 0;
  const match = /^(\d+(?:\.\d+)?)%$/.exec(source);
  if (!match) throw new Error(`无法解析占比：${source}`);
  return Math.round(Number(match[1]) * 10);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(BASE, { cache: 'no-store' });
      if (response.ok) return;
    } catch (error) { /* 端口尚未就绪 */ }
    await delay(100);
  }
  throw new Error('本地页面没有启动');
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('screenshot', file);
  return file;
}

async function open(browser, viewport, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.setCacheEnabled(false);
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#view-today .practice-card');
  return { page, errors };
}

async function practiceKey(page) {
  return page.evaluate(() => localStorage.getItem('rikey.practice.v1'));
}

const viewportPhone = { width: 390, height: 844, deviceScaleFactor: 2 };
const viewportDesk = { width: 1280, height: 900, deviceScaleFactor: 1 };

await rm(PROFILE, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore'
});
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  userDataDir: PROFILE,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

try {
  await waitForServer();

  const emptyPhone = await open(browser, viewportPhone, BASE);
  assert(await practiceKey(emptyPhone.page) === null, '空页面不应写入修习记录');
  const homeText = await emptyPhone.page.$eval('#view-today', node => node.innerText);
  assert(homeText.includes('总时间'), '首页应显示总时间');
  assert(!homeText.includes('今日时长'), '首页不应再写今日时长');
  assert((homeText.match(/0分00秒/g) || []).length >= 3, '零记录三张卡片都应是 0分00秒');
  assert(!(await emptyPhone.page.$('#fixture-banner')), '真实空数据不应出现测试数据条');
  const overflow = await emptyPhone.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `390px 首页横向溢出 ${overflow}`);
  await shot(emptyPhone.page, 'home-390.png');

  await emptyPhone.page.click('[data-route="stats"]');
  await emptyPhone.page.waitForSelector('#time-dist .donut');
  const emptyStats = await emptyPhone.page.evaluate(() => {
    const svg = document.querySelector('#time-dist svg');
    const circles = [...svg.querySelectorAll('circle')];
    return {
      segmented: !!document.querySelector('#view-stats .segmented'),
      rows: document.querySelectorAll('.time-list button').length,
      percents: [...document.querySelectorAll('.time-pct')].map(node => node.textContent),
      empty: document.querySelector('.time-empty')?.textContent || '',
      circles: circles.map(node => ({ stroke: node.getAttribute('stroke'), dash: node.getAttribute('stroke-dasharray') })),
      center: document.querySelector('.donut-center')?.innerText || '',
      picker: !!document.querySelector('#stats-book-select'),
      streak: !!document.querySelector('.streak-card'),
      kinds: [...document.querySelectorAll('.time-name small')].map(node => node.textContent)
    };
  });
  assert(!emptyStats.segmented, '统计页不应再有横排书名切换');
  assert(!emptyStats.picker, '总览不应再用下拉框选书');
  assert(!emptyStats.streak, '总览不应摊开单本大卡');
  assert(emptyStats.rows === 3, '空数据仍列出三本书');
  assert(emptyStats.kinds.includes('一篇') && emptyStats.kinds.some(item => item.includes('81 章')) && emptyStats.kinds.some(item => item.includes('20 首')), `单篇和多篇应能区分：${emptyStats.kinds}`);
  assert(emptyStats.percents.every(item => item === '—'), '没有时长时不显示假比例');
  assert(emptyStats.empty.includes('还没有读诵时长'), '空状态应有说明');
  assert(emptyStats.circles.length === 1 && !emptyStats.circles[0].dash, '空状态应是中性整环，不画扇区');
  assert(emptyStats.center.includes('0分00秒') && emptyStats.center.includes('总时间'), '环心应是总时间 0分00秒');
  await shot(emptyPhone.page, 'stats-empty-390.png');
  await emptyPhone.page.click('.time-list button[data-book="heart"]');
  await emptyPhone.page.waitForSelector('[data-kind="single"]');
  const singleStats = await emptyPhone.page.evaluate(() => ({
    pieces: document.querySelectorAll('.piece-row').length,
    text: document.querySelector('.stats-kind')?.textContent || '',
    focus: document.querySelector('#heat-focus')?.textContent || ''
  }));
  assert(singleStats.pieces === 0, '单篇统计不应展开篇目');
  assert(singleStats.text.includes('只有一篇'), singleStats.text);
  assert(singleStats.focus.startsWith('已选'), '进入单篇后热力图应显示日期');
  await shot(emptyPhone.page, 'stats-heart-390.png');
  await emptyPhone.page.click('[data-action="close-book-stats"]');
  await emptyPhone.page.waitForSelector('#time-dist');
  await emptyPhone.page.click('.time-list button[data-book="dao"]');
  await emptyPhone.page.waitForSelector('[data-kind="collection"] .piece-row');
  const daoStats = await emptyPhone.page.evaluate(() => ({
    rows: document.querySelectorAll('.piece-row').length,
    text: document.querySelector('#view-stats')?.innerText || '',
    fakeTime: [...document.querySelectorAll('.piece-row')].some(node => node.innerText.includes('0分'))
  }));
  assert(daoStats.rows === 81, `道德经应列出 81 章，实际 ${daoStats.rows}`);
  assert(daoStats.text.includes('道可道') && daoStats.text.includes('整本书'), daoStats.text.slice(0, 180));
  assert(!daoStats.fakeTime, '没有按篇保存的时长，不应显示成 0 秒');
  await shot(emptyPhone.page, 'stats-dao-390.png');
  await emptyPhone.page.click('[data-action="close-book-stats"]');

  await emptyPhone.page.click('[data-route="today"]');
  await emptyPhone.page.waitForSelector('#view-today.view.active .practice-open');
  await emptyPhone.page.click('.practice-open[data-book="heart"]');
  await emptyPhone.page.waitForSelector('.recite-header');
  const header = await emptyPhone.page.evaluate(() => {
    const timer = document.querySelector('#reading-timer')?.textContent || '';
    const headerBottom = document.querySelector('.recite-header')?.getBoundingClientRect().bottom || 0;
    const buttons = [...document.querySelectorAll('.read-tools button')].map(node => ({
      text: node.textContent.trim(),
      label: node.getAttribute('aria-label'),
      box: node.getBoundingClientRect().toJSON(),
      hidden: node.offsetParent === null
    }));
    const back = document.querySelector('.back-button')?.getBoundingClientRect().toJSON();
    return { timer, buttons, back, headerBottom, title: document.querySelector('#recite-title')?.textContent || '', settings: !!document.querySelector('.read-settings-button') };
  });
  assert(header.title.includes('心经'), '阅读标题应保留');
  assert(header.timer.startsWith('今日'), `阅读顶部计时应保持今日语义：${header.timer}`);
  assert(!header.timer.includes('总时间'), '阅读顶部不要改成总时间');
  assert(!header.settings, '字号和排版不应再收进阅读设置');
  const visible = header.buttons.filter(button => !button.hidden);
  assert(visible.some(button => button.text.includes('拼音')), '拼音应能直接切换');
  assert(visible.some(button => button.text.includes('A−')) && visible.some(button => button.text.includes('A＋')), '字号应直接可见');
  assert(visible.some(button => button.text === '排版'), '排版应直接可见');
  visible.forEach(button => {
    assert(button.box.top >= header.headerBottom, `${button.text} 仍贴在标题下`);
    assert(button.box.width >= 32 && button.box.height >= 32 && button.box.height <= 36, `${button.text} 尺寸不合适 ${button.box.width}x${button.box.height}`);
    assert(button.label || button.text, `${button.text} 缺少可访问名称`);
  });
  assert(header.back.width >= 40 && header.back.height >= 40, '返回按钮触控区域过小');
  await shot(emptyPhone.page, 'read-header-390.png');

  const fontBefore = await emptyPhone.page.$eval('#font-size-label', node => node.textContent);
  await emptyPhone.page.click('[data-action="font-larger"]');
  const fontAfter = await emptyPhone.page.$eval('#font-size-label', node => node.textContent);
  const textSize = await emptyPhone.page.$eval('.recitation-screen', node => getComputedStyle(node).getPropertyValue('--text-size').trim());
  assert(Number(fontAfter) === Number(fontBefore) + 1, '放大字体应改变字号');
  assert(textSize === `${fontAfter}px`, '字号应写到正文');
  await emptyPhone.page.click('[data-action="font-smaller"]');
  await shot(emptyPhone.page, 'read-tools-390.png');
  await emptyPhone.page.click('.settings-edit');
  await emptyPhone.page.waitForSelector('.editing-layout .layout-toolbar');
  const editing = await emptyPhone.page.evaluate(() => ({
    toolbar: document.querySelector('.layout-toolbar')?.innerText || '',
    done: document.querySelector('.layout-done')?.offsetParent !== null,
    labels: [...document.querySelectorAll('.layout-toolbar button')].map(node => node.getAttribute('aria-label'))
  }));
  assert(editing.done, '编辑排版后应能完成');
  ['加粗', '斜体', '下划线', '左对齐', '居中'].forEach(label => assert(editing.labels.includes(label), `缺少排版操作 ${label}`));
  assert(editing.toolbar.includes('恢复默认'), '应保留恢复默认');
  await emptyPhone.page.click('.layout-done');
  await emptyPhone.page.click('[data-action="back-recitation"]');

  const desk = await open(browser, viewportDesk, BASE);
  await shot(desk.page, 'home-desktop.png');
  await desk.page.click('[data-route="stats"]');
  await desk.page.waitForSelector('#time-dist .donut');
  const deskOverflow = await desk.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(deskOverflow <= 1, `桌面统计页横向溢出 ${deskOverflow}`);
  await shot(desk.page, 'stats-empty-desktop.png');
  await desk.page.click('[data-route="today"]');
  await desk.page.waitForSelector('#view-today.view.active .practice-open');
  await desk.page.click('.practice-open[data-book="dao"]');
  await desk.page.waitForSelector('#reading-timer');
  await shot(desk.page, 'read-header-desktop.png');
  await desk.page.close();

  const sample = await open(browser, viewportPhone, `${BASE}?fixture=sample`);
  assert(await sample.page.$('#fixture-banner'), '非零模拟页应标明测试数据');
  const banner = await sample.page.$eval('#fixture-banner', node => node.textContent);
  assert(banner.includes('测试数据') && banner.includes('不会写入'), banner);
  await shot(sample.page, 'home-sample-390.png');
  const homeTimes = await sample.page.$$eval('.practice-time', nodes => nodes.map(node => node.textContent));
  assert(homeTimes[0].includes('1小时05分03秒'), `心经总时间不对：${homeTimes[0]}`);
  assert(homeTimes[1].includes('26分00秒'), `道德经总时间不对：${homeTimes[1]}`);
  assert(homeTimes[2].includes('0分40秒'), `曹操诗总时间不对：${homeTimes[2]}`);
  await sample.page.click('[data-route="stats"]');
  await sample.page.waitForSelector('.time-list button');
  const sampleStats = await sample.page.evaluate(() => ({
    durs: [...document.querySelectorAll('.time-dur')].map(node => node.textContent),
    pcts: [...document.querySelectorAll('.time-pct')].map(node => node.textContent),
    center: document.querySelector('.donut-center')?.innerText || '',
    arcs: document.querySelectorAll('#time-dist svg circle').length,
    names: [...document.querySelectorAll('.time-name')].map(node => node.innerText),
    banner: !!document.querySelector('#fixture-banner')
  }));
  assert(sampleStats.banner, '统计环图模拟截图应带测试数据标记');
  assert(sampleStats.arcs >= 2, '非零数据应画出扇区');
  const listSeconds = sampleStats.durs.map(parseDuration);
  const centerSeconds = parseDuration(sampleStats.center);
  assert(listSeconds.reduce((sum, value) => sum + value, 0) === centerSeconds, `列表 ${listSeconds} 与环心 ${centerSeconds} 不一致`);
  assert(homeTimes.map(parseDuration).join() === listSeconds.join(), '首页总时间应与统计列表一致');
  assert(sampleStats.pcts.reduce((sum, value) => sum + parsePercent(value), 0) === 1000, `占比合计不是 100%：${sampleStats.pcts}`);
  assert(sampleStats.names.some(name => name.includes('并入其他')), '小占比应在明细里说明并入其他');
  await shot(sample.page, 'stats-sample-390.png');
  await sample.page.click('.time-list button[data-book="cao"]');
  await sample.page.waitForSelector('[data-kind="collection"] .piece-copy b');
  const caoPieces = await sample.page.$$eval('.piece-copy b', nodes => nodes.slice(0, 3).map(node => node.textContent));
  assert(caoPieces.includes('短歌行'), `多篇诗集应显示诗名：${caoPieces}`);
  const daoRead = await sample.page.evaluate(async () => {
    document.querySelector('[data-action="close-book-stats"]').click();
    return true;
  });
  assert(daoRead);
  await sample.page.waitForSelector('.time-list button[data-book="dao"]');
  await sample.page.click('.time-list button[data-book="dao"]');
  await sample.page.waitForSelector('.piece-row');
  const readLine = await sample.page.evaluate(() => {
    const row = [...document.querySelectorAll('.piece-row')].find(node => node.innerText.includes('道可道'));
    return { summary: document.querySelector('.piece-card .card-head span')?.textContent || '', row: row?.innerText || '' };
  });
  assert(readLine.summary.includes('读过') && readLine.row.includes('读过 1 天'), JSON.stringify(readLine));
  const storedDuringSample = await practiceKey(sample.page);
  assert(storedDuringSample === null, '测试夹具不应写入修习记录');
  await sample.page.close();

  const many = await open(browser, viewportPhone, `${BASE}?fixture=books10`);
  await many.page.click('[data-route="stats"]');
  await many.page.waitForSelector('.time-list');
  const manyStats = await many.page.evaluate(() => ({
    rows: [...document.querySelectorAll('.time-list button')].map(node => node.innerText.replace(/\s+/g, ' ')),
    picker: !!document.querySelector('#stats-book-select'),
    find: !!document.querySelector('#book-find'),
    segmented: !!document.querySelector('#view-stats .segmented'),
    otherArc: !!document.querySelector('#time-dist svg circle[stroke="#C5D5C9"]'),
    pcts: [...document.querySelectorAll('.time-pct')].map(node => node.textContent),
    durs: [...document.querySelectorAll('.time-dur')].map(node => node.textContent),
    center: document.querySelector('.donut-center')?.innerText || ''
  }));
  assert(manyStats.rows.length === 10, `十本书应有 10 行，实际 ${manyStats.rows.length}`);
  assert(!manyStats.picker, '十本书不应做成下拉大卡');
  assert(manyStats.find, '书多时应能按书名查找');
  assert(!manyStats.segmented, '十本书不应退回横排切换');
  assert(manyStats.otherArc, '小占比应合并为其他扇区');
  assert(manyStats.pcts.reduce((sum, value) => sum + parsePercent(value), 0) === 1000, `十书占比合计异常 ${manyStats.pcts}`);
  assert(manyStats.durs.map(parseDuration).reduce((sum, value) => sum + value, 0) === parseDuration(manyStats.center), '十书列表与总时间不一致');
  await shot(many.page, 'stats-books10-390.png');
  await many.page.type('#book-find', '论语');
  await many.page.waitForFunction(() => [...document.querySelectorAll('.time-list > li')].filter(item => !item.hidden).length === 1);
  await many.page.click('.time-list button[data-book="论语"]');
  await many.page.waitForSelector('[data-kind="record"]');
  const extraTitle = await many.page.$eval('#stats-title', node => node.textContent);
  assert(extraTitle.includes('论语'), extraTitle);
  await many.page.close();

  const gaps = await open(browser, viewportPhone, `${BASE}?fixture=gaps`);
  await gaps.page.click('[data-route="stats"]');
  await gaps.page.waitForSelector('.time-dur');
  const gapText = await gaps.page.$eval('#time-dist', node => node.innerText);
  assert(gapText.includes('0分40秒'), `缺字段夹具应只保留可确认的 40 秒：${gapText}`);
  assert(!gapText.includes('NaN') && !gapText.includes('999') && !gapText.includes('5000'), `缺字段被错误计入：${gapText}`);
  assert(await practiceKey(gaps.page) === null, '缺字段夹具不应写记录');
  await gaps.page.close();

  const read = await open(browser, viewportPhone, `${BASE}?fixture=empty`);
  const beforeKey = await practiceKey(read.page);
  await read.page.click('.practice-open[data-book="dao"]');
  await read.page.waitForSelector('ruby');
  const rubyCheck = await read.page.evaluate(() => {
    const host = document.querySelector('.recitation-text');
    const rubies = [...host.querySelectorAll('ruby')];
    const hostBox = host.getBoundingClientRect();
    return {
      count: host.querySelectorAll('ruby').length,
      overflow: host.scrollWidth - host.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      items: rubies.map(ruby => {
        const rt = ruby.querySelector('rt');
        const rb = ruby.querySelector('rb');
        const base = rb.getBoundingClientRect();
        const note = rt.getBoundingClientRect();
        const mid = note.x + note.width / 2;
        return {
          text: rb.textContent + rt.textContent,
          base: { x: base.x, y: base.y, w: base.width, h: base.height },
          note: { x: note.x, y: note.y, w: note.width, h: note.height },
          inside: mid >= base.x - 8 && mid <= base.x + base.width + 8 && note.bottom <= base.top + 4
        };
      }),
      hostTop: hostBox.top
    };
  });
  assert(rubyCheck.count > 0, '道德经应能标出拼音');
  assert(rubyCheck.overflow <= 1, `注音正文横向溢出 ${rubyCheck.overflow}`);
  assert(rubyCheck.pageOverflow <= 1, `390px 阅读页横向溢出 ${rubyCheck.pageOverflow}`);
  const broken = rubyCheck.items.filter(item => !item.inside);
  assert(broken.length === 0, `拼音没有跟汉字成组：${JSON.stringify(broken.slice(0, 3))}`);
  await shot(read.page, 'pinyin-390.png');
  const pressed = await read.page.$eval('.pinyin-button', node => node.getAttribute('aria-pressed'));
  await read.page.click('.pinyin-button');
  await read.page.waitForSelector('.pinyin-button');
  const afterToggle = await read.page.evaluate(() => ({
    pressed: document.querySelector('.pinyin-button')?.getAttribute('aria-pressed'),
    rubies: document.querySelectorAll('.recitation-text ruby').length,
    timer: document.querySelector('#reading-timer')?.textContent || ''
  }));
  assert(pressed === 'true' && afterToggle.pressed === 'false', '拼音应一键关闭');
  assert(afterToggle.rubies === 0, '关闭拼音后不应残留 ruby');
  assert(afterToggle.timer.startsWith('今日'), '切换拼音不应改掉今日计时');
  await read.page.click('.pinyin-button');
  await read.page.waitForSelector('.recitation-text ruby');

  await read.page.click('[data-action="open-chapters"]');
  await read.page.waitForSelector('#chapter-dialog[open] .chapter-tile');
  const catalog = await read.page.evaluate(() => {
    const grid = document.querySelector('.chapter-grid');
    const style = getComputedStyle(grid);
    const tiles = [...grid.querySelectorAll('.chapter-tile')];
    const first = tiles[0].innerText.replace(/\s+/g, ' ');
    const width = tiles[0].getBoundingClientRect().width / grid.getBoundingClientRect().width;
    return { display: style.display, columns: style.gridTemplateColumns, count: tiles.length, first, width, selected: grid.querySelector('[aria-current="true"]')?.innerText || '' };
  });
  assert(catalog.display === 'flex', `章节目录不应再是多列缩略图：${catalog.display}`);
  assert(catalog.count === 81, `道德经应有 81 章，实际 ${catalog.count}`);
  assert(catalog.width > 0.8, `目录行过窄，仍像多列：${catalog.width}`);
  assert(catalog.first.includes('道可道'), `开篇行丢失：${catalog.first}`);
  await shot(read.page, 'chapter-catalog-390.png');
  await read.page.click('.chapter-tile[data-number="8"]');
  await read.page.waitForFunction(() => document.querySelector('.chapter-select-trigger')?.textContent.includes('第 8 章'));

  await read.page.click('[data-action="back-recitation"]');
  await read.page.click('.practice-open[data-book="cao"]');
  await read.page.waitForSelector('[data-action="open-chapters"]');
  await read.page.click('[data-action="open-chapters"]');
  await read.page.waitForSelector('#chapter-dialog[open] .chapter-name');
  const poems = await read.page.evaluate(() => [...document.querySelectorAll('.chapter-name')].slice(0, 4).map(node => node.textContent));
  assert(poems.includes('短歌行') && poems.includes('观沧海'), `曹操诗目录应显示诗名：${poems}`);
  await shot(read.page, 'poem-catalog-390.png');
  await read.page.click('.chapter-tile[data-number="2"]');
  await read.page.waitForFunction(() => document.querySelector('.chapter-select-trigger')?.textContent.includes('观沧海'));

  await read.page.click('[data-action="start-timer"]');
  await read.page.waitForSelector('.count-tap');
  const timerText = await read.page.$eval('#reading-timer', node => node.textContent);
  assert(timerText.startsWith('今日'), `开始计时后仍应是今日：${timerText}`);
  await delay(1200);
  const timerLater = await read.page.$eval('#reading-timer', node => node.textContent);
  assert(timerLater.startsWith('今日'), timerLater);
  await read.page.click('.count-tap');
  const counted = await read.page.$eval('#recite-today-count', node => node.textContent);
  assert(counted === '1', `记一遍失败：${counted}`);
  assert(await practiceKey(read.page) === null, '夹具里的计时和计数不能写入真实记录');
  assert(beforeKey === null, '测试开始前也不应有真实记录');

  await read.page.click('[data-action="back-recitation"]');
  await read.page.click('[data-route="stats"]');
  await read.page.waitForSelector('.time-list button[data-book="heart"]');
  await read.page.click('.time-list button[data-book="heart"]');
  await read.page.waitForSelector('.heat-cell:not([disabled])');
  const picked = await read.page.$eval('.heat-cell:not([disabled]):not(.is-today)', node => node.dataset.date);
  await read.page.click(`.heat-cell[data-date="${picked}"]`);
  const focus = await read.page.$eval('#heat-focus', node => node.textContent);
  const [year, month, day] = picked.split('-').map(Number);
  assert(focus.includes(`${year}年${month}月${day}日`), `热力图日期反馈不对：${focus}`);
  await read.page.evaluate(() => document.querySelector('.record-editor summary').click());
  const editor = await read.page.$$eval('.record-row span', nodes => nodes.map(node => node.textContent));
  assert(editor.includes('心经') && !editor.includes('道德经'), `进入心经后只改这一篇：${editor}`);

  const serious = [...emptyPhone.errors, ...desk.errors, ...sample.errors, ...many.errors, ...gaps.errors, ...read.errors]
    .filter(error => !/favicon|Failed to register a ServiceWorker|service worker/i.test(error));
  assert(serious.length === 0, `页面报错：${serious.join('\n')}`);
  console.log('ui-check ok');
} finally {
  await browser.close();
  server.kill();
}
