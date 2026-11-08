/* 读诵时长汇总。只接受有限、非负、可精确表示的毫秒；缺字段、非法值记 0，不估算。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TimeStats = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX = Number.MAX_SAFE_INTEGER;
  const BLOCKED_IDS = new Set(['__proto__', 'prototype', 'constructor']);

  function finiteMs(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > MAX) return 0;
    return Math.floor(value);
  }

  function formatSeconds(seconds) {
    const safe = Number.isInteger(seconds) && seconds > 0 ? seconds : 0;
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const sec = safe % 60;
    if (h > 0) return `${h}小时${String(m).padStart(2, '0')}分${String(sec).padStart(2, '0')}秒`;
    return `${m}分${String(sec).padStart(2, '0')}秒`;
  }

  function formatDuration(ms) {
    return formatSeconds(Math.floor(finiteMs(ms) / 1000));
  }

  function isBookId(id) {
    return typeof id === 'string' && id.length >= 1 && id.length <= 32 && !BLOCKED_IDS.has(id) && /^[\w\u4e00-\u9fff.-]+$/.test(id);
  }

  function bookName(book) {
    const name = book && book.name != null ? String(book.name).trim() : '';
    return name || (book && book.id != null ? String(book.id) : '');
  }

  function aggregateBookTimes(days, books) {
    const list = (Array.isArray(books) ? books : []).filter(book => book && isBookId(String(book.id))).map(book => ({
      id: String(book.id),
      name: bookName(book) || String(book.id),
      ms: 0
    }));
    if (!days || typeof days !== 'object') return list;
    for (const date of Object.keys(days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const entry = days[date];
      if (!entry || typeof entry !== 'object') continue;
      const reading = entry.readingMs;
      if (!reading || typeof reading !== 'object' || Array.isArray(reading)) continue;
      for (const row of list) {
        const next = row.ms + finiteMs(reading[row.id]);
        if (next <= MAX) row.ms = next;
      }
    }
    return list;
  }

  /* 目录顺序在前；历史记录里多出来的书键追加在后，便于超过三本时不用改图。 */
  function discoverBooks(days, catalog) {
    const base = [];
    const seen = new Set();
    (Array.isArray(catalog) ? catalog : []).forEach(book => {
      if (!book || !isBookId(String(book.id)) || seen.has(String(book.id))) return;
      seen.add(String(book.id));
      base.push({ id: String(book.id), name: bookName(book) || String(book.id) });
    });
    const extras = [];
    if (days && typeof days === 'object') {
      for (const date of Object.keys(days)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const entry = days[date];
        const reading = entry && entry.readingMs;
        if (!reading || typeof reading !== 'object' || Array.isArray(reading)) continue;
        for (const key of Object.keys(reading)) {
          if (seen.has(key) || !isBookId(key) || finiteMs(reading[key]) <= 0) continue;
          seen.add(key);
          extras.push(key);
        }
      }
    }
    extras.sort((a, b) => a.localeCompare(b, 'zh'));
    return base.concat(extras.map(id => ({ id, name: id })));
  }

  function percentLabel(ms, tenth) {
    if (ms > 0 && tenth === 0) return '不足0.1%';
    return (tenth / 10).toFixed(1) + '%';
  }

  /* 占比精确到 0.1%，用最大余额法保证合计 100.0%。弧长仍按原始毫秒，不按取整后的百分比。 */
  function allocateTenths(items, total) {
    const tenths = items.map(row => Math.floor((row.ms * 1000) / total));
    let remain = 1000 - tenths.reduce((sum, value) => sum + value, 0);
    if (remain < 0 || remain > items.length) return tenths.map(() => 0);
    const order = items.map((row, index) => ({
      index,
      rem: (row.ms * 1000) % total,
      ms: row.ms
    })).sort((a, b) => (b.rem - a.rem) || (b.ms - a.ms) || (a.index - b.index));
    for (let i = 0; i < remain; i++) tenths[order[i].index] += 1;
    return tenths;
  }

  /* 各书显示到秒，并把不足 1 秒的余数分给余数最大的书，使列表秒数之和等于总秒数。 */
  function allocateSeconds(rows) {
    const parts = (Array.isArray(rows) ? rows : []).map(row => {
      const ms = finiteMs(row && row.ms);
      return { seconds: Math.floor(ms / 1000), rest: ms % 1000, ms };
    });
    const totalMs = parts.reduce((sum, part) => sum + part.ms, 0);
    const totalSeconds = Math.floor(totalMs / 1000);
    let remain = totalSeconds - parts.reduce((sum, part) => sum + part.seconds, 0);
    if (remain < 0 || remain > parts.length) remain = 0;
    const order = parts.map((part, index) => ({ index, rest: part.rest, ms: part.ms }))
      .sort((a, b) => (b.rest - a.rest) || (b.ms - a.ms) || (a.index - b.index));
    for (let i = 0; i < remain; i++) parts[order[i].index].seconds += 1;
    return { totalSeconds, seconds: parts.map(part => part.seconds) };
  }

  function buildTimeDistribution(rows, options) {
    const requested = Number(options && options.otherBelow);
    const otherBelow = Number.isFinite(requested) && requested > 0 && requested < 0.5 ? requested : 0.04;
    const items = (Array.isArray(rows) ? rows : []).filter(row => row && isBookId(String(row.id))).map(row => ({
      id: String(row.id),
      name: bookName(row) || String(row.id),
      ms: finiteMs(row.ms)
    }));
    const total = items.reduce((sum, row) => sum + row.ms, 0);
    if (total <= 0) {
      return {
        total: 0,
        empty: true,
        items: items.map(row => ({ ...row, tenth: 0, percentLabel: '—', merged: false })),
        slices: []
      };
    }
    const tenths = allocateTenths(items, total);
    const labeled = items.map((row, index) => ({
      ...row,
      tenth: tenths[index],
      percentLabel: percentLabel(row.ms, tenths[index]),
      merged: false
    }));
    const positive = labeled.filter(row => row.ms > 0);
    const anyLarge = positive.some(row => row.ms / total >= otherBelow);
    const named = [];
    const other = [];
    positive.forEach(row => {
      if (anyLarge && row.ms / total < otherBelow) {
        row.merged = true;
        other.push(row);
      } else named.push(row);
    });
    const slices = named.map(row => ({
      id: row.id,
      name: row.name,
      ms: row.ms,
      tenth: row.tenth,
      percentLabel: row.percentLabel
    }));
    if (other.length) {
      const ms = other.reduce((sum, row) => sum + row.ms, 0);
      const tenth = other.reduce((sum, row) => sum + row.tenth, 0);
      slices.push({
        id: 'other',
        name: '其他',
        ms,
        tenth,
        percentLabel: percentLabel(ms, tenth),
        otherIds: other.map(row => row.id)
      });
    }
    return { total, empty: false, items: labeled, slices };
  }

  return {
    finiteMs,
    formatSeconds,
    formatDuration,
    isBookId,
    aggregateBookTimes,
    discoverBooks,
    allocateSeconds,
    buildTimeDistribution
  };
});
