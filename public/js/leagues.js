// Leagues functionality
let allLeagues = [];

document.addEventListener('DOMContentLoaded', function() {
    loadLeagues();
    
    const searchInput = document.getElementById('searchLeague');
    const gameFilter = document.getElementById('gameFilter');
    
    if (searchInput) searchInput.addEventListener('input', filterLeagues);
    if (gameFilter) gameFilter.addEventListener('change', filterLeagues);
    
    updateAuthMenu();
    
    // Show create league button if logged in
    const token = localStorage.getItem('token');
    if (token && document.getElementById('createLeagueLink')) {
        document.getElementById('createLeagueLink').style.display = 'inline-block';
    }
});

async function loadLeagues() {
    try {
        const response = await fetch(`${API_URL}/leagues/all`);
        const data = await response.json();
        
        allLeagues = data.leagues || [];
        displayLeagues(allLeagues);
    } catch (error) {
        console.error('Error loading leagues:', error);
        document.getElementById('leaguesContainer').innerHTML = '<p>Error loading leagues</p>';
    }
}

function displayLeagues(leagues) {
    const container = document.getElementById('leaguesContainer');
    
    if (!leagues || leagues.length === 0) {
        container.innerHTML = '<p>No leagues available</p>';
        return;
    }
    
    container.innerHTML = leagues.map(league => {
        const entryFeeText = league.entry_fee === 0 || league.entry_fee === null ? 
            '<span style="color: #4CAF50;">Free</span>' : 
            `${league.entry_fee} TSH`;
        
        return `
        <div class="league-card" onclick="showLeagueDetails(${league.id})">
            <h3>${league.name}</h3>
            <p>${league.description || 'No description'}</p>
            <div class="card-footer">
                <span class="league-tag">${league.game}</span>
                <span class="game-tag">${league.participants || 0} players</span>
                <span class="fee-tag">Entry: ${entryFeeText}</span>
            </div>
        </div>
        `;
    }).join('');
}

function filterLeagues() {
    const searchTerm = document.getElementById('searchLeague').value.toLowerCase();
    const gameFilter = document.getElementById('gameFilter').value;
    
    const filtered = allLeagues.filter(league => {
        const matchesSearch = league.name.toLowerCase().includes(searchTerm);
        const matchesGame = !gameFilter || league.game === gameFilter;
        return matchesSearch && matchesGame;
    });
    
    displayLeagues(filtered);
}

async function showLeagueDetails(leagueId) {
    try {
        const response = await fetch(`${API_URL}/leagues/${leagueId}`);
        const data = await response.json();
        const league = data.league;
        
        const modal = document.getElementById('leagueModal');
        const detailsDiv = document.getElementById('leagueDetails');
        
        const token = getAuthToken();
        const isLoggedIn = token ? true : false;
        
        // Check if user is a member
        let isMember = false;
        if (isLoggedIn) {
            try {
                const memberResponse = await fetchWithAuth(`${API_URL}/leagues/${leagueId}/check-member`);
                const memberData = await memberResponse.json();
                isMember = memberData.isMember;
            } catch (error) {
                isMember = false;
            }
        }
        
        const entryFeeText = league.entry_fee === 0 || league.entry_fee === null ? 
            'Free' : `${league.entry_fee} TSH`;
        
        detailsDiv.innerHTML = `
            <h2>${league.name}</h2>
            <p><strong>Game:</strong> ${league.game}</p>
            <p><strong>Description:</strong> ${league.description || 'No description'}</p>
            <p><strong>Participants:</strong> ${league.participants || 0}</p>
            <p><strong>Entry Fee:</strong> ${entryFeeText}</p>
            <p><strong>Prize Pool:</strong> ${league.prize_pool || 'TBD'}</p>
            <h3>Standings</h3>
            <div class="standings">
                ${(league.standings || []).map((standing, index) => {
                    if (league.game === 'eFootball') {
                        return `
                            <div class="standing-item">
                                <span>#${index + 1}</span>
                                <span>${standing.team_name || 'Player'}</span>
                                <span>Joined</span>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="standing-item">
                                <span>#${index + 1}</span>
                                <span>${standing.team_name || 'Team'}</span>
                                <span>${standing.wins || 0}W</span>
                            </div>
                        `;
                    }
                }).join('') || '<p>No standings available</p>'}
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                ${isLoggedIn ? `
                    ${isMember ? `
                        <button class="btn btn-primary" onclick="openChat(${league.id})">💬 League Chat</button>
                        <button class="btn btn-secondary" onclick="viewLeagueMatches(${league.id})">View Matches</button>
                    ` : `
                        <button class="btn btn-primary" onclick="joinLeague(${league.id})">Join League</button>
                    `}
                ` : `
                    <p style="color: gray;">Please login to join leagues</p>
                `}
            </div>
        `;
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Error loading league details:', error);
    }
}

async function joinLeague(leagueId) {
    if (!requireAuth()) return;
    
    try {
        // First get league details to check game type
        const leagueResponse = await fetch(`${API_URL}/leagues/${leagueId}`);
        const leagueData = await leagueResponse.json();
        const league = leagueData.league;
        
        // Choose endpoint based on game type
        const endpoint = league.game === 'efootball' ? 
            `${API_URL}/leagues/${leagueId}/join-efootball` : 
            `${API_URL}/leagues/${leagueId}/join`;
        
        const response = await fetchWithAuth(endpoint, {
            method: 'POST'
        });
        
        if (!response) return;
        const data = await response.json();
        
        if (response.ok) {
            alert('Successfully joined league!');
            document.getElementById('leagueModal').classList.remove('show');
            loadLeagues();
        } else {
            alert(data.message || 'Error joining league');
        }
    } catch (error) {
        alert('Error joining league');
        console.error('Error:', error);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function openChat(leagueId) {
    window.location.href = `league-chat.html?league_id=${leagueId}`;
}

function viewLeagueMatches(leagueId) {
    window.location.href = `tournament-bracket.html?league_id=${leagueId}`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('leagueModal');
    if (event.target == modal) {
        modal.classList.remove('show');
    }
}
