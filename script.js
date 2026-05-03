let delayMinutes = Number(localStorage.getItem('rowingDelay') || 0);

const tableBody = document.getElementById('tableBody');
const exportDate = document.getElementById('exportDate');
const eventName = document.getElementById('eventName');
const exportTitle = document.getElementById('exportTitle');

const columns = [
  { key: 'athlete', type: 'text', placeholder: 'Name' },
  { key: 'boat', type: 'text', placeholder: 'Boot' },
  { key: 'warmup', type: 'time' },
  { key: 'meeting', type: 'time' },
  { key: 'start', type: 'time' },
  { key: 'series', type: 'text', placeholder: 'Serie' },
  { key: 'lane', type: 'text', placeholder: 'Bahn' },
];

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get('data');

  if (!dataParam) return false;

  try {
    const decoded = JSON.parse(atob(dataParam));

    eventName.value = decoded.name || '';
    updateTitle();

    tableBody.innerHTML = '';

    decoded.rows.forEach(values => {
      const data = {};
      columns.forEach((col, i) => {
        data[col.key] = values[i] || '';
      });
      addRow(data);
    });

    return true;
  } catch (e) {
    console.error('Fehler beim Laden des Links', e);
    return false;
  }
}

function setDate() {
  const today = new Date();
  exportDate.textContent = today.toLocaleDateString('de-CH');
}

function updateTitle() {
  exportTitle.textContent = eventName.value.trim() || 'Regattaplan';
}

function sortTable() {
  const rows = Array.from(document.querySelectorAll('#tableBody tr'));

  rows.sort((a, b) => {
    const aTime = getStartTimeFromRow(a);
    const bTime = getStartTimeFromRow(b);

    if (!aTime) return 1;
    if (!bTime) return -1;

    return aTime - bTime;
  });

  rows.forEach(row => tableBody.appendChild(row));
}

function addRow(data = {}) {
  const row = document.createElement('tr');

  columns.forEach(column => {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = column.type;
    input.placeholder = column.placeholder || '';
    input.value = data[column.key] || '';
    if (column.key === 'start') {
      input.addEventListener('input', () => {
        const inputs = row.querySelectorAll('input');

        const warmupInput = inputs[2];
        const meetingInput = inputs[3];

        // Nur setzen, wenn leer
        if (!warmupInput.value) {
          warmupInput.value = subtractMinutes(input.value, 60);
        }

        if (!meetingInput.value) {
          meetingInput.value = subtractMinutes(input.value, 40);
        }

        sortTable();
        saveTable();
      });
    }
    cell.appendChild(input);
    row.appendChild(cell);
  });

  const actionCell = document.createElement('td');
  actionCell.className = 'actions';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'danger delete-row';
  deleteButton.textContent = 'x';
  deleteButton.type = 'button';
  deleteButton.onclick = () => {
    row.remove();
    saveTable();
  };

  actionCell.appendChild(deleteButton);
  row.appendChild(actionCell);
  tableBody.appendChild(row);
}

function prepareExport() {
  document.querySelectorAll('.actions').forEach(el => {
    el.dataset.oldDisplay = el.style.display;
    el.style.display = 'none';
  });

  document.body.dataset.wasRaceMode = document.body.classList.contains('race-mode');
  document.body.classList.remove('race-mode');
}

function finishExport() {
  document.querySelectorAll('.actions').forEach(el => {
    el.style.display = el.dataset.oldDisplay || '';
  });

  if (document.body.dataset.wasRaceMode === 'true') {
    document.body.classList.add('race-mode');
  }
}

function finishExport() {
  document.querySelectorAll('.actions').forEach(el => {
    el.style.display = el.dataset.oldDisplay || '';
  });
}

function fileName() {
  return (exportTitle.textContent || 'regattaplan').replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
}

