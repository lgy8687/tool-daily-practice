const test = require('node:test');
const assert = require('node:assert/strict');
const TimeStats = require('../time-stats.js');

const BOOKS = [
  { id: 'heart', name: '心经' },
  { id: 'dao', name: '道德经' },
  { id: 'cao', name: '曹操的诗' }
];

function tenthsSum(dist) {
  return dist.items.reduce((sum, item) => sum + item.tenth, 0);
}

function sliceMs(dist) {
  return dist.slices.reduce((sum, slice) => sum + slice.ms, 0);
}

test('没有记录时是空环，不编造均分占比', () => {
  const rows = TimeStats.aggregateBookTimes({}, BOOKS);
  const dist = TimeStats.buildTimeDistribution(rows);
  assert.equal(dist.empty, true);
  assert.equal(dist.total, 0);
  assert.equal(dist.slices.length, 0);
  assert.deepEqual(dist.items.map(item => item.percentLabel), ['—', '—', '—']);
  assert.deepEqual(dist.items.map(item => item.ms), [0, 0, 0]);
  const clocks = TimeStats.allocateSeconds(rows);
  assert.equal(clocks.totalSeconds, 0);
  assert.deepEqual(clocks.seconds, [0, 0, 0]);
});

test('缺字段、非法值和坏日期都记 0，不猜测时长', () => {
  const days = {
    '2026-01-01': { daoCount: 2, xinCount: 1 },
    '2026-01-02': { readingMs: null, caoCount: 1 },
    '2026-01-03': { readingMs: { heart: '5000', dao: -20, cao: NaN, '<img>': 999, __proto__: 999 } },
    '2026-01-04': { readingMs: { heart: 40000, dao: 0, cao: undefined } },
    'not-a-date': { readingMs: { heart: 999999, dao: 999999 } },
    '2026-01-05': null
  };
  const books = TimeStats.discoverBooks(days, BOOKS);
  assert.deepEqual(books.map(book => book.id), ['heart', 'dao', 'cao']);
  const rows = TimeStats.aggregateBookTimes(days, books);
  assert.deepEqual(rows.map(row => row.ms), [40000, 0, 0]);
  const dist = TimeStats.buildTimeDistribution(rows);
  assert.equal(dist.empty, false);
  assert.equal(dist.total, 40000);
  assert.equal(dist.slices.length, 1);
  assert.equal(dist.slices[0].id, 'heart');
  assert.equal(dist.slices[0].percentLabel, '100.0%');
  assert.equal(dist.items[1].percentLabel, '0.0%');
  assert.equal(dist.items[2].percentLabel, '0.0%');
});

test('非零三书：时长、占比与总时间一致', () => {
  const days = {
    '2026-11-01': { readingMs: { heart: 3600000 + 5 * 60000 + 3000, dao: 26 * 60000 } },
    '2026-11-07': { readingMs: { cao: 40000 } },
    '2025-06-01': { daoCount: 4 },
    '2025-06-02': { readingMs: { heart: null, dao: undefined } }
  };
  const rows = TimeStats.aggregateBookTimes(days, BOOKS);
  const dist = TimeStats.buildTimeDistribution(rows);
  const clocks = TimeStats.allocateSeconds(rows);
  assert.deepEqual(rows.map(row => row.ms), [3903000, 1560000, 40000]);
  assert.equal(dist.total, 3903000 + 1560000 + 40000);
  assert.equal(clocks.seconds.reduce((sum, value) => sum + value, 0), clocks.totalSeconds);
  assert.equal(TimeStats.formatSeconds(clocks.seconds[0]), '1小时05分03秒');
  assert.equal(TimeStats.formatSeconds(clocks.seconds[1]), '26分00秒');
  assert.equal(TimeStats.formatSeconds(clocks.seconds[2]), '0分40秒');
  assert.equal(TimeStats.formatSeconds(clocks.totalSeconds), '1小时31分43秒');
  assert.equal(tenthsSum(dist), 1000);
  assert.equal(sliceMs(dist), dist.total);
  assert.equal(dist.items.find(item => item.id === 'cao').merged, true);
  assert.ok(dist.slices.some(slice => slice.id === 'other'));
  const other = dist.slices.find(slice => slice.id === 'other');
  assert.equal(other.ms, 40000);
  assert.deepEqual(other.otherIds, ['cao']);
});

