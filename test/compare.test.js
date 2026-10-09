const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Papa = require('../papaparse.min.js');
const { compareTables } = require('../compare.js');

function parse(name) {
  const text = fs.readFileSync(path.join(__dirname, '..', 'sample', name), 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy' });
  assert.deepEqual(parsed.errors, []);
  return { columns: parsed.meta.fields, rows: parsed.data };
}

test('sample CSV files show additions, row changes and removals', () => {
  const result = compareTables(parse('before.csv'), parse('after.csv'), 'ID');
  assert.deepEqual(result.counts, { added: 1, changed: 1, removed: 1 });
  assert.deepEqual(result.entries.map(({ type, key, column }) => [type, key, column]), [
    ['changed', 'A-101', '状態'],
    ['changed', 'A-101', '金額'],
    ['added', 'A-105', '全列'],
    ['removed', 'A-103', '全列']
  ]);
  assert.equal(parse('before.csv').rows[1]['案件'], '備品,手配');
});

test('matching rows yield an empty diff even when columns are reordered', () => {
  const before = { columns: ['ID', '名前'], rows: [{ ID: '1', 名前: '佐藤' }] };
  const after = { columns: ['名前', 'ID'], rows: [{ 名前: '佐藤', ID: '1' }] };
  assert.deepEqual(compareTables(before, after, 'ID').counts, { added: 0, changed: 0, removed: 0 });
});

test('missing or duplicate identifiers cannot silently replace rows', () => {
  const before = { columns: ['ID', '名前'], rows: [{ ID: '1', 名前: '旧' }] };
  const duplicate = { columns: before.columns, rows: [{ ID: '2', 名前: 'A' }, { ID: '2', 名前: 'B' }] };
  const blank = { columns: before.columns, rows: [{ ID: ' ', 名前: 'A' }] };
  assert.throws(() => compareTables(before, duplicate, 'ID'), /重複/);
  assert.throws(() => compareTables(before, blank, 'ID'), /空欄/);
  assert.throws(() => compareTables(before, { columns: ['ID'], rows: [] }, 'ID'), /列名/);
});

test('exported CSV escapes spreadsheet formula cells', () => {
  const csv = Papa.unparse([['値'], ['=1+1']], { escapeFormulae: true });
  assert.equal(Papa.parse(csv).data[1][0], "'=1+1");
});
