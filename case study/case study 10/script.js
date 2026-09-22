// Global State Variables
let allStudents = [];
let currentMethod = 'fetch';
let currentTheme = 'light';
const DATA_SOURCE_URL = 'students.json';
const INVALID_DATA_URL = 'missing_students_data.json';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initApp();
});

function initTheme() {
    const savedTheme = localStorage.getItem('cs10_theme') || 'light';
    setTheme(savedTheme);
    document.getElementById('btnToggleTheme')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cs10_theme', theme);

    const iconEl = document.getElementById('themeToggleIcon');
    const textEl = document.getElementById('themeToggleText');
    if (iconEl && textEl) {
        if (theme === 'dark') {
            iconEl.textContent = '☀️';
            textEl.textContent = 'Light Mode';
        } else {
            iconEl.textContent = '🌙';
            textEl.textContent = 'Dark Mode';
        }
    }
}

function initApp() {
    // Radio selection binding
    const methodRadios = document.querySelectorAll('input[name="loadMethod"]');
    methodRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMethod = e.target.value;
            updateMethodBadge();
        });
    });

    // Action buttons binding
    document.getElementById('btnLoadData')?.addEventListener('click', () => loadStudentData(DATA_SOURCE_URL));
    document.getElementById('btnTestError')?.addEventListener('click', () => loadStudentData(INVALID_DATA_URL));
    document.getElementById('btnClearFilters')?.addEventListener('click', clearFilters);
    document.getElementById('btnDismissAlert')?.addEventListener('click', hideNotification);

    // Search and filter input handlers
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);

    // Initial data load
    loadStudentData(DATA_SOURCE_URL);
}

function updateMethodBadge() {
    const badge = document.getElementById('activeMethodBadge');
    if (badge) {
        badge.textContent = currentMethod === 'fetch' ? 'Native JS fetch()' : 'jQuery $.getJSON()';
        badge.className = `current-method-pill method-${currentMethod}`;
    }
}

function loadStudentData(url) {
    showNotification('Loading data from ' + url + '...', 'info');
    updateDiagnostics('Request initiated', url, currentMethod === 'fetch' ? 'JavaScript fetch()' : 'jQuery $.getJSON()');
    const startTime = performance.now();

    if (currentMethod === 'fetch') {
        fetchStudentDataNative(url, startTime);
    } else {
        fetchStudentDataJQuery(url, startTime);
    }
}

