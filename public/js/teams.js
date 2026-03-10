// Teams functionality
let allTeams = [];

document.addEventListener('DOMContentLoaded', function() {
    loadTeams();
    
    const searchInput = document.getElementById('searchTeam');
    const gameFilter = document.getElementById('gameTeamFilter');
    const createTeamBtn = document.getElementById('createTeamBtn');
    
    if (searchInput) searchInput.addEventListener('input', filterTeams);
    if (gameFilter) gameFilter.addEventListener('change', filterTeams);
    
    if (getAuthToken()) {
        if (createTeamBtn) createTeamBtn.style.display = 'inline-block';
    }
    
    updateAuthMenu();
});

async function loadTeams() {
    try {
        const response = await fetch(`${API_URL}/teams/all`);
        const data = await response.json();
        
        allTeams = data.teams || [];
        displayTeams(allTeams);
    } catch (error) {
        console.error('Error loading teams:', error);
        document.getElementById('teamsContainer').innerHTML = '<p>Error loading teams</p>';
    }
}

function displayTeams(teams) {
    const container = document.getElementById('teamsContainer');
    
    if (!teams || teams.length === 0) {
        container.innerHTML = '<p>No teams available</p>';
        return;
    }
    
    container.innerHTML = teams.map(team => `
        <div class="team-card" onclick="showTeamDetails(${team.id})">
            <h3>${team.name}</h3>
            <p>${team.description || 'No description'}</p>
            <p>Leader: ${team.leader_name || 'Unknown'}</p>
            <div class="card-footer">
                <span class="game-tag">${team.game}</span>
                <span class="game-tag">${team.members_count || 0}/${team.max_members || 5}</span>
            </div>
        </div>
    `).join('');
}

function filterTeams() {
    const searchTerm = document.getElementById('searchTeam').value.toLowerCase();
    const gameFilter = document.getElementById('gameTeamFilter').value;
    
    const filtered = allTeams.filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(searchTerm);
        const matchesGame = !gameFilter || team.game === gameFilter;
        return matchesSearch && matchesGame;
    });
    
    displayTeams(filtered);
}

async function showTeamDetails(teamId) {
    try {
        const response = await fetch(`${API_URL}/teams/${teamId}`);
        const data = await response.json();
        const team = data.team;
        
        const modal = document.getElementById('teamModal');
        const detailsDiv = document.getElementById('teamDetails');
        
        const isJoined = getAuthToken() ? true : false;
        const user = getCurrentUser();
        const isLeader = user && user.id === team.leader_id;
        
        detailsDiv.innerHTML = `
            <h2>${team.name}</h2>
            <p><strong>Game:</strong> ${team.game}</p>
            <p><strong>Description:</strong> ${team.description || 'No description'}</p>
            <p><strong>Leader:</strong> ${team.leader_name || 'Unknown'}</p>
            <p><strong>Members:</strong> ${team.members_count || 0}/${team.max_members || 5}</p>
            
            <h3>Team Members</h3>
            <div class="member-list">
                ${(team.members || []).map(member => `
                    <div class="member-item">
                        <div class="member-avatar">👤 ${member.username}</div>
                        <span>${member.role || 'Member'}</span>
                    </div>
                `).join('') || '<p>No members</p>'}
            </div>
            
            <div style="margin-top: 2rem;">
                ${isLeader ? `
                    <button class="btn btn-secondary" onclick="manageTeam(${team.id})">Manage Team</button>
                ` : isJoined ? `
                    <button class="btn btn-primary" onclick="joinTeam(${team.id})">Join Team</button>
                ` : `
                    <p style="color: gray;">Please login to join teams</p>
                `}
            </div>
        `;
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Error loading team details:', error);
    }
}

async function joinTeam(teamId) {
    if (!requireAuth()) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${teamId}/join`, {
            method: 'POST'
        });
        
        if (!response) return;
        const data = await response.json();
        
        if (response.ok) {
            alert('Successfully joined team!');
            document.getElementById('teamModal').classList.remove('show');
            loadTeams();
        } else {
            alert(data.message || 'Error joining team');
        }
    } catch (error) {
        alert('Error joining team');
        console.error('Error:', error);
    }
}

function manageTeam(teamId) {
    window.location.href = `team-manage.html?id=${teamId}`;
}

function redirectToCreate() {
    if (requireAuth()) {
        window.location.href = 'dashboard.html?tab=teams';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('teamModal');
    if (event.target == modal) {
        modal.classList.remove('show');
    }
}
