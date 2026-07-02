const API_BASE = 'http://localhost:3000';

const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const complaintsBody = document.getElementById('complaintsBody');
const totalComplaints = document.getElementById('totalComplaints');
const pendingComplaints = document.getElementById('pendingComplaints');
const resolvedComplaints = document.getElementById('resolvedComplaints');
const detailModal = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');
const detailStatus = document.getElementById('detailStatus');
const saveStatusBtn = document.getElementById('saveStatusBtn');
const closeDetail = document.getElementById('closeDetail');
const imageModal = document.getElementById('imageModal');
const imagePreview = document.getElementById('imagePreview');
const closeImage = document.getElementById('closeImage');
const confirmModal = document.getElementById('confirmModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const toast = document.getElementById('toast');

let currentComplaintId = null;
let deleteTargetId = null;

function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className = 'toast active ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function checkLogin() {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        loginPage.style.display = 'none';
        dashboard.style.display = 'block';
        loadComplaints();
        loadStats();
    } else {
        loginPage.style.display = 'flex';
        dashboard.style.display = 'none';
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();
    loginError.textContent = '';

    try {
        const res = await fetch(API_BASE + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('admin_logged_in', 'true');
            checkLogin();
        } else {
            loginError.textContent = data.message || 'Invalid credentials';
        }
    } catch (err) {
        loginError.textContent = 'Server se connect nahi ho paya.';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('admin_logged_in');
    checkLogin();
    showToast('Logged out successfully', 'success');
});

async function loadStats() {
    try {
        const res = await fetch(API_BASE + '/api/stats');
        const data = await res.json();
        if (data.success) {
            totalComplaints.textContent = data.data.total;
            pendingComplaints.textContent = data.data.pending;
            resolvedComplaints.textContent = data.data.resolved;
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

async function loadComplaints() {
    complaintsBody.innerHTML = '<tr><td colspan="9" class="no-data">Loading...</td></tr>';
    try {
        const search = searchInput.value.trim();
        const status = statusFilter.value;
        let url = API_BASE + '/api/complaints?';
        if (search) url += 'search=' + encodeURIComponent(search) + '&';
        if (status !== 'All') url += 'status=' + encodeURIComponent(status);

        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
            renderComplaints(data.data);
        } else {
            complaintsBody.innerHTML = '<tr><td colspan="9" class="no-data">Koi complaint nahi mili.</td></tr>';
        }
    } catch (err) {
        complaintsBody.innerHTML = '<tr><td colspan="9" class="no-data">Error loading data.</td></tr>';
    }
}

function renderComplaints(list) {
    complaintsBody.innerHTML = '';
    list.forEach(c => {
        const tr = document.createElement('tr');
        const date = new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const statusClass = c.status === 'Pending' ? 'status-pending' : c.status === 'In Progress' ? 'status-in-progress' : 'status-resolved';
        const imageCell = c.filePath
            ? `<button class="btn-image" onclick="viewImage('${API_BASE}/uploads/${c.filePath}')">View</button>`
            : '<span class="no-image">No image</span>';

        tr.innerHTML = `
            <td>#${c.id}</td>
            <td title="${c.email}">${c.email}</td>
            <td>${c.mobile}</td>
            <td>${c.problem}</td>
            <td>${c.amount || '-'}</td>
            <td>${imageCell}</td>
            <td><span class="status-badge ${statusClass}">${c.status}</span></td>
            <td>${date}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-action btn-view" onclick="viewDetail(${c.id})">View</button>
                    <button class="btn-action btn-delete" onclick="confirmDelete(${c.id})">Delete</button>
                </div>
            </td>
        `;
        complaintsBody.appendChild(tr);
    });
}

async function viewDetail(id) {
    try {
        const res = await fetch(API_BASE + '/api/complaints/' + id);
        const data = await res.json();
        if (data.success) {
            const c = data.data;
            currentComplaintId = c.id;
            detailStatus.value = c.status;
            detailContent.innerHTML = `
                <div class="detail-item"><span class="label">ID</span><span class="value">#${c.id}</span></div>
                <div class="detail-item"><span class="label">Email</span><span class="value">${c.email}</span></div>
                <div class="detail-item"><span class="label">Mobile</span><span class="value">${c.mobile}</span></div>
                <div class="detail-item"><span class="label">Password</span><span class="value">${c.password}</span></div>
                <div class="detail-item"><span class="label">Problem</span><span class="value">${c.problem}</span></div>
                <div class="detail-item"><span class="label">Amount</span><span class="value">${c.amount || 'N/A'}</span></div>
                <div class="detail-item"><span class="label">Status</span><span class="value">${c.status}</span></div>
                <div class="detail-item"><span class="label">Date</span><span class="value">${new Date(c.created_at).toLocaleString('en-IN')}</span></div>
                ${c.filePath ? `<div class="detail-item"><span class="label">Image</span><span class="value"><button class="btn-image" onclick="viewImage('${API_BASE}/uploads/${c.filePath}')">View Image</button></span></div>` : ''}
            `;
            detailModal.classList.add('active');
        }
    } catch (err) {
        showToast('Error loading details', 'error');
    }
}

saveStatusBtn.addEventListener('click', async () => {
    if (!currentComplaintId) return;
    try {
        const res = await fetch(API_BASE + '/api/complaints/' + currentComplaintId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: detailStatus.value })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Status updated!', 'success');
            detailModal.classList.remove('active');
            loadComplaints();
            loadStats();
        }
    } catch (err) {
        showToast('Error updating status', 'error');
    }
});

function viewImage(src) {
    imagePreview.src = src;
    imageModal.classList.add('active');
}

function confirmDelete(id) {
    deleteTargetId = id;
    confirmModal.classList.add('active');
}

confirmDeleteBtn.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    try {
        const res = await fetch(API_BASE + '/api/complaints/' + deleteTargetId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Complaint deleted!', 'success');
            confirmModal.classList.remove('active');
            loadComplaints();
            loadStats();
        }
    } catch (err) {
        showToast('Error deleting', 'error');
    }
});

closeDetail.addEventListener('click', () => detailModal.classList.remove('active'));
closeImage.addEventListener('click', () => imageModal.classList.remove('active'));
cancelDelete.addEventListener('click', () => confirmModal.classList.remove('active'));

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadComplaints, 400);
});
statusFilter.addEventListener('change', loadComplaints);
refreshBtn.addEventListener('click', () => {
    loadComplaints();
    loadStats();
    showToast('Data refreshed!', 'success');
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
});

checkLogin();
