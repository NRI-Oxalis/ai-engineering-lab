(function (root) {
  function indexRows(table, key) {
    const index = new Map();
    for (const row of table.rows) {
      const value = row[key].trim();
      if (!value) throw new Error(`照合列「${key}」に空欄があります。`);
      if (index.has(value)) throw new Error(`照合列「${key}」に重複した値があります: ${value}`);
      index.set(value, row);
    }
    return index;
  }

  function compareTables(before, after, key) {
    if (!before.columns.includes(key) || !after.columns.includes(key)) {
      throw new Error('照合列が両方のファイルに必要です。');
    }
    if (before.columns.length !== after.columns.length ||
        before.columns.some((column) => !after.columns.includes(column))) {
      throw new Error('両方のCSVの列名を一致させてください。');
    }

    const oldRows = indexRows(before, key);
    const newRows = indexRows(after, key);
    const entries = [];
    const counts = { added: 0, changed: 0, removed: 0 };
    const summary = (row) => before.columns.filter((column) => column !== key)
      .map((column) => `${column}: ${row[column]}`).join(' / ');

    for (const [value, row] of newRows) {
      const oldRow = oldRows.get(value);
      if (!oldRow) {
        counts.added++;
        entries.push({ type: 'added', key: value, column: '全列', before: '', after: summary(row) });
        continue;
      }
      const changedColumns = before.columns.filter((column) => column !== key && column !== '金額' && oldRow[column] !== row[column]);
      if (changedColumns.length) counts.changed++;
      for (const column of changedColumns) {
        entries.push({ type: 'changed', key: value, column, before: oldRow[column], after: row[column] });
      }
    }
    for (const [value, row] of oldRows) {
      if (!newRows.has(value)) {
        counts.removed++;
        entries.push({ type: 'removed', key: value, column: '全列', before: summary(row), after: '' });
      }
    }
    return { entries, counts };
  }

  const api = { compareTables };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CsvDiff = api;
})(globalThis);
