const API_URL = 'https://script.google.com/macros/s/AKfycbxDdQTTo4atFPmZV5KIDcVlqPXUg830gyESZmL5C-pTGg8LWwayots0pMI4TH80ZG_lkg/exec';
let originalData = [];
let pieChart;

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

function parseTimeToHours(timeStr) {
  const match = timeStr.match(/(\d+)小時(\d+)分鐘(\d+)秒/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    return hours + minutes / 60 + seconds / 3600;
  }
  return 0;
}

async function fetchSheetData() {
  try {
    showLoading();
    const response = await fetch(API_URL);
    const data = await response.json();
    originalData = data;
    processData(data);
    populateTable(data);
    populateUserOptions(data);
  } catch (error) {
    console.error('讀取資料時出錯:', error);
    alert('讀取數據失敗，請稍後再試。');
  } finally {
    hideLoading();
  }
}

function processData(data) {
  const timeRecords = {};

  data.forEach(entry => {
    const name = entry.name;
    const timeStr = entry.time;
    const hours = parseTimeToHours(timeStr);

    if (timeRecords[name]) {
      timeRecords[name] += hours;
    } else {
      timeRecords[name] = hours;
    }
  });

  const labels = Object.keys(timeRecords);
  const values = Object.values(timeRecords);
  renderPieChart(labels, values);
  renderLegend(labels, values);
}

function generateColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
  }
  return colors;
}

function renderPieChart(labels, data) {
  const ctx = document.getElementById('pieChart').getContext('2d');

  if (pieChart) {
    pieChart.destroy();
  }

  const colors = generateColors(labels.length);

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: '時間百分比',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.6', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedName = labels[index];
          highlightPerson(selectedName);
        }
      }
    }
  });
}

function renderLegend(labels, data) {
  const legendContainer = document.getElementById('legendContainer');
  legendContainer.innerHTML = '';

  const colors = pieChart.data.datasets[0].backgroundColor;

  labels.forEach((label, index) => {
    const color = colors[index];
    const legendItem = document.createElement('div');
    legendItem.innerHTML = `
      <span style="background-color: ${color};"></span>
      ${label}: ${data[index].toFixed(2)} 小時
    `;
    legendContainer.appendChild(legendItem);
  });
}

function highlightPerson(name) {
  const rows = document.querySelectorAll('#practiceTable tbody tr');
  rows.forEach(row => {
    if (row.cells[0].textContent === name) {
      row.classList.add('highlight');
    } else {
      row.classList.remove('highlight');
    }
  });
}

function populateUserOptions(data) {
  const userFilter = document.getElementById('userFilter');
  const uniqueUsers = [...new Set(data.map(entry => entry.name))];

  uniqueUsers.forEach(user => {
    const option = document.createElement('option');
    option.value = user;
    option.textContent = user;
    userFilter.appendChild(option);
  });
}

function applyUserFilter() {
  const selectedUser = document.getElementById('userFilter').value;
  const selectedDate = document.getElementById('dateFilter').value;

  let filteredData = originalData;

  if (selectedUser) {
    filteredData = filteredData.filter(entry => entry.name === selectedUser);
  }

  if (selectedDate) {
    filteredData = filteredData.filter(entry => {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
      return entryDate === selectedDate;
    });
  }

  processData(filteredData);
  populateTable(filteredData);
}

function populateTable(data) {
  const tableBody = document.querySelector('#practiceTable tbody');
  tableBody.innerHTML = '';

  data.forEach(entry => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const timeCell = document.createElement('td');
    const activityCell = document.createElement('td');
    const timestampCell = document.createElement('td');

    nameCell.textContent = entry.name;
    timeCell.textContent = entry.time;
    activityCell.textContent = entry.activity || 'N/A';
    timestampCell.textContent = new Date(entry.timestamp).toLocaleString();

    row.appendChild(nameCell);
    row.appendChild(timeCell);
    row.appendChild(activityCell);
    row.appendChild(timestampCell);
    tableBody.appendChild(row);
  });
}

function applyDateFilter() {
  const selectedDate = document.getElementById('dateFilter').value;
  if (!selectedDate) {
    alert('請選擇一個日期');
    return;
  }

  const filteredData = originalData.filter(entry => {
    const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
    return entryDate === selectedDate;
  });

  if (filteredData.length === 0) {
    alert('該日期沒有數據');
  }

  processData(filteredData);
  populateTable(filteredData);
}

function resetFilter() {
  document.getElementById('dateFilter').value = '';
  document.getElementById('userFilter').value = '';
  processData(originalData);
  populateTable(originalData);
}

fetchSheetData();
