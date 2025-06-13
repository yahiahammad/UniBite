// User search functionality
async function searchUsers() {
    const query = document.getElementById('userSearch').value;
    try {
        const response = await fetch(`/api/executive/users/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const users = await response.json();
        displaySearchResults(users, 'searchResults', 'deleteUser');
    } catch (error) {
        console.error('Error searching users:', error);
        alert('Error searching users');
    }
}

function displaySearchResults(items, resultsDivId, deleteFunction) {
    const resultsDiv = document.getElementById(resultsDivId);
    resultsDiv.innerHTML = '';

    if (items.length === 0) {
        resultsDiv.innerHTML = '<p>No results found</p>';
        return;
    }

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'card user-card';
        let detailsHtml = ``;
        if (resultsDivId === 'searchResults') {
            detailsHtml = `
                        <p class="card-text">Email: ${item.email}</p>
                        <p class="card-text">User Type: ${item.userType}</p>
                    `;
        } else if (resultsDivId === 'vendorSearchResults') {
            detailsHtml = `
                        <p class="card-text">Email: ${item.email}</p>
                        <p class="card-text">Location: ${item.location}</p>
                        <p class="card-text">Cuisine: ${item.cuisine}</p>
                    `;
        }

        itemCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        ${detailsHtml}
                        <button class="btn btn-danger" onclick="executiveUtils.${deleteFunction}('${item._id}')">Delete</button>
                    </div>
                `;
        resultsDiv.appendChild(itemCard);
    });
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/api/executive/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('User deleted successfully');
            searchUsers(); // Refresh the search results
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

// Vendor search functionality
async function searchVendors() {
    const query = document.getElementById('vendorSearch').value;
    try {
        const response = await fetch(`/api/executive/vendors/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const vendors = await response.json();
        displaySearchResults(vendors, 'vendorSearchResults', 'deleteVendor');
    } catch (error) {
        console.error('Error searching vendors:', error);
        alert('Error searching vendors');
    }
}

async function deleteVendor(vendorId) {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
        const response = await fetch(`/api/executive/vendors/${vendorId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('Vendor deleted successfully');
            searchVendors(); // Refresh the search results
        } else {
            throw new Error('Failed to delete vendor');
        }
    } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Error deleting vendor');
    }
}

// Restaurant creation functionality
function initRestaurantForm() {
    document.getElementById('restaurantForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            location: document.getElementById('location').value,
            cuisine: document.getElementById('cuisine').value,
            openingHours: document.getElementById('openingHours').value,
            closingHours: document.getElementById('closingHours').value
        };

        try {
            const response = await fetch('/api/executive/restaurants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Restaurant created successfully');
                e.target.reset();
            } else {
                throw new Error('Failed to create restaurant');
            }
        } catch (error) {
            console.error('Error creating restaurant:', error);
            alert('Error creating restaurant');
        }
    });
}

// Initialize executive dashboard
function initExecutiveDashboard() {
    initRestaurantForm();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initExecutiveDashboard);

// Export functions for use in other files
window.executiveUtils = {
    searchUsers,
    searchVendors,
    deleteUser,
    deleteVendor,
    initExecutiveDashboard
};