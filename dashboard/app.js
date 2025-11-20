/**
 * CSonic Dashboard - Frontend JavaScript
 * Handles all dashboard interactions and API calls
 */

const API_BASE = window.location.origin;

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadDashboard();
    loadBusinesses();
    loadBookings();
    loadOrders();
    loadMessages();
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to selected
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Load data for the tab
            if (targetTab === 'dashboard') loadDashboard();
            else if (targetTab === 'businesses') loadBusinesses();
            else if (targetTab === 'bookings') loadBookings();
            else if (targetTab === 'orders') loadOrders();
            else if (targetTab === 'messages') loadMessages();
        });
    });
}

// Dashboard Loading
async function loadDashboard() {
    try {
        const [businesses, bookings, orders, messages] = await Promise.all([
            fetch(`${API_BASE}/api/businesses`).then(r => r.json()),
            fetch(`${API_BASE}/api/bookings?status=pending`).then(r => r.json()),
            fetch(`${API_BASE}/api/orders?status=pending`).then(r => r.json()),
            fetch(`${API_BASE}/api/messages?limit=10`).then(r => r.json())
        ]);

        document.getElementById('stat-businesses').textContent = businesses.length;
        document.getElementById('stat-bookings').textContent = bookings.length;
        document.getElementById('stat-orders').textContent = orders.length;
        document.getElementById('stat-messages').textContent = messages.length;

        // Show recent activity
        const activityHtml = messages.slice(0, 5).map(msg => `
            <div class="activity-item">
                <strong>${msg.direction === 'incoming' ? '📩' : '📤'} ${msg.customer_name || 'Customer'}</strong>
                <p>${msg.message_text.substring(0, 100)}${msg.message_text.length > 100 ? '...' : ''}</p>
                <small>${new Date(msg.timestamp).toLocaleString()}</small>
            </div>
        `).join('');

        document.getElementById('recent-activity').innerHTML = activityHtml || '<p>No recent activity</p>';
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Businesses Management
async function loadBusinesses() {
    try {
        const businesses = await fetch(`${API_BASE}/api/businesses`).then(r => r.json());
        const container = document.getElementById('businesses-list');

        if (businesses.length === 0) {
            container.innerHTML = '<p>No businesses found. Click "Add Business" to create one.</p>';
            return;
        }

        container.innerHTML = businesses.map(business => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${business.name}</div>
                    <div>
                        <button class="btn btn-secondary" onclick="editBusiness(${business.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deleteBusiness(${business.id})">Delete</button>
                    </div>
                </div>
                <div class="list-item-meta">
                    <span><strong>Type:</strong> ${business.type}</span>
                    <span><strong>Phone:</strong> ${business.phone_number}</span>
                    <span><strong>WhatsApp:</strong> ${business.whatsapp_number}</span>
                    <span><strong>Location:</strong> ${business.location || 'N/A'}</span>
                    <span><strong>AI:</strong> ${business.ai_enabled ? '✅' : '❌'}</span>
                </div>
            </div>
        `).join('');

        // Update filter dropdowns
        updateBusinessFilters(businesses);
    } catch (error) {
        console.error('Error loading businesses:', error);
    }
}

function updateBusinessFilters(businesses) {
    const selects = ['booking-filter-business', 'order-filter-business', 'message-filter-business', 'broadcast-business'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">All Businesses</option>' + 
                businesses.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            if (currentValue) select.value = currentValue;
        }
    });
}

function showAddBusinessModal() {
    document.getElementById('business-form').reset();
    document.getElementById('business-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Business';
    document.getElementById('business-modal').style.display = 'block';
}

function editBusiness(id) {
    fetch(`${API_BASE}/api/businesses/${id}`)
        .then(r => r.json())
        .then(business => {
            document.getElementById('business-id').value = business.id;
            document.getElementById('business-name').value = business.name;
            document.getElementById('business-type').value = business.type;
            document.getElementById('business-phone').value = business.phone_number;
            document.getElementById('business-whatsapp').value = business.whatsapp_number;
            document.getElementById('business-location').value = business.location || '';
            document.getElementById('business-language').value = business.language || 'en';
            document.getElementById('business-ai-enabled').checked = business.ai_enabled === 1;
            document.getElementById('modal-title').textContent = 'Edit Business';
            document.getElementById('business-modal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading business:', error);
            alert('Error loading business details');
        });
}

async function saveBusiness(event) {
    event.preventDefault();
    const id = document.getElementById('business-id').value;
    const data = {
        name: document.getElementById('business-name').value,
        type: document.getElementById('business-type').value,
        phone_number: document.getElementById('business-phone').value,
        whatsapp_number: document.getElementById('business-whatsapp').value,
        location: document.getElementById('business-location').value,
        language: document.getElementById('business-language').value,
        ai_enabled: document.getElementById('business-ai-enabled').checked
    };

    try {
        const url = id ? `${API_BASE}/api/businesses/${id}` : `${API_BASE}/api/businesses`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal('business-modal');
            loadBusinesses();
            loadDashboard();
        } else {
            const error = await response.json();
            alert('Error saving business: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving business:', error);
        alert('Error saving business');
    }
}

async function deleteBusiness(id) {
    if (!confirm('Are you sure you want to delete this business?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/businesses/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadBusinesses();
            loadDashboard();
        } else {
            alert('Error deleting business');
        }
    } catch (error) {
        console.error('Error deleting business:', error);
        alert('Error deleting business');
    }
}

// Bookings Management
async function loadBookings() {
    try {
        const businessId = document.getElementById('booking-filter-business')?.value || '';
        const status = document.getElementById('booking-filter-status')?.value || '';
        const url = `${API_BASE}/api/bookings?${businessId ? `businessId=${businessId}&` : ''}${status ? `status=${status}` : ''}`;
        
        const bookings = await fetch(url).then(r => r.json());
        const container = document.getElementById('bookings-list');

        if (bookings.length === 0) {
            container.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${booking.service_name || 'Service'}</div>
                    <span class="badge badge-${booking.status}">${booking.status}</span>
                </div>
                <div class="list-item-meta">
                    <span><strong>Customer:</strong> ${booking.customer_name || 'N/A'} (${booking.phone_number || 'N/A'})</span>
                    <span><strong>Date:</strong> ${booking.booking_date}</span>
                    <span><strong>Time:</strong> ${booking.booking_time}</span>
                    <span><strong>Business:</strong> ${booking.business_name || 'N/A'}</span>
                    ${booking.price ? `<span><strong>Price:</strong> R${parseFloat(booking.price).toFixed(2)}</span>` : ''}
                </div>
                <div style="margin-top: 10px;">
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-success" onclick="updateBookingStatus(${booking.id}, 'confirmed')">Confirm</button>
                        <button class="btn btn-danger" onclick="updateBookingStatus(${booking.id}, 'cancelled')">Cancel</button>
                    ` : ''}
                    ${booking.status === 'confirmed' ? `
                        <button class="btn btn-success" onclick="updateBookingStatus(${booking.id}, 'completed')">Mark Complete</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function updateBookingStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE}/api/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadBookings();
            loadDashboard();
        } else {
            alert('Error updating booking status');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Error updating booking');
    }
}

// Orders Management
async function loadOrders() {
    try {
        const businessId = document.getElementById('order-filter-business')?.value || '';
        const status = document.getElementById('order-filter-status')?.value || '';
        const url = `${API_BASE}/api/orders?businessId=${businessId || '1'}${status ? `&status=${status}` : ''}`;
        
        const orders = await fetch(url).then(r => r.json());
        const container = document.getElementById('orders-list');

        if (orders.length === 0) {
            container.innerHTML = '<p>No orders found.</p>';
            return;
        }

        container.innerHTML = orders.map(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            return `
                <div class="list-item">
                    <div class="list-item-header">
                        <div class="list-item-title">Order #${order.id}</div>
                        <span class="badge badge-${order.status}">${order.status}</span>
                    </div>
                    <div class="list-item-meta">
                        <span><strong>Customer:</strong> ${order.customer_name || 'N/A'} (${order.phone_number || 'N/A'})</span>
                        <span><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</span>
                        <span><strong>Total:</strong> R${parseFloat(order.total_amount).toFixed(2)}</span>
                        <span><strong>Delivery:</strong> ${order.delivery_type}</span>
                    </div>
                    <div class="order-items">
                        <strong>Items:</strong>
                        ${items.map(item => `
                            <div class="order-item">
                                <span>${item.name} x${item.quantity}</span>
                                <span>R${parseFloat(item.total).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 10px;">
                        ${order.status === 'pending' ? `
                            <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'confirmed')">Confirm</button>
                        ` : ''}
                        ${order.status === 'confirmed' ? `
                            <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'ready')">Mark Ready</button>
                        ` : ''}
                        ${order.status === 'ready' ? `
                            <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'delivered')">Mark Delivered</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = '<p>Error loading orders. Make sure to select a business.</p>';
    }
}

async function updateOrderStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE}/api/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadOrders();
            loadDashboard();
        } else {
            alert('Error updating order status');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Error updating order');
    }
}