// 1. Native JS fetch()
function fetchStudentDataNative(url, startTime) {
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'File Not Found'}`);
            return response.json();
        })
        .then(data => handleDataLoadSuccess(data, 'JavaScript fetch()', Math.round(performance.now() - startTime), url))
        .catch(error => handleDataLoadError(error.message, 'JavaScript fetch()', Math.round(performance.now() - startTime), url));
}

// 2. jQuery $.getJSON()
function fetchStudentDataJQuery(url, startTime) {
    if (typeof jQuery === 'undefined') {
        handleDataLoadError('jQuery is not loaded.', 'jQuery $.getJSON()', 0, url);
        return;
    }
    $.getJSON(url)
        .done(data => handleDataLoadSuccess(data, 'jQuery $.getJSON()', Math.round(performance.now() - startTime), url))
        .fail((jqxhr, textStatus, errorThrown) => {
            const status = jqxhr.status ? `HTTP ${jqxhr.status}` : 'Network / Parse Error';
            handleDataLoadError(`Failed to load "${url}": ${status}`, 'jQuery $.getJSON()', Math.round(performance.now() - startTime), url);
        });
}

function handleDataLoadSuccess(data, methodUsed, durationMs, url) {
    if (!Array.isArray(data)) {
        handleDataLoadError('Data format invalid', methodUsed, durationMs, url);
        return;
    }
    allStudents = data;
    applyFilters();
    updateSummaryStats(allStudents);
    showNotification(`Successfully loaded ${allStudents.length} student records using ${methodUsed} in ${durationMs}ms.`, 'success');
    updateDiagnostics('200 OK (Loaded)', url, methodUsed, `${durationMs}ms`);
}

function handleDataLoadError(errorMessage, methodUsed, durationMs, url) {
    allStudents = [];
    renderTable([]);
    updateSummaryStats([]);
    showNotification(`Error: Unable to load data using ${methodUsed}. ${errorMessage}`, 'error');
    updateDiagnostics('Error / Failed', url, methodUsed, `${durationMs}ms`);
}

function renderTable(studentsToDisplay) {
    const tbody = document.getElementById('studentsTableBody');
    const counterBadge = document.getElementById('tableCountBadge');
    if (!tbody) return;

    if (counterBadge) {
        counterBadge.textContent = `Showing ${studentsToDisplay.length} of ${allStudents.length} records`;
    }

    tbody.innerHTML = '';

    if (!studentsToDisplay || studentsToDisplay.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state-content"><div class="empty-state-title">No Records Found</div><p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">No student records match your query or filter criteria.</p></div></td></tr>`;
        return;
    }

    studentsToDisplay.forEach((student, index) => {
        const tr = document.createElement('tr');
        const statusClean = (student.registrationStatus || '').toLowerCase();
        let badgeClass = statusClean === 'pending' ? 'status-pending' : (statusClean === 'cancelled' ? 'status-cancelled' : 'status-registered');
        tr.innerHTML = `
            <td class="sr-col">${index + 1}</td>
            <td><span class="prn-code">${escapeHtml(student.prn)}</span></td>
            <td class="student-name-cell">${escapeHtml(student.studentName)}</td>
            <td>${escapeHtml(student.department)}</td>
            <td><span class="year-badge">${escapeHtml(student.year)}</span></td>
            <td class="event-cell">${escapeHtml(student.eventName)}</td>
            <td><span class="status-badge ${badgeClass}">${escapeHtml(student.registrationStatus)}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateSummaryStats(list) {
    let registered = 0, pending = 0, cancelled = 0;
    list.forEach(s => {
        const status = (s.registrationStatus || '').toLowerCase();
        if (status === 'registered') registered++;
        else if (status === 'pending') pending++;
        else if (status === 'cancelled') cancelled++;
    });

    const elTotal = document.getElementById('statTotal');
    const elReg = document.getElementById('statRegistered');
    const elPen = document.getElementById('statPending');
    const elCan = document.getElementById('statCancelled');

    if (elTotal) elTotal.textContent = list.length;
    if (elReg) elReg.textContent = registered;
    if (elPen) elPen.textContent = pending;
    if (elCan) elCan.textContent = cancelled;
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    const selectedStatus = document.getElementById('statusFilter')?.value || 'All';

    const filtered = allStudents.filter(student => {
        const nameMatch = (student.studentName || '').toLowerCase().includes(searchTerm);
        const prnMatch = (student.prn || '').toLowerCase().includes(searchTerm);
        const matchesSearch = searchTerm === '' || nameMatch || prnMatch;
        const matchesStatus = selectedStatus === 'All' || student.registrationStatus === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    renderTable(filtered);
}

function clearFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = 'All';
    applyFilters();
}

function showNotification(message, type = 'info') {
    const banner = document.getElementById('notificationBanner');
    const textEl = document.getElementById('notificationText');
    const iconEl = document.getElementById('notificationIcon');
    if (!banner || !textEl) return;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    if (iconEl) iconEl.textContent = icon;
    banner.className = `notification-banner active ${type}`;
    textEl.innerHTML = escapeHtml(message);
}

function hideNotification() {
    const banner = document.getElementById('notificationBanner');
    if (banner) banner.className = 'notification-banner';
}

function updateDiagnostics(status, source, method, latency = '-') {
    if (document.getElementById('diagStatus')) document.getElementById('diagStatus').textContent = status;
    if (document.getElementById('diagSource')) document.getElementById('diagSource').textContent = source;
    if (document.getElementById('diagMethod')) document.getElementById('diagMethod').textContent = method;
    if (document.getElementById('diagLatency')) document.getElementById('diagLatency').textContent = latency;
}

function escapeHtml(str) {
    if (str == null) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
