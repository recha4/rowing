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

function setDate() {
  const today = new Date();
  exportDate.textContent = today.toLocaleDateString('de-CH');
}

function updateTitle() {
  exportTitle.textContent = eventName.value.trim() || 'Regattaplan';
}

function addRow(data = {}) {
  const row = document.createElement('tr');

  columns.forEach(column => {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = column.type;
    input.placeholder = column.placeholder || '';
    input.value = data[column.key] || '';
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

setDate();
loadTable();