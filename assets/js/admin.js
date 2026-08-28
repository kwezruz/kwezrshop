// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Modal functions
function openModal(type, userId = null) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        if (userId) {
            const userIdInput = modal.querySelector(`#${type}UserId`);
            if (userIdInput) {
                userIdInput.value = userId;
            }
        }
        modal.classList.add('active');
    }
}

function closeModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Edit service
function editService(service) {
    document.getElementById('editServiceId').value = service.id;
    document.getElementById('editServiceName').value = service.name;
    document.getElementById('editServicePrice').value = service.price;
    document.getElementById('editServiceMin').value = service.min_quantity;
    document.getElementById('editServiceMax').value = service.max_quantity;
    openModal('editService');
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Auto-hide alerts
setTimeout(() => {
    document.querySelectorAll('.alert').forEach(alert => {
        alert.style.transition = 'opacity 0.5s';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    });
}, 5000);