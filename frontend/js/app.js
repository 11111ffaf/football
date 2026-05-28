document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

let selectedHomeTeam = null;
let selectedAwayTeam = null;

function initializeApp() {
    setupNavigation();
    setupSearchInputs();
    setupPredictButton();
    setupLeagueTags();
    setupDatabaseView();
    setupDatabaseSearch();
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.dataset.view;
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.getElementById(`${viewId}-view`).classList.add('active');
        });
    });
}

function setupSearchInputs() {
    const homeInput = document.getElementById('home-team');
    const awayInput = document.getElementById('away-team');
    const homeSuggestions = document.getElementById('home-suggestions');
    const awaySuggestions = document.getElementById('away-suggestions');
    
    let homeDebounceTimer;
    let awayDebounceTimer;
    
    homeInput.addEventListener('input', (e) => {
        clearTimeout(homeDebounceTimer);
        homeDebounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                const results = searchTeams(query);
                displaySuggestions(homeSuggestions, results, 'home');
            } else {
                homeSuggestions.classList.remove('show');
            }
        }, 300);
    });
    
    awayInput.addEventListener('input', (e) => {
        clearTimeout(awayDebounceTimer);
        awayDebounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                const results = searchTeams(query);
                displaySuggestions(awaySuggestions, results, 'away');
            } else {
                awaySuggestions.classList.remove('show');
            }
        }, 300);
    });
    
    homeInput.addEventListener('focus', () => {
        if (homeInput.value.trim().length >= 2) {
            const results = searchTeams(homeInput.value.trim());
            displaySuggestions(homeSuggestions, results, 'home');
        }
    });
    
    awayInput.addEventListener('focus', () => {
        if (awayInput.value.trim().length >= 2) {
            const results = searchTeams(awayInput.value.trim());
            displaySuggestions(awaySuggestions, results, 'away');
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.team-input-group')) {
            homeSuggestions.classList.remove('show');
            awaySuggestions.classList.remove('show');
        }
    });
}

function displaySuggestions(container, teams, type) {
    container.innerHTML = '';
    
    if (teams.length === 0) {
        container.innerHTML = '<div class="suggestion-item"><span class="team-name">未找到相关球队</span></div>';
    } else {
        teams.forEach(team => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <div class="team-logo-small" style="background: ${team.color || '#00f0ff'}">${(team.nameCn || team.name).substring(0, 2)}</div>
                <div class="team-info">
                    <div class="team-name">${team.nameCn || team.name}</div>
                    <div class="team-league">${team.leagueCn || team.league}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                selectTeam(team, type);
                container.classList.remove('show');
            });
            
            container.appendChild(item);
        });
    }
    
    container.classList.add('show');
}

function selectTeam(team, type) {
    const input = document.getElementById(type === 'home' ? 'home-team' : 'away-team');
    const badge = document.getElementById(`${type}-badge`);
    
    input.value = team.nameCn || team.name;
    
    if (type === 'home') {
        selectedHomeTeam = team;
    } else {
        selectedAwayTeam = team;
    }
    
    badge.innerHTML = `
        <div class="selected-team-badge">
            <span class="badge-logo" style="background: ${team.color || '#00f0ff'}">${(team.nameCn || team.name).substring(0, 2)}</span>
            <span class="badge-info">
                <strong>${team.leagueCn || team.league}</strong>
                <small>排名: 第${team.stats?.position || '-'}位</small>
            </span>
        </div>
    `;
}

function setupPredictButton() {
    const predictBtn = document.getElementById('predict-btn');
    
    predictBtn.addEventListener('click', async () => {
        if (!selectedHomeTeam || !selectedAwayTeam) {
            alert('请选择主队和客队');
            return;
        }
        
        if (selectedHomeTeam.id === selectedAwayTeam.id) {
            alert('主队和客队不能相同');
            return;
        }
        
        await runPrediction(selectedHomeTeam, selectedAwayTeam);
    });
}