async function exportPNG() {
  prepareExport();

  const area = document.getElementById('exportArea');
  const oldWidth = area.style.width;

  area.style.width = '1200px';

  try {
    const canvas = await html2canvas(area, {
      scale: 2,
      backgroundColor: '#ffffff',
      windowWidth: 1300
    });

    const link = document.createElement('a');
    link.download = `${fileName()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    area.style.width = oldWidth;
    finishExport();
  }
}

async function exportPDF() {
  prepareExport();

  const area = document.getElementById('exportArea');
  const oldWidth = area.style.width;

  // Wichtig: verhindert Abschneiden auf Handy
  area.style.width = '1200px';

  try {
    const canvas = await html2canvas(area, {
      scale: 2,
      backgroundColor: '#ffffff',
      windowWidth: 1300
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF('l', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin,
      imgWidth,
      Math.min(imgHeight, pageHeight - margin * 2)
    );

    pdf.save(`${fileName()}.pdf`);
  } finally {
    area.style.width = oldWidth;
    finishExport();
  }
}

eventName.addEventListener('input', updateTitle);
document.getElementById('addRowBtn').addEventListener('click', () => addRow());
document.getElementById('exportPngBtn').addEventListener('click', exportPNG);
document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);

function saveTable() {
  const rows = [];

  document.querySelectorAll('#tableBody tr').forEach(row => {
    const inputs = row.querySelectorAll('input');
    rows.push(Array.from(inputs).map(input => input.value));
  });

  localStorage.setItem('rowingTableData', JSON.stringify(rows));
  localStorage.setItem('rowingEventName', document.getElementById('eventName').value);
}

function loadTable() {
  const savedRows = JSON.parse(localStorage.getItem('rowingTableData') || '[]');
  const savedName = localStorage.getItem('rowingEventName');

  if (savedName) {
    document.getElementById('eventName').value = savedName;
    updateTitle();
  }

  tableBody.innerHTML = '';

  if (savedRows.length === 0) {
    addRow();
    return;
  }

  savedRows.forEach(values => {
    const data = {};
    columns.forEach((column, index) => {
      data[column.key] = values[index] || '';
    });
    addRow(data);
  });
}

function subtractMinutes(time, minutes) {
  if (!time) return '';

  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins - minutes);

  return date.toTimeString().slice(0, 5);
}

document.addEventListener('input', saveTable);

let raceMode = localStorage.getItem('rowingRaceMode') === 'true';

function getStartTimeFromRow(row) {
  const inputs = row.querySelectorAll('input');
  const startInput = inputs[4];

  if (!startInput || !startInput.value) return null;

  const [hours, minutes] = startInput.value.split(':').map(Number);
  const raceTime = new Date();

  raceTime.setHours(hours, minutes + delayMinutes, 0, 0);

  return raceTime;
}

function updateRaceModeRows() {
  const rows = Array.from(document.querySelectorAll('#tableBody tr'));
  const now = new Date();

  let nextRow = null;
  let nextTime = null;

  rows.forEach(row => {
    row.classList.remove('past-race', 'next-race');

    const startTime = getStartTimeFromRow(row);
    if (!startTime) return;

    if (startTime < now) {
      row.classList.add('past-race');
    } else if (!nextTime || startTime < nextTime) {
      nextTime = startTime;
      nextRow = row;
    }
  });

  if (nextRow) {
    nextRow.classList.add('next-race');
  }

  const btn = document.getElementById('raceModeBtn');
  const delayContainer = document.getElementById('delayContainer');

  if (raceMode) {
    document.body.classList.add('race-mode');
    btn.textContent = 'Regattamodus aus';
    delayContainer.style.display = 'flex';
  } else {
    document.body.classList.remove('race-mode');
    btn.textContent = 'Regattamodus';
    delayContainer.style.display = 'none';
  }

  updateRaceModeRows();
}

function updateRaceModeButton() {
  const btn = document.getElementById('raceModeBtn');

  if (raceMode) {
    document.body.classList.add('race-mode');
    btn.textContent = 'Regattamodus aus';
  } else {
    document.body.classList.remove('race-mode');
    btn.textContent = 'Regattamodus';
  }

  updateRaceModeRows();
}

document.getElementById('raceModeBtn').addEventListener('click', () => {
  raceMode = !raceMode;
  localStorage.setItem('rowingRaceMode', raceMode);
  updateRaceModeButton();
});

setInterval(updateRaceModeRows, 30000);

document.getElementById('delayInput').value = delayMinutes;
document.getElementById('delayInput').addEventListener('input', (e) => {
  delayMinutes = Number(e.target.value) || 0;
  localStorage.setItem('rowingDelay', delayMinutes);
  updateRaceModeRows();
});

function generateShareLink() {
  const rows = [];

  document.querySelectorAll('#tableBody tr').forEach(row => {
    const inputs = row.querySelectorAll('input');
    rows.push(Array.from(inputs).map(input => input.value));
  });

  const data = {
    name: eventName.value,
    rows: rows
  };

  const encoded = btoa(JSON.stringify(data)); // encode
  const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

  return url;
}

document.getElementById('shareBtn').addEventListener('click', async () => {
  const url = generateShareLink();

  await navigator.clipboard.writeText(url);
  alert('Link kopiert!');
});

document.getElementById('reloadBtn').addEventListener('click', () => {
  location.reload();
});

setDate();
if (!loadFromURL()) {
  loadTable();
}
sortTable();
updateRaceModeButton();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}