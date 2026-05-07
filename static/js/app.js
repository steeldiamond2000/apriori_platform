// Global state
let currentData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;
let charts = {};

// Localization
async function loadLanguage(lang) {
    try {
        const response = await fetch(`/languages/${lang}`);
        const translations = await response.json();
        
        // Update text content for keys
        for (const [key, value] of Object.entries(translations)) {
            const el = document.getElementById(key);
            if (el) {
                if (el.tagName === 'INPUT' && el.type === 'text') {
                    el.placeholder = value;
                } else {
                    el.innerText = value;
                }
            }
        }
        
        // Update dynamic data like table headers if data exists
        if (currentData.length > 0) {
            renderTable();
        }
    } catch (error) {
        console.error("Failed to load language", error);
    }
}

function changeLanguage() {
    const lang = document.getElementById('langSelect').value;
    loadLanguage(lang);
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadLanguage('uz');
});

// File Upload Logic
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

fileInput.addEventListener('change', handleFileSelect);

removeFile.addEventListener('click', () => {
    fileInput.value = '';
    dropZone.classList.remove('hidden');
    fileInfo.classList.add('hidden');
});

function handleFileSelect() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.name.endsWith('.csv')) {
            fileName.textContent = file.name;
            dropZone.classList.add('hidden');
            fileInfo.classList.remove('hidden');
        } else {
            alert("Please upload a CSV file.");
            fileInput.value = '';
        }
    }
}

// Form Submission
document.getElementById('aprioriForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!fileInput.files.length) {
        alert("Please upload a dataset first.");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('min_support', document.getElementById('minSupport').value);
    formData.append('min_confidence', document.getElementById('minConfidence').value);
    formData.append('max_rules', document.getElementById('maxRules').value);

    // UI State
    document.getElementById('dashboardContent').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentData = data.rules;
            filteredData = currentData;
            currentPage = 1;
            
            document.getElementById('totalRulesVal').textContent = data.total_rules;
            document.getElementById('totalItemsetsVal').textContent = data.frequent_itemsets_count;
            
            renderTable();
            renderCharts();
            
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('dashboardContent').classList.remove('hidden');
        } else {
            throw new Error(data.error || "Analysis failed");
        }
    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
        document.getElementById('loader').classList.add('hidden');
    }
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filteredData = currentData.filter(rule => {
        const ruleText = `${rule.antecedents.join(', ')} -> ${rule.consequents.join(', ')}`.toLowerCase();
        return ruleText.includes(term);
    });
    currentPage = 1;
    renderTable();
});

// Pagination & Table Rendering
function renderTable() {
    const tbody = document.getElementById('rulesTableBody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(rule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>[${rule.antecedents.join(', ')}]</strong> &rarr; <strong>[${rule.consequents.join(', ')}]</strong></td>
            <td>${rule.support.toFixed(4)}</td>
            <td>${rule.confidence.toFixed(4)}</td>
            <td style="color: var(--secondary-neon); font-weight: bold;">${rule.lift.toFixed(4)}</td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('paginationControls');
    container.innerHTML = '';
    
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        // Simple logic for keeping pagination compact (show max 5 buttons)
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => {
                currentPage = i;
                renderTable();
            };
            container.appendChild(btn);
        } else if (container.lastChild && container.lastChild.textContent !== '...') {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.color = 'white';
            dots.style.margin = '0 5px';
            container.appendChild(dots);
        }
    }
}

// Chart.js Visualizations
function renderCharts() {
    // Destroy existing charts
    if (charts.scatter) charts.scatter.destroy();
    if (charts.bar) charts.bar.destroy();

    Chart.defaults.color = '#e2e8f0';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

    // Scatter Chart (Support vs Confidence)
    const scatterCtx = document.getElementById('scatterChart').getContext('2d');
    charts.scatter = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Rules',
                data: currentData.map(r => ({ x: r.support, y: r.confidence })),
                backgroundColor: '#00f0ff',
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Support' } },
                y: { title: { display: true, text: 'Confidence' }, min: 0, max: 1 }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Supp: ${ctx.raw.x.toFixed(3)}, Conf: ${ctx.raw.y.toFixed(3)}`
                    }
                }
            }
        }
    });

    // Bar Chart (Top 10 Lift)
    const top10 = [...currentData].sort((a, b) => b.lift - a.lift).slice(0, 10);
    const labels = top10.map(r => `${r.antecedents[0]}...`);
    const lifts = top10.map(r => r.lift);

    const barCtx = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Lift',
                data: lifts,
                backgroundColor: 'rgba(255, 0, 234, 0.7)',
                borderColor: '#ff00ea',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (ctx) => {
                            const r = top10[ctx[0].dataIndex];
                            return `[${r.antecedents.join(',')}] -> [${r.consequents.join(',')}]`;
                        }
                    }
                }
            }
        }
    });
}

// Export CSV
function exportToCSV() {
    if (!currentData.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Antecedents,Consequents,Support,Confidence,Lift\n";
    
    currentData.forEach(row => {
        const ant = `"${row.antecedents.join(', ')}"`;
        const con = `"${row.consequents.join(', ')}"`;
        csvContent += `${ant},${con},${row.support},${row.confidence},${row.lift}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "apriori_rules.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