async function runPrediction(homeTeam, awayTeam) {
    const loading = document.getElementById('loading');
    const resultsContent = document.getElementById('results-content');
    const predictBtn = document.getElementById('predict-btn');
    
    loading.classList.add('show');
    resultsContent.classList.remove('show');
    predictBtn.classList.add('loading');
    
    const steps = ['step-data', 'step-analyze', 'step-calculate', 'step-result'];
    
    try {
        for (let i = 0; i < steps.length; i++) {
            document.getElementById(steps[i]).classList.add('active');
            await sleep(800);
        }
        
        const result = await API.predictMatch(homeTeam, awayTeam);
        
        await sleep(500);
        
        displayResults(result, homeTeam, awayTeam);
        
        loading.classList.remove('show');
        resultsContent.classList.add('show');
        
        steps.forEach(step => {
            document.getElementById(step).classList.remove('active');
        });
        
    } catch (error) {
        console.error('预测失败:', error);
        alert('预测失败，请重试');
        loading.classList.remove('show');
    } finally {
        predictBtn.classList.remove('loading');
    }
}

function displayResults(result, homeTeam, awayTeam) {
    const homeName = homeTeam.nameCn || homeTeam.name;
    const awayName = awayTeam.nameCn || awayTeam.name;
    
    document.getElementById('result-home-name').textContent = homeName;
    document.getElementById('result-away-name').textContent = awayName;
    document.getElementById('result-home-league').textContent = homeTeam.leagueCn || homeTeam.league;
    document.getElementById('result-away-league').textContent = awayTeam.leagueCn || awayTeam.league;
    document.getElementById('result-home-logo').textContent = (homeName).substring(0, 2);
    document.getElementById('result-away-logo').textContent = (awayName).substring(0, 2);
    document.getElementById('result-home-logo').style.background = `linear-gradient(135deg, ${homeTeam.color || '#00f0ff'}, ${homeTeam.color || '#0099ff'})`;
    document.getElementById('result-away-logo').style.background = `linear-gradient(135deg, ${awayTeam.color || '#ff3366'}, ${awayTeam.color || '#ff006e'})`;
    
    document.getElementById('confidence-value').textContent = `${result.prediction.confidence}%`;
    
    document.getElementById('ft-home-pct').textContent = `${result.prediction.fullTime.home}%`;
    document.getElementById('ft-draw-pct').textContent = `${result.prediction.fullTime.draw}%`;
    document.getElementById('ft-away-pct').textContent = `${result.prediction.fullTime.away}%`;
    
    document.getElementById('ht-home-pct').textContent = `${result.prediction.halfTime.home}%`;
    document.getElementById('ht-draw-pct').textContent = `${result.prediction.halfTime.draw}%`;
    document.getElementById('ht-away-pct').textContent = `${result.prediction.halfTime.away}%`;
    
    document.getElementById('sh-home-pct').textContent = `${result.prediction.secondHalf.home}%`;
    document.getElementById('sh-draw-pct').textContent = `${result.prediction.secondHalf.draw}%`;
    document.getElementById('sh-away-pct').textContent = `${result.prediction.secondHalf.away}%`;
    
    const scoresHtml = result.prediction.scores.map((score, index) => {
        const probability = parseFloat(score.probability);
        const starRating = probability >= 30 ? '★★★' : probability >= 20 ? '★★' : '★';
        const isTopScore = index === 0;
        return `
            <div class="score-item ${isTopScore ? 'top-score' : ''}">
                <div class="score-ranking">${index + 1}</div>
                <span class="score">${score.home}:${score.away}</span>
                <span class="star-rating">${starRating}</span>
                <div class="score-bar-container">
                    <div class="score-bar">
                        <div class="bar-fill" style="width: ${score.probability}%"></div>
                    </div>
                </div>
                <span class="prob">${score.probability}%</span>
            </div>
        `;
    }).join('');
    document.getElementById('score-predictions').innerHTML = scoresHtml;
    
    document.getElementById('over-pct').textContent = `${result.prediction.overUnder.over}%`;
    document.getElementById('under-pct').textContent = `${result.prediction.overUnder.under}%`;
    
    document.getElementById('btts-yes-pct').textContent = `${result.prediction.bothTeamsToScore.yes}%`;
    document.getElementById('btts-no-pct').textContent = `${result.prediction.bothTeamsToScore.no}%`;
    
    document.getElementById('ai-analysis').innerHTML = result.prediction.analysis.split('\n').map(line => `<p>${line}</p>`).join('');
    
    const factors = result.data.factors;
    document.getElementById('factor-history').textContent = factors.history.impact;
    document.querySelector('#factor-history').closest('.factor-card').querySelector('.factor-bar .home').style.width = `${factors.history.homePercent}%`;
    document.querySelector('#factor-history').closest('.factor-card').querySelector('.factor-bar .away').style.width = `${factors.history.awayPercent}%`;
    
    document.getElementById('factor-form').textContent = factors.form.impact;
    document.querySelector('#factor-form').closest('.factor-card').querySelector('.factor-bar .home').style.width = `${factors.form.homePercent}%`;
    document.querySelector('#factor-form').closest('.factor-card').querySelector('.factor-bar .away').style.width = `${factors.form.awayPercent}%`;
    
    document.getElementById('factor-home').textContent = factors.home.impact;
    document.querySelector('#factor-home').closest('.factor-card').querySelector('.factor-bar .home').style.width = `${factors.home.homePercent}%`;
    document.querySelector('#factor-home').closest('.factor-card').querySelector('.factor-bar .away').style.width = `${factors.home.awayPercent}%`;
    
    document.getElementById('factor-injury').textContent = factors.injury.impact;
    document.querySelector('#factor-injury').closest('.factor-card').querySelector('.factor-bar .home').style.width = `${factors.injury.homePercent}%`;
    document.querySelector('#factor-injury').closest('.factor-card').querySelector('.factor-bar .away').style.width = `${factors.injury.awayPercent}%`;
    
    document.getElementById('factor-tactics').textContent = factors.tactics.impact;
    document.querySelector('#factor-tactics').closest('.factor-card').querySelector('.factor-bar .home').style.width = `${factors.tactics.homePercent}%`;
    document.querySelector('#factor-tactics').closest('.factor-card').querySelector('.factor-bar .away').style.width = `${factors.tactics.awayPercent}%`;
    
    document.getElementById('factor-fitness').textContent = factors.fitness.impact;
    document.getElementById('factor-motivation').textContent = factors.motivation.impact;
    document.getElementById('factor-market').textContent = factors.market.impact;
    
    document.getElementById('tactics-home-name').textContent = `${homeName}战术`;
    document.getElementById('tactics-away-name').textContent = `${awayName}战术`;
    document.getElementById('tactics-home-style').textContent = result.prediction.tactics.homeStyle;
    document.getElementById('tactics-home-formation').textContent = result.prediction.tactics.homeFormation;
    document.getElementById('tactics-home-strengths').textContent = result.prediction.tactics.homeStrengths.join('、');
    document.getElementById('tactics-home-weaknesses').textContent = result.prediction.tactics.homeWeaknesses.join('、');
    document.getElementById('tactics-away-style').textContent = result.prediction.tactics.awayStyle;
    document.getElementById('tactics-away-formation').textContent = result.prediction.tactics.awayFormation;
    document.getElementById('tactics-away-strengths').textContent = result.prediction.tactics.awayStrengths.join('、');
    document.getElementById('tactics-away-weaknesses').textContent = result.prediction.tactics.awayWeaknesses.join('、');
    document.getElementById('tactics-verdict-text').textContent = result.prediction.tactics.verdict;
    
    const stats = result.data.stats;
    document.getElementById('stats-home-name').textContent = homeName;
    document.getElementById('stats-away-name').textContent = awayName;
    document.getElementById('stat-home-points').textContent = stats.home.points;
    document.getElementById('stat-away-points').textContent = stats.away.points;
    
    const homeFormStr = stats.home.form.map(f => f ? '胜' : '负').join(' ');
    const awayFormStr = stats.away.form.map(f => f ? '胜' : '负').join(' ');
    document.getElementById('stat-home-form').textContent = homeFormStr;
    document.getElementById('stat-away-form').textContent = awayFormStr;
    
    document.getElementById('stat-home-homewin').textContent = `${stats.home.homeWinRate}%`;
    document.getElementById('stat-away-homewin').textContent = `${stats.away.homeWinRate}%`;
    document.getElementById('stat-home-awaywin').textContent = `${stats.away.awayWinRate}%`;
    document.getElementById('stat-away-awaywin').textContent = `${stats.home.awayWinRate}%`;
    document.getElementById('stat-home-goals').textContent = stats.home.avgGoals;
    document.getElementById('stat-away-goals').textContent = stats.away.avgGoals;
    document.getElementById('stat-home-conceded').textContent = stats.home.avgConceded;
    document.getElementById('stat-away-conceded').textContent = stats.away.avgConceded;
    document.getElementById('stat-home-possession').textContent = `${stats.home.possession}%`;
    document.getElementById('stat-away-possession').textContent = `${stats.away.possession}%`;
    document.getElementById('stat-home-shots').textContent = stats.home.shotsPerGame;
    document.getElementById('stat-away-shots').textContent = stats.away.shotsPerGame;
    
    const historyHtml = result.data.h2h.slice(0, 5).map(record => `
        <div class="history-item">
            <span class="date">${record.date}</span>
            <span class="home-team">${record.homeTeam}</span>
            <span class="score">${record.homeGoals} - ${record.awayGoals}</span>
            <span class="away-team">${record.awayTeam}</span>
            <span class="venue">${record.venue === homeName ? '主场' : '客场'}</span>
        </div>
    `).join('');
    document.getElementById('history-list').innerHTML = historyHtml;
    
    const homeInjuriesHtml = result.data.injuries.home.length > 0 
        ? result.data.injuries.home.map(player => `
            <div class="injury-item">
                <span class="player">${player}</span>
                <span class="reason">伤停</span>
                <span class="impact high">高</span>
            </div>
        `).join('')
        : '<p style="color: var(--text-muted); text-align: center;">阵容齐整</p>';
    document.getElementById('injuries-home').innerHTML = homeInjuriesHtml;
    document.getElementById('injuries-home-name').textContent = `${homeName}伤停`;
    
    const awayInjuriesHtml = result.data.injuries.away.length > 0 
        ? result.data.injuries.away.map(player => `
            <div class="injury-item">
                <span class="player">${player}</span>
                <span class="reason">伤停</span>
                <span class="impact high">高</span>
            </div>
        `).join('')
        : '<p style="color: var(--text-muted); text-align: center;">阵容齐整</p>';
    document.getElementById('injuries-away').innerHTML = awayInjuriesHtml;
    document.getElementById('injuries-away-name').textContent = `${awayName}伤停`;
    
    ChartRenderer.updateAllCharts(result.prediction);
}

