const API_BASE = 'http://localhost:3000';

const modalOverlay = document.getElementById('modalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMsg = document.getElementById('modalMsg');
const modalBtn = document.getElementById('modalBtn');

function showModal(icon, title, msg, isError = false) {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMsg.textContent = msg;
    modalBtn.className = 'modal-btn' + (isError ? ' error-btn' : '');
    modalOverlay.classList.add('active');
}

modalBtn.addEventListener('click', function () {
    modalOverlay.classList.remove('active');
});

const problemSelect = document.getElementById('problem');
const amountGroup = document.getElementById('amountGroup');
const uploadGroup = document.getElementById('uploadGroup');
const amountLabel = document.getElementById('amountLabel');
const uploadLabel = document.getElementById('uploadLabel');

problemSelect.addEventListener('change', function () {
    const val = this.value;

    amountGroup.classList.add('hidden');
    uploadGroup.classList.add('hidden');

    if (val === 'deposit') {
        amountLabel.textContent = 'Enter Deposit Amount';
        uploadLabel.textContent = 'Upload Payment Image';
        amountGroup.classList.remove('hidden');
        uploadGroup.classList.remove('hidden');
    } else if (val === 'withdrawal') {
        amountLabel.textContent = 'Enter Withdrawal Amount';
        uploadLabel.textContent = 'Upload Withdrawal Issue Image';
        amountGroup.classList.remove('hidden');
        uploadGroup.classList.remove('hidden');
    }
});

const submitBtn = document.getElementById('submitBtn');

document.getElementById('supportForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const password = document.getElementById('password').value.trim();
    const problem = document.getElementById('problem').value;
    const amount = document.getElementById('amount').value.trim();
    const fileInput = document.getElementById('fileUpload');
    const fileUpload = fileInput.files.length;

    if (!email || !mobile || !password || !problem) {
        showModal('❌', 'Error', 'Kripya saare fields fill karein.', true);
        return;
    }

    if (!amountGroup.classList.contains('hidden')) {
        if (!amount) {
            showModal('❌', 'Error', 'Kripya amount enter karein.', true);
            return;
        }
        if (!fileUpload) {
            showModal('❌', 'Error', 'Kripya image upload karein.', true);
            return;
        }
    }

    submitBtn.classList.add('loading');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('mobile', mobile);
    formData.append('password', password);
    formData.append('problem', problem);
    formData.append('amount', amount);
    if (fileInput.files.length > 0) {
        formData.append('fileUpload', fileInput.files[0]);
    }

    fetch(API_BASE + '/api/complaints', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        submitBtn.classList.remove('loading');
        if (data.success) {
            showModal('✅', 'Complain Submitted!', 'Aapki complain ho gai hai. 24 hours mein aapki problem fix kar di jayegi.');
            this.reset();
            amountGroup.classList.add('hidden');
            uploadGroup.classList.add('hidden');
        } else {
            showModal('❌', 'Error', data.message || 'Kuch gadbad hui. Dobara try karein.', true);
        }
    })
    .catch(() => {
        submitBtn.classList.remove('loading');
        showModal('❌', 'Error', 'Server se connect nahi ho paya. Dobara try karein.', true);
    });
});
