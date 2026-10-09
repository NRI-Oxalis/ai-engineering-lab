(function () {
  const tables = { before: null, after: null };
  const requests = { before: 0, after: 0 };
  let result = null;
  const keySelect = document.getElementById('key');
  const compareButton = document.getElementById('compare');
  const downloadButton = document.getElementById('download');
  const status = document.getElementById('status');

  function resetResults() {
    result = null;
    downloadButton.disabled = true;
    document.getElementById('stats').hidden = true;
    document.getElementById('table-wrap').hidden = true;
    document.getElementById('empty').hidden = false;
    document.getElementById('empty').textContent = '比較結果はここに表示されます。';
  }

  function parseCsv(text) {
    const parsed = Papa.parse(text, { skipEmptyLines: 'greedy' });
    if (parsed.errors.length) throw new Error(`CSVの読み取りに失敗しました（${parsed.errors[0].row + 1}行目）。`);
    const [header, ...records] = parsed.data;
    if (!header) throw new Error('CSVに見出し行がありません。');
    const columns = header.map((value) => value.trim());
    if (columns.some((column) => !column) || new Set(columns).size !== columns.length) {
      throw new Error('列名に空欄または重複があります。');
    }
    const rows = records.map((cells, index) => {
      if (cells.length !== columns.length) throw new Error(`${index + 2}行目の列数が見出しと異なります。`);
      return Object.fromEntries(columns.map((column, position) => [column, cells[position]]));
    });
    return { columns, rows };
  }

  function updateControls() {
    const before = tables.before;
    const after = tables.after;
    keySelect.replaceChildren();
    keySelect.disabled = true;
    compareButton.disabled = true;
    if (!before || !after) return;
    if (before.columns.length !== after.columns.length ||
        before.columns.some((column) => !after.columns.includes(column))) {
      status.textContent = '両方のCSVの列名を一致させてください。';
      return;
    }
    for (const column of before.columns) {
      const option = document.createElement('option');
      option.value = column;
      option.textContent = column;
      keySelect.append(option);
    }
    keySelect.disabled = false;
    compareButton.disabled = false;
  }

  async function loadFile(side, file) {
    const request = ++requests[side];
    tables[side] = null;
    status.textContent = '';
    resetResults();
    updateControls();
    document.getElementById(`${side}-name`).textContent = file ? file.name : 'ファイル未選択';
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('5MB以下のCSVを選択してください。');
      const table = parseCsv(await file.text());
      if (request !== requests[side]) return;
      tables[side] = table;
      updateControls();
    } catch (error) {
      if (request === requests[side]) status.textContent = `${file.name}: ${error.message}`;
    }
  }

  for (const side of ['before', 'after']) {
    const input = document.getElementById(side);
    const drop = document.getElementById(`${side}-drop`);
    input.addEventListener('change', () => loadFile(side, input.files[0]));
    drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (event) => {
      event.preventDefault();
      drop.classList.remove('dragover');
      loadFile(side, event.dataTransfer.files[0]);
    });
  }

  keySelect.addEventListener('change', resetResults);

  const labels = { added: '追加', changed: '変更', removed: '削除' };
  compareButton.addEventListener('click', () => {
    resetResults();
    status.textContent = '';
    try {
      result = CsvDiff.compareTables(tables.before, tables.after, keySelect.value);
      for (const type of Object.keys(labels)) {
        document.getElementById(`${type}-count`).textContent = result.counts[type];
      }
      const table = document.getElementById('results');
      const head = document.createElement('thead');
      const headingRow = document.createElement('tr');
      for (const label of ['種別', '照合キー', '列', '更新前', '更新後']) {
        const cell = document.createElement('th');
        cell.textContent = label;
        headingRow.append(cell);
      }
      head.append(headingRow);
      const body = document.createElement('tbody');
      for (const entry of result.entries) {
        const row = document.createElement('tr');
        row.className = `${entry.type}-row`;
        for (const [position, value] of [labels[entry.type], entry.key, entry.column, entry.before, entry.after].entries()) {
          const cell = document.createElement('td');
          cell.textContent = value;
          if (position === 3 && value) cell.className = 'old';
          if (position === 4 && value) cell.className = 'new';
          row.append(cell);
        }
        body.append(row);
      }
      table.replaceChildren(head, body);
      document.getElementById('stats').hidden = false;
      document.getElementById('table-wrap').hidden = !result.entries.length;
      document.getElementById('empty').hidden = !!result.entries.length;
      if (!result.entries.length) document.getElementById('empty').textContent = '差分はありません。';
      downloadButton.disabled = false;
    } catch (error) {
      status.textContent = error.message;
    }
  });

  downloadButton.addEventListener('click', () => {
    if (!result) return;
    const rows = result.entries.map((entry) => [labels[entry.type], entry.key, entry.column, entry.before, entry.after]);
    const csv = Papa.unparse([['種別', '照合キー', '列', '更新前', '更新後'], ...rows], { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'csv-diff.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