test('十本书可扩展，小扇区并入其他，明细仍保留每本', () => {
  const names = ['心经', '道德经', '曹操的诗', '论语', '诗经', '楚辞', '唐诗', '宋词', '古文', '小品'];
  const ids = ['heart', 'dao', 'cao', 'lunyu', 'shijing', 'chuci', 'tang', 'song', 'guwen', 'xiaopin'];
  const ms = [
    20 * 3600000,
    12 * 3600000,
    8 * 3600000,
    5 * 3600000,
    3 * 3600000,
    90 * 60000,
    40 * 60000,
    8 * 60000,
    45000,
    8000
  ];
  const readingMs = Object.fromEntries(ids.map((id, index) => [id, ms[index]]));
  const days = { '2026-03-01': { readingMs } };
  const catalog = ids.slice(0, 3).map((id, index) => ({ id, name: names[index] }));
  const books = TimeStats.discoverBooks(days, catalog);
  assert.equal(books.length, 10);
  assert.deepEqual(books.slice(0, 3).map(book => book.id), ['heart', 'dao', 'cao']);
  const rows = TimeStats.aggregateBookTimes(days, books);
  const dist = TimeStats.buildTimeDistribution(rows);
  const clocks = TimeStats.allocateSeconds(rows);
  assert.equal(dist.items.length, 10);
  assert.equal(tenthsSum(dist), 1000);
  assert.equal(sliceMs(dist), dist.total);
  assert.equal(clocks.seconds.reduce((sum, value) => sum + value, 0), clocks.totalSeconds);
  assert.equal(clocks.totalSeconds, Math.floor(dist.total / 1000));
  const other = dist.slices.find(slice => slice.id === 'other');
  assert.ok(other, '应有其他扇区');
  assert.ok(other.otherIds.length >= 2);
  other.otherIds.forEach(id => {
    const item = dist.items.find(row => row.id === id);
    assert.equal(item.merged, true);
    assert.ok(item.ms > 0);
  });
  dist.slices.filter(slice => slice.id !== 'other').forEach(slice => {
    assert.ok(slice.ms / dist.total >= 0.04);
  });
  assert.equal(dist.items.filter(item => !item.merged && item.ms > 0).length + other.otherIds.length, 10);
});

test('时间边界：0 秒、不足 1 分钟、整分、跨小时', () => {
  assert.equal(TimeStats.formatDuration(0), '0分00秒');
  assert.equal(TimeStats.formatDuration(999), '0分00秒');
  assert.equal(TimeStats.formatDuration(1000), '0分01秒');
  assert.equal(TimeStats.formatDuration(59000), '0分59秒');
  assert.equal(TimeStats.formatDuration(60000), '1分00秒');
  assert.equal(TimeStats.formatDuration(3599000), '59分59秒');
  assert.equal(TimeStats.formatDuration(3600000), '1小时00分00秒');
  assert.equal(TimeStats.formatDuration(3661000), '1小时01分01秒');
  assert.equal(TimeStats.formatDuration(-5), '0分00秒');
  assert.equal(TimeStats.formatDuration(Number.NaN), '0分00秒');
  assert.equal(TimeStats.formatDuration('3600000'), '0分00秒');
});

test('不足 1 秒的余数分摊后，列表秒数等于总秒数', () => {
  const clocks = TimeStats.allocateSeconds([{ ms: 600 }, { ms: 600 }]);
  assert.equal(clocks.totalSeconds, 1);
  assert.equal(clocks.seconds.reduce((sum, value) => sum + value, 0), 1);
  const mixed = TimeStats.allocateSeconds([{ ms: 1500 }, { ms: 1600 }]);
  assert.equal(mixed.totalSeconds, 3);
  assert.deepEqual(mixed.seconds, [1, 2]);
});

test('占比舍入：三等分与二比一都合计 100.0%', () => {
  const thirds = TimeStats.buildTimeDistribution([
    { id: 'a', name: '甲', ms: 1 },
    { id: 'b', name: '乙', ms: 1 },
    { id: 'c', name: '丙', ms: 1 }
  ]);
  assert.equal(tenthsSum(thirds), 1000);
  assert.deepEqual(thirds.items.map(item => item.percentLabel).sort(), ['33.3%', '33.3%', '33.4%']);
  assert.equal(thirds.slices.some(slice => slice.id === 'other'), false);

  const ratio = TimeStats.buildTimeDistribution([
    { id: 'a', name: '甲', ms: 1 },
    { id: 'b', name: '乙', ms: 2 }
  ]);
  assert.equal(tenthsSum(ratio), 1000);
  assert.deepEqual(ratio.items.map(item => item.percentLabel), ['33.3%', '66.7%']);
});

test('全部都很小时不把整张图并成一个其他', () => {
  const dist = TimeStats.buildTimeDistribution([
    { id: 'a', name: '甲', ms: 1 },
    { id: 'b', name: '乙', ms: 1 },
    { id: 'c', name: '丙', ms: 1 }
  ], { otherBelow: 0.4 });
  assert.equal(dist.slices.some(slice => slice.id === 'other'), false);
  assert.equal(dist.slices.length, 3);
});

test('极小但非零的时长显示不足 0.1%，仍计入总毫秒', () => {
  const dist = TimeStats.buildTimeDistribution([
    { id: 'a', name: '甲', ms: 1000000 },
    { id: 'b', name: '乙', ms: 1 }
  ]);
  assert.equal(dist.total, 1000001);
  assert.equal(dist.items[1].percentLabel, '不足0.1%');
  assert.equal(dist.items[1].merged, true);
  assert.equal(sliceMs(dist), dist.total);
  assert.equal(tenthsSum(dist), 1000);
});

test('目录不会被历史垃圾键污染，正常的额外书会保留', () => {
  const days = {
    '2026-08-01': { readingMs: { heart: 1000, '不好 的': 50, '<b>': 50, '': 50, prototype: 50, 论语: 2000 } }
  };
  const books = TimeStats.discoverBooks(days, BOOKS);
  assert.deepEqual(books.map(book => book.id), ['heart', 'dao', 'cao', '论语']);
  const rows = TimeStats.aggregateBookTimes(days, books);
  assert.equal(rows.find(row => row.id === '论语').ms, 2000);
  assert.equal(rows.find(row => row.id === 'heart').ms, 1000);
  assert.equal(rows.find(row => row.id === 'dao').ms, 0);
});