function setupLeagueTags() {
    const leagueTags = document.querySelectorAll('.league-tag');
    
    leagueTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const league = tag.dataset.league;
            const teams = getTeamsByLeague(league);
            
            if (teams.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(teams.length, 5));
                const team = teams[randomIndex];
                
                document.querySelector('.nav-btn[data-view="predict"]').click();
                
                document.getElementById('home-team').value = team.nameCn || team.name;
                selectTeam(team, 'home');
            }
        });
    });
}

function setupDatabaseView() {
    const teamsGrid = document.getElementById('teams-grid');
    const allTeams = getAllTeams();
    
    teamsGrid.innerHTML = allTeams.map(team => `
        <div class="team-card" data-team-id="${team.id}">
            <div class="team-card-header">
                <div class="team-card-logo" style="background: linear-gradient(135deg, ${team.color || '#00f0ff'}, ${team.color || '#0099ff'})">
                    ${(team.nameCn || team.name).substring(0, 2)}
                </div>
                <div class="team-card-info">
                    <h4>${team.nameCn || team.name}</h4>
                    <span>${team.leagueCn || team.league} | ${team.countryCn || team.country}</span>
                </div>
            </div>
            <div class="team-card-stats">
                <div class="team-stat">
                    <div class="team-stat-value">${team.stats?.points || 50}</div>
                    <div class="team-stat-label">积分</div>
                </div>
                <div class="team-stat">
                    <div class="team-stat-value">${team.stats?.position || 10}</div>
                    <div class="team-stat-label">排名</div>
                </div>
                <div class="team-stat">
                    <div class="team-stat-value">${((team.stats?.homeWinRate || 0.5) * 100).toFixed(0)}%</div>
                    <div class="team-stat-label">主场胜率</div>
                </div>
                <div class="team-stat">
                    <div class="team-stat-value">${team.tactics?.style || '攻守平衡'}</div>
                    <div class="team-stat-label">战术</div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', () => {
            const teamId = card.dataset.teamId;
            const team = getTeamById(teamId);
            
            if (team) {
                document.querySelector('.nav-btn[data-view="predict"]').click();
                document.getElementById('home-team').value = team.nameCn || team.name;
                selectTeam(team, 'home');
            }
        });
    });
    
    setupFilterTabs();
}

function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filter = tab.dataset.filter;
            const teamsGrid = document.getElementById('teams-grid');
            let teams;
            
            if (filter === 'all') {
                teams = getAllTeams();
            } else {
                teams = getTeamsByRegion(filter);
            }
            
            teamsGrid.innerHTML = teams.map(team => `
                <div class="team-card" data-team-id="${team.id}">
                    <div class="team-card-header">
                        <div class="team-card-logo" style="background: linear-gradient(135deg, ${team.color || '#00f0ff'}, ${team.color || '#0099ff'})">
                            ${(team.nameCn || team.name).substring(0, 2)}
                        </div>
                        <div class="team-card-info">
                            <h4>${team.nameCn || team.name}</h4>
                            <span>${team.leagueCn || team.league} | ${team.countryCn || team.country}</span>
                        </div>
                    </div>
                    <div class="team-card-stats">
                        <div class="team-stat">
                            <div class="team-stat-value">${team.stats?.points || 50}</div>
                            <div class="team-stat-label">积分</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">${team.stats?.position || 10}</div>
                            <div class="team-stat-label">排名</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">${((team.stats?.homeWinRate || 0.5) * 100).toFixed(0)}%</div>
                            <div class="team-stat-label">主场胜率</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">${team.tactics?.style || '攻守平衡'}</div>
                            <div class="team-stat-label">战术</div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('.team-card').forEach(card => {
                card.addEventListener('click', () => {
                    const teamId = card.dataset.teamId;
                    const team = getTeamById(teamId);
                    
                    if (team) {
                        document.querySelector('.nav-btn[data-view="predict"]').click();
                        document.getElementById('home-team').value = team.nameCn || team.name;
                        selectTeam(team, 'home');
                    }
                });
            });
        });
    });
}