// Messages Management
async function loadMessages() {
    try {
        const businessId = document.getElementById('message-filter-business')?.value || '';
        const direction = document.getElementById('message-filter-direction')?.value || '';
        const url = `${API_BASE}/api/messages?${businessId ? `businessId=${businessId}&` : ''}${direction ? `direction=${direction}&` : ''}limit=50`;
        
        const messages = await fetch(url).then(r => r.json());
        const container = document.getElementById('messages-list');

        if (messages.length === 0) {
            container.innerHTML = '<p>No messages found.</p>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <div class="message-item message-${msg.direction}">
                <div class="list-item-header">
                    <strong>${msg.direction === 'incoming' ? '📩 From' : '📤 To'}: ${msg.customer_name || 'Customer'}</strong>
                    <span>${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p>${msg.message_text}</p>
                ${msg.business_name ? `<small>Business: ${msg.business_name}</small>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Broadcasts Management
async function sendBroadcast(event) {
    event.preventDefault();
    const businessId = document.getElementById('broadcast-business').value;
    const message = document.getElementById('broadcast-message').value;

    if (!businessId || !message) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/messages/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, message, targetAudience: 'all' })
        });

        const result = await response.json();
        if (response.ok) {
            alert(`Broadcast sent to ${result.sent} customers!`);
            closeModal('broadcast-modal');
            document.getElementById('broadcast-form').reset();
        } else {
            alert('Error sending broadcast: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error sending broadcast:', error);
        alert('Error sending broadcast');
    }
}

function showBroadcastModal() {
    document.getElementById('broadcast-form').reset();
    document.getElementById('broadcast-modal').style.display = 'block';
}

// Modal Management
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

