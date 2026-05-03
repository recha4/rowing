const tableBody = document.getElementById('tableBody');
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
    const value = document.getElementById('eventName').value.trim();
    document.getElementById('exportTitle').textContent = value || 'Regattaplan';
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
    deleteButton.textContent = '×';
    deleteButton.title = 'Zeile löschen';
    deleteButton.onclick = () => row.remove();

    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
}

function prepareExport() {
    document.querySelectorAll('.actions').forEach(element => {
        element.style.display = 'none';
    });
}

function finishExport() {
    document.querySelectorAll('.actions').forEach(element => {
        element.style.display = '';
    });
}

async function exportPNG() {
    prepareExport();
    const area = document.getElementById('exportArea');
    const canvas = await html2canvas(area, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${document.getElementById('exportTitle').textContent || 'regattaplan'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    finishExport();
}

async function exportPDF() {
    prepareExport();
    const area = document.getElementById('exportArea');
    const canvas = await html2canvas(area, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const finalHeight = Math.min(imgHeight, pageHeight - 20);

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, finalHeight);
    pdf.save(`${document.getElementById('exportTitle').textContent || 'regattaplan'}.pdf`);
    finishExport();
}

setDate();
addRow({ athlete: 'Max Muster', warmup: '08:30', start: '09:15', meeting: '08:00', lane: '3', series: 'Vorlauf 1', water: '08:45' });
addRow();