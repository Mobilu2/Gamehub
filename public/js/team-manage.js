// Team Management functionality
let currentTeamId = null;
let currentTeamData = {};

document.addEventListener('DOMContentLoaded', function() {
    // Get team ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentTeamId = urlParams.get('id');
    
    if (!currentTeamId) {
        alert('No team selected');
        window.location.href = 'teams.html';
        return;
    }
    
    // Verify user is authenticated
    if (!getAuthToken()) {
        alert('You must be logged in to manage teams');
        window.location.href = 'login.html';
        return;
    }
    
    loadTeamData();
    updateAuthMenu();
});

// Load initial team data
async function loadTeamData() {
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}`);
        if (!response.ok) {
            throw new Error('Failed to load team data');
        }
        
        const data = await response.json();
        currentTeamData = data.team;
        
        // Check if current user is the team leader
        const user = getCurrentUser();
        if (!user || user.id !== currentTeamData.leader_id) {
            alert('You do not have permission to manage this team');
            window.location.href = 'teams.html';
            return;
        }
        
        // Show danger zone for team leaders
        document.getElementById('danger').style.display = 'block';
        
        updateTeamHeader();
        loadTeamsOverview();
        loadTeamMembers();
        loadTeamMatches();
        loadTeamSettings();
    } catch (error) {
        console.error('Error loading team data:', error);
        alert('Error loading team data');
        window.location.href = 'teams.html';
    }
}

// Update team header with current data
function updateTeamHeader() {
    document.getElementById('teamName').textContent = currentTeamData.name;
    document.getElementById('teamGameInfo').textContent = `Game: ${currentTeamData.game}`;
    document.getElementById('memberCount').textContent = currentTeamData.members_count || 0;
    document.getElementById('winCount').textContent = currentTeamData.wins || 0;
    document.getElementById('matchCount').textContent = currentTeamData.total_matches || 0;
    document.getElementById('leagueCount').textContent = currentTeamData.leagues_count || 0;
}

// Load team overview
async function loadTeamsOverview() {
    try {
        const overviewContent = document.getElementById('overviewContent');
        overviewContent.innerHTML = `
            <div>
                <div class="form-group">
                    <label>Team Name</label>
                    <input type="text" value="${currentTeamData.name}" disabled>
                </div>
                <div class="form-group">
                    <label>Game</label>
                    <input type="text" value="${currentTeamData.game}" disabled>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea disabled>${currentTeamData.description || 'No description'}</textarea>
                </div>
                <div class="form-group">
                    <label>Members</label>
                    <input type="text" value="${currentTeamData.members_count || 0}/${currentTeamData.max_members || 5}" disabled>
                </div>
                <div class="form-group">
                    <label>Created At</label>
                    <input type="text" value="${new Date(currentTeamData.created_at).toLocaleDateString()}" disabled>
                </div>
                <div class="form-group">
                    <label>Team Leader</label>
                    <input type="text" value="${currentTeamData.leader_name || 'Unknown'}" disabled>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading overview:', error);
        document.getElementById('overviewContent').innerHTML = '<p style="color: #e74c3c;">Error loading team overview</p>';
    }
}

// Load team members list
async function loadTeamMembers() {
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}/manage`);
        if (!response.ok) {
            throw new Error('Failed to load team members');
        }
        
        const data = await response.json();
        const members = data.team.members || [];
        const membersContent = document.getElementById('membersContent');
        
        if (members.length === 0) {
            membersContent.innerHTML = '<p>No members yet</p>';
            return;
        }
        
        const membersList = members.map(member => `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-name">👤 ${member.username}</div>
                    <div class="member-role">Role: ${member.role || 'Member'}</div>
                </div>
                <div class="action-buttons">
                    ${member.id !== currentTeamData.leader_id ? `
                        <button class="btn-small warning" onclick="promoteMember(${member.id}, '${member.username}')">Promote</button>
                        <button class="btn-small danger" onclick="kickMember(${member.id}, '${member.username}')">Kick</button>
                    ` : '<span style="color: #a0a0a0;">Team Leader</span>'}
                </div>
            </div>
        `).join('');
        
        membersContent.innerHTML = membersList;
    } catch (error) {
        console.error('Error loading members:', error);
        document.getElementById('membersContent').innerHTML = '<p style="color: #e74c3c;">Error loading members</p>';
    }
}

// Kick a member from the team
async function kickMember(memberId, memberName) {
    if (!confirm(`Are you sure you want to kick ${memberName} from the team?`)) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}/members/${memberId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.message || 'Error kicking member');
            return;
        }
        
        alert(`${memberName} has been removed from the team`);
        loadTeamMembers();
        loadTeamData(); // Refresh team data to update member count
    } catch (error) {
        console.error('Error kicking member:', error);
        alert('Error kicking member');
    }
}

// Promote a member to co-leader
async function promoteMember(memberId, memberName) {
    if (!confirm(`Are you sure you want to promote ${memberName} to co-leader?`)) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}/members/${memberId}/promote`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'Co-Leader' })
        });
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.message || 'Error promoting member');
            return;
        }
        
        alert(`${memberName} has been promoted to co-leader`);
        loadTeamMembers();
    } catch (error) {
        console.error('Error promoting member:', error);
        alert('Error promoting member');
    }
}

// Load team settings
function loadTeamSettings() {
    document.getElementById('teamNameInput').value = currentTeamData.name;
    document.getElementById('teamDescInput').value = currentTeamData.description || '';
    document.getElementById('maxMembersInput').value = currentTeamData.max_members || 5;
    
    document.getElementById('settingsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateTeamSettings();
    });
}

// Update team settings
async function updateTeamSettings() {
    const name = document.getElementById('teamNameInput').value.trim();
    const description = document.getElementById('teamDescInput').value.trim();
    const maxMembers = parseInt(document.getElementById('maxMembersInput').value);
    
    if (!name) {
        alert('Team name is required');
        return;
    }
    
    if (maxMembers < 2) {
        alert('Max members must be at least 2');
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                max_members: maxMembers
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message || 'Error updating team settings');
            return;
        }
        
        alert('Team settings updated successfully');
        currentTeamData = { ...currentTeamData, name, description, max_members: maxMembers };
        updateTeamHeader();
    } catch (error) {
        console.error('Error updating settings:', error);
        alert('Error updating team settings');
    }
}

// Load team matches
async function loadTeamMatches() {
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}/matches`);
        const matchesContent = document.getElementById('matchesContent');
        
        if (!response.ok) {
            matchesContent.innerHTML = '<p>No matches data available</p>';
            return;
        }
        
        const data = await response.json();
        const matches = data.matches || [];
        
        if (matches.length === 0) {
            matchesContent.innerHTML = '<p>No matches yet</p>';
            return;
        }
        
        const matchesList = matches.map(match => `
            <div class="match-item" style="background: var(--dark-bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Match #${match.match_number}</strong>
                        <p style="margin: 0.5rem 0; color: #a0a0a0;">Status: ${match.status}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0;"><strong>${match.team_1_name || 'Team 1'}</strong> vs <strong>${match.team_2_name || 'Team 2'}</strong></p>
                        <p style="margin: 0.5rem 0; color: #a0a0a0;">Scheduled: ${match.scheduled_date ? new Date(match.scheduled_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        matchesContent.innerHTML = matchesList;
    } catch (error) {
        console.error('Error loading matches:', error);
        document.getElementById('matchesContent').innerHTML = '<p>No matches yet</p>';
    }
}

// Disband team
async function disbandTeam() {
    // Double-check that current user is still the team leader
    const user = getCurrentUser();
    if (!user || user.id !== currentTeamData.leader_id) {
        alert('You do not have permission to disband this team');
        return;
    }
    
    const confirmation = prompt(`Type "${currentTeamData.name}" to confirm team disbanding:`);
    
    if (confirmation !== currentTeamData.name) {
        alert('Confirmation does not match. Team not disbanded.');
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/teams/${currentTeamId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.message || 'Error disbanding team');
            return;
        }
        
        alert('Team has been disbanded successfully');
        window.location.href = 'teams.html';
    } catch (error) {
        console.error('Error disbanding team:', error);
        alert('Error disbanding team');
    }
}

// Show/hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked sidebar item
    event.target.classList.add('active');
}
