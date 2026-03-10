// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    loadDashboard();
    
    const createTeamForm = document.getElementById('createTeamForm');
    if (createTeamForm) {
        createTeamForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createTeam();
        });
    }
});

async function loadDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update user info
    document.getElementById('userUsername').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;
    
    // Load user profile with picture
    await loadUserProfile();
    
    // Load user's teams
    await loadUserTeams();
    
    // Load user's leagues
    await loadUserLeagues();
    
    // Load stats
    await loadUserStats();
}

async function loadUserProfile() {
    try {
        const response = await fetchWithAuth(`${API_URL}/users/profile`);
        if (!response) return;
        
        const data = await response.json();
        const user = data.user;
        
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('userUsername').textContent = user.username;
        document.getElementById('userEmail').textContent = user.email;
        
        // Update location
        const locationEl = document.getElementById('profileLocation');
        if (locationEl) {
            locationEl.textContent = user.location ? `📍 Location: ${user.location}` : '📍 Location: Not set';
        }
        
        const joinDate = new Date(user.created_at).toLocaleDateString();
        document.getElementById('joinDate').textContent = `Joined: ${joinDate}`;
        
        // Update profile picture
        updateProfilePicture(user.profile_picture);
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfilePicture(profilePicture) {
    const avatarElements = document.querySelectorAll('.profile-avatar-large, .profile-avatar');
    
    avatarElements.forEach(avatar => {
        if (profilePicture) {
            avatar.innerHTML = `<img src="${profilePicture}" alt="Profile Picture" onerror="this.parentElement.innerHTML='👤'">`;
        } else {
            avatar.innerHTML = '👤';
        }
    });
}

async function loadUserTeams() {
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/user`);
        if (!response) return;
        
        const data = await response.json();
        const teamsList = document.getElementById('teamsList');
        
        if (data.teams && data.teams.length > 0) {
            teamsList.innerHTML = data.teams.map(team => `
                <div class="team-card">
                    <h3>${team.name}</h3>
                    <p>Game: ${team.game}</p>
                    <p>${team.description || 'No description'}</p>
                    <div class="card-footer">
                        <span class="game-tag">${team.members_count || 0} members</span>
                    </div>
                </div>
            `).join('');
        } else {
            teamsList.innerHTML = '<p>No teams yet. Create or join a team!</p>';
        }
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

async function loadUserLeagues() {
    try {
        const response = await fetchWithAuth(`${API_URL}/leagues/user`);
        if (!response) return;
        
        const data = await response.json();
        const leaguesList = document.getElementById('leaguesList');
        
        if (data.leagues && data.leagues.length > 0) {
            // Load payment status for each league
            const leaguesWithPayments = await Promise.all(data.leagues.map(async (league) => {
                try {
                    const paymentResponse = await fetchWithAuth(`${API_URL}/leagues/details/${league.id}`);
                    if (paymentResponse) {
                        const paymentData = await paymentResponse.json();
                        const userPayment = paymentData.league.members.find(m => m.user_id === getCurrentUser().id);
                        league.payment_status = userPayment?.payment_status || 'unpaid';
                        league.member_status = userPayment?.status || 'pending';
                    }
                } catch (error) {
                    console.error('Error loading payment status:', error);
                }
                return league;
            }));
            
            leaguesList.innerHTML = leaguesWithPayments.map(league => `
                <div class="league-card">
                    <h3>${league.name}</h3>
                    <p>Game: ${league.game}</p>
                    <p>${league.description || 'No description'}</p>
                    <div class="card-footer">
                        <span class="status-badge ${league.member_status === 'approved' ? 'approved' : 'pending'}">
                            ${league.member_status === 'approved' ? 'Approved' : 'Pending Approval'}
                        </span>
                        <span class="status-badge ${league.payment_status === 'paid' || league.payment_status === 'confirmed' ? 'paid' : 'unpaid'}">
                            ${league.payment_status === 'paid' || league.payment_status === 'confirmed' ? 'Paid' : 'Payment Pending'}
                        </span>
                        ${league.payment_status !== 'paid' && league.payment_status !== 'confirmed' ? 
                            `<button class="btn btn-small" onclick="window.location.href='payment.html?league_id=${league.id}'">Complete Payment</button>` : 
                            ''}
                    </div>
                </div>
            `).join('');
        } else {
            leaguesList.innerHTML = '<p>You haven\'t joined any leagues yet.</p>';
        }
    } catch (error) {
        console.error('Error loading leagues:', error);
    }
}

async function loadUserStats() {
    try {
        const response = await fetchWithAuth(`${API_URL}/users/stats`);
        if (!response) return;
        
        const data = await response.json();
        document.getElementById('statTeams').textContent = data.teams_count || 0;
        document.getElementById('statLeagues').textContent = data.leagues_count || 0;
        document.getElementById('statWins').textContent = data.wins || 0;
        document.getElementById('statRank').textContent = data.rank || 'N/A';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function showSection(section) {
    const sections = document.querySelectorAll('.dashboard-section');
    const menuItems = document.querySelectorAll('.menu-item');
    
    sections.forEach(s => s.classList.remove('active'));
    menuItems.forEach(m => m.classList.remove('active'));
    
    const sectionId = `${section}-section`;
    document.getElementById(sectionId).classList.add('active');
    
    event.target.classList.add('active');
}

function showCreateTeamModal() {
    document.getElementById('teamModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

async function createTeam() {
    const teamName = document.getElementById('teamName').value;
    const teamGame = document.getElementById('teamGame').value;
    const teamDescription = document.getElementById('teamDescription').value;
    
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/create`, {
            method: 'POST',
            body: JSON.stringify({
                name: teamName,
                game: teamGame,
                description: teamDescription
            })
        });
        
        if (!response) return;
        const data = await response.json();
        
        if (response.ok) {
            alert('Team created successfully!');
            closeModal('teamModal');
            document.getElementById('createTeamForm').reset();
            await loadUserTeams();
        } else {
            alert(data.message || 'Error creating team');
        }
    } catch (error) {
        alert('Error creating team');
        console.error('Error:', error);
    }
}

function editProfile() {
    alert('Profile editing feature coming soon!');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('teamModal');
    if (event.target == modal) {
        modal.classList.remove('show');
    }
}

// Profile picture upload functionality
document.addEventListener('DOMContentLoaded', function() {
    const profilePictureInput = document.getElementById('profilePictureInput');
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', handleProfilePictureUpload);
    }
});

async function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showUploadStatus('Please select a valid image file (JPEG, PNG, GIF)', 'error');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showUploadStatus('File size must be less than 5MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
        showUploadStatus('Uploading...', 'success');
        
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showUploadStatus('Profile picture updated successfully!', 'success');
            updateProfilePicture(data.profilePicture);
            
            // Update stored user data
            const user = getCurrentUser();
            if (user) {
                user.profile_picture = data.profilePicture;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } else {
            showUploadStatus(data.message || 'Upload failed', 'error');
        }
    } catch (error) {
        showUploadStatus('Upload failed: ' + error.message, 'error');
    }
}

function showUploadStatus(message, type) {
    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = message;
    statusEl.className = `upload-status ${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}
