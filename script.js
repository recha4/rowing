const tableBody = document.getElementById('tableBody');
const exportDate = document.getElementById('exportDate');
const eventName = document.getElementById('eventName');
const exportTitle = document.getElementById('exportTitle');

const columns = [
  { key: 'athlete', type: 'text', placeholder: 'Name' },
  { key: 'warmup', type: 'time' },
  { key: 'start', type: 'time' },
  { key: 'meeting', type: 'time' },
  { key: 'lane', type: 'text', placeholder: 'z.B. 3' },
  { key: 'series', type: 'text', placeholder: 'z.B. Vorlauf 2' },
  { key: 'link', type: 'url', placeholder: 'https://...' },
  { key: 'water', type: 'time' }
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
  deleteButton.addEventListener('click', () => row.remove());

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
  try {
    const area = document.getElementById('exportArea');
    const canvas = await html2canvas(area, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${fileName()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    finishExport();
  }
}

async function exportPDF() {
  prepareExport();
  try {
    const area = document.getElementById('exportArea');
    const canvas = await html2canvas(area, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - margin * 2));
    pdf.save(`${fileName()}.pdf`);
  } finally {
    finishExport();
  }
}

eventName.addEventListener('input', updateTitle);
document.getElementById('addRowBtn').addEventListener('click', () => addRow());
document.getElementById('exportPngBtn').addEventListener('click', exportPNG);
document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);

setDate();
addRow({ athlete: 'Max Muster', warmup: '08:30', start: '09:15', meeting: '08:00', lane: '3', series: 'Vorlauf 1', water: '08:45' });
addRow();