function setupDatabaseSearch() {
    const searchInput = document.getElementById('database-search');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        const teamsGrid = document.getElementById('teams-grid');
        const allTeams = getAllTeams();
        
        let filteredTeams = allTeams;
        
        if (query.length >= 2) {
            filteredTeams = allTeams.filter(team => 
                team.name.toLowerCase().includes(query) ||
                (team.nameCn && team.nameCn.includes(query)) ||
                team.league.toLowerCase().includes(query) ||
                (team.leagueCn && team.leagueCn.includes(query))
            );
        }
        
        teamsGrid.innerHTML = filteredTeams.map(team => `
            <div class="team-card" data-team-id="${team.id}">
                <div class="team-card-header">
                    <div class="team-card-logo" style="background: linear-gradient(135deg, ${team.color || '#00f0ff'}, ${team.color || '#0099ff'})">
                        ${(team.nameCn || team.name).substring(0, 2)}
                    </div>
                    <div class="team-card-info">
                        <h4>${team.nameCn || team.name}</h4>
                        <span>${team.leagueCn || team.league} | ${team.countryCn || team.country}</span>
                    </div>
                </div>
                <div class="team-card-stats">
                    <div class="team-stat">
                        <div class="team-stat-value">${team.stats?.points || 50}</div>
                        <div class="team-stat-label">积分</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${team.stats?.position || 10}</div>
                        <div class="team-stat-label">排名</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${((team.stats?.homeWinRate || 0.5) * 100).toFixed(0)}%</div>
                        <div class="team-stat-label">主场胜率</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${team.tactics?.style || '攻守平衡'}</div>
                        <div class="team-stat-label">战术</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', () => {
                const teamId = card.dataset.teamId;
                const team = getTeamById(teamId);
                
                if (team) {
                    document.querySelector('.nav-btn[data-view="predict"]').click();
                    document.getElementById('home-team').value = team.nameCn || team.name;
                    selectTeam(team, 'home');
                }
            });
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
