


const SUPABASE_URL = "https://qttkszohpbssfaaefluo.supabase.co";

const SUPABASE_KEY = "sb_publishable_ZzNeLjreAdtScCHG20SLVA_QEkwZpsf ";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadTeams() {
    const { data, error } = await supabaseClient
        .from("teams")
        .select("*")
        .order("id");

    const teamsList = document.getElementById("teams-list");

    if (error) {
        teamsList.textContent = "Could not load teams.";
        console.log(error);
        return;
    }

    teamsList.innerHTML = "";

    data.forEach(team => {
        const teamElement = document.createElement("p");
        teamElement.textContent = team.name;
        teamsList.appendChild(teamElement);
    });
}

loadTeams();

async function loadFixtures() {
    const fixturesList = document.getElementById("fixtures-list");
    const teamFilter = document.getElementById("team-filter");

    const { data: matches, error: matchError } =
        await supabaseClient
            .from("matches")
            .select("*")
            .order("match_week");

    if (matchError) {
        fixturesList.textContent = "Could not load fixtures.";
        return;
    }

    const { data: teams, error: teamError } =
        await supabaseClient
            .from("teams")
            .select("id, name")
            .order("name");

    if (teamError) {
        fixturesList.textContent = "Could not load teams.";
        return;
    }

    teamFilter.innerHTML =
        '<option value="">Select a Department</option>';

    teams.forEach(team => {
        const option = document.createElement("option");
        option.value = team.id;
        option.textContent = team.name;
        teamFilter.appendChild(option);
    });

    function showFixtures() {
        const selectedTeam = teamFilter.value;

        fixturesList.innerHTML = "";

        if (!selectedTeam) {
            fixturesList.textContent =
                "Select a department to see fixtures.";
            return;
        }

        const teamMatches = matches.filter(match =>
            match.team1_id == selectedTeam ||
            match.team2_id == selectedTeam
        );

        // CALCULATE TEAM POSITIONS
        const standings = teams.map(team => ({
            id: team.id,
            name: team.name,
            points: 0,
            gf: 0,
            ga: 0
        }));

        matches.forEach(match => {
            if (match.team1_score === null || match.team2_score === null) {
                return;
            }

            const home = standings.find(t => t.id == match.team1_id);
            const away = standings.find(t => t.id == match.team2_id);

            if (!home || !away) return;

            home.gf += match.team1_score;
            home.ga += match.team2_score;
            away.gf += match.team2_score;
            away.ga += match.team1_score;

            if (match.team1_score > match.team2_score) {
                home.points += 3;
            } else if (match.team1_score < match.team2_score) {
                away.points += 3;
            } else {
                home.points += 1;
                away.points += 1;
            }
        });

        standings.sort((a, b) =>
            b.points - a.points ||
            (b.gf - b.ga) - (a.gf - a.ga) ||
            b.gf - a.gf
        );

        const position = standings.findIndex(
            t => t.id == selectedTeam
        ) + 1;

        const positionBox = document.createElement("h3");
        positionBox.textContent =
            `League Position: ${position}`;
        fixturesList.appendChild(positionBox);
      

        teamMatches.forEach(match => {
            const team1 = teams.find(t => t.id === match.team1_id);
            const team2 = teams.find(t => t.id === match.team2_id);

            const card = document.createElement("div");
            card.className = "match";

card.innerHTML = `
    <p class="match-week">WEEK ${match.match_week}</p>

    <div class="match-teams">
        <div class="team-side">
            <small>HOME</small>
            <h3>${team1 ? team1.name : "Unknown"}</h3>
        </div>

        <div class="match-score">
            <strong>
                ${match.team1_score ?? "-"}
                :
                ${match.team2_score ?? "-"}
            </strong>
        </div>

        <div class="team-side">
            <small>AWAY</small>
            <h3>${team2 ? team2.name : "Unknown"}</h3>
        </div>
    </div>

    <p class="match-status">${match.status}</p>
`;


          

          

            fixturesList.appendChild(card);
        });
    }

    teamFilter.addEventListener("change", showFixtures);
    showFixtures();
}

async function loadTopScorers() {
    const container = document.getElementById("scorers-container");

    const { data, error } = await supabaseClient
        .from("top_scorers")
        .select("player_name, goals, teams(name)")
        .order("goals", { ascending: false });

    if (error) {
        container.textContent = "Could not load top scorers.";
        return;
    }

    if (data.length === 0) {
        container.textContent = "No goals recorded yet.";
        return;
    }

    container.innerHTML = `
        <table>
            <tr>
                <th>Pos</th>
                <th>Player</th>
                <th>Department</th>
                <th>Goals</th>
            </tr>
            ${data.map((player, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${player.player_name}</td>
                    <td>${player.teams?.name || "Unknown"}</td>
                    <td>${player.goals}</td>
                </tr>
            `).join("")}
        </table>
    `;
}



loadTeams();
loadFixtures();
async function loadLeagueTable() {
    const container = document.getElementById("table-container");

    const { data: teams, error: teamError } =
        await supabaseClient.from("teams").select("*");

    const { data: matches, error: matchError } =
        await supabaseClient.from("matches").select("*");

    if (teamError || matchError) {
        container.textContent = "Could not load league table.";
        console.log(teamError || matchError);
        return;
    }

    const table = teams.map(team => ({
        name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        points: 0
    }));

    matches.forEach(match => {
        if (match.team1_score == null || match.team2_score == null) return;

        const a = table.find(t => t.name ===
            teams.find(x => x.id === match.team1_id)?.name);

        const b = table.find(t => t.name ===
            teams.find(x => x.id === match.team2_id)?.name);

        if (!a || !b) return;

        a.played++;
        b.played++;

        a.gf += match.team1_score;
        a.ga += match.team2_score;
        b.gf += match.team2_score;
        b.ga += match.team1_score;

        if (match.team1_score > match.team2_score) {
            a.won++;
            b.lost++;
            a.points += 3;
        } else if (match.team1_score < match.team2_score) {
            b.won++;
            a.lost++;
            b.points += 3;
        } else {
            a.drawn++;
            b.drawn++;
            a.points++;
            b.points++;
        }
    });

    table.sort((a, b) =>
        b.points - a.points ||
        (b.gf - b.ga) - (a.gf - a.ga) ||
        b.gf - a.gf
    );

    container.innerHTML = `
        <table>
            <tr>
    <th>Pos</th>
    <th>Team</th>
    <th>P</th>
    <th>W</th>
    <th>D</th>
    <th>L</th>
    <th>GF</th>
    <th>GA</th>
    <th>GD</th>
    <th>Pts</th>
</tr>
      
            ${table.map(t => `

<tr class="${table.indexOf(t) < 4 ? 'top-four top-' + (table.indexOf(t) + 1) : ''}">
           
<td>${table.indexOf(t) + 1}</td>
<td>${t.name}</td>                    
                    <td>${t.played}</td>
                    <td>${t.won}</td>
                    <td>${t.drawn}</td>
                    <td>${t.lost}</td>
                    <td>${t.gf}</td>
                    <td>${t.ga}</td>
                    <td>${t.gf - t.ga}</td>
                    <td>${t.points}</td>
                </tr>
            `).join("")}
        </table>
    `;
}
async function loadStatistics() {
    const { data: matches, error: matchError } =
        await supabaseClient
            .from("matches")
            .select("*");

    const { data: teams, error: teamError } =
        await supabaseClient
            .from("teams")
            .select("*");

    if (matchError || teamError) {
        console.log("Statistics loading error");
        return;
    }

    const playedMatches = matches.filter(
        match => match.status === "finished"
    );

    let totalGoals = 0;

    playedMatches.forEach(match => {
        totalGoals += Number(match.team1_score || 0);
        totalGoals += Number(match.team2_score || 0);
    });

    const teamGoals = teams.map(team => {
        let goals = 0;

        playedMatches.forEach(match => {
            if (Number(match.team1_id) === Number(team.id)) {
                goals += Number(match.team1_score || 0);
            }

            if (Number(match.team2_id) === Number(team.id)) {
                goals += Number(match.team2_score || 0);
            }
        });

        return {
            name: team.name,
            goals: goals
        };
    });

    teamGoals.sort((a, b) => b.goals - a.goals);

    document.getElementById("total-matches").textContent =
        playedMatches.length;

    document.getElementById("total-goals").textContent =
        totalGoals;

    document.getElementById("top-department").textContent =
        teamGoals.length > 0 && teamGoals[0].goals > 0
            ? teamGoals[0].name
            : "Not available";
}



async function loadPlayerTeams() {
    const select = document.getElementById("player-team");

    const { data, error } = await supabaseClient
        .from("teams")
        .select("id, name")
        .order("name");

    if (error) {
        select.innerHTML = '<option value="">Could not load departments</option>';
        return;
    }

    select.innerHTML = '<option value="">Select Department</option>';

    data.forEach(team => {
        const option = document.createElement("option");
        option.value = team.id;
        option.textContent = team.name;
        select.appendChild(option);
    });
}

document.getElementById("add-player-button").addEventListener("click", async function () {
    const name = document.getElementById("player-name").value.trim();
    const team = document.getElementById("player-team").value;
    const goals = document.getElementById("player-goals").value;
    const message = document.getElementById("player-message");

    if (!name || !team || goals === "") {
        message.textContent = "Please fill in all fields.";
        return;
    }

    const { error } = await supabaseClient
        .from("top_scorers")
        .insert({
            player_name: name,
            team_id: Number(team),
            goals: Number(goals)
        });

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Player added successfully!";
    document.getElementById("player-name").value = "";
    document.getElementById("player-goals").value = "0";

    loadTopScorers();
});

async function loadEditPlayers() {
    const select = document.getElementById("edit-player-select");

    const { data, error } = await supabaseClient
        .from("top_scorers")
        .select("id, player_name")
        .order("player_name");

    if (error) {
        select.innerHTML = '<option value="">Could not load players</option>';
        return;
    }

    select.innerHTML = '<option value="">Select Player</option>';

    data.forEach(player => {
        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = player.player_name;
        select.appendChild(option);
    });
}

document.getElementById("edit-player-select").addEventListener("change", async function () {
    const playerId = this.value;

    if (!playerId) return;

    const { data, error } = await supabaseClient
        .from("top_scorers")
        .select("*")
        .eq("id", Number(playerId))
        .single();

    if (error) {
        document.getElementById("edit-player-message").textContent = error.message;
        return;
    }

    document.getElementById("edit-player-name").value = data.player_name;
    document.getElementById("edit-player-goals").value = data.goals;
    document.getElementById("edit-player-team").value = data.team_id;
});


loadPlayerTeams();

async function loadEditTeams() {
    const select = document.getElementById("edit-player-team");

    const { data, error } = await supabaseClient
        .from("teams")
        .select("id, name")
        .order("name");

    if (error) return;

    select.innerHTML = '<option value="">Select Department</option>';

    data.forEach(team => {
        const option = document.createElement("option");
        option.value = team.id;
        option.textContent = team.name;
        select.appendChild(option);
    });
}

loadEditTeams();
loadEditPlayers();

document.getElementById("update-player-button").addEventListener("click", async function () {
    const playerId = document.getElementById("edit-player-select").value;
    const name = document.getElementById("edit-player-name").value.trim();
    const team = document.getElementById("edit-player-team").value;
    const goals = document.getElementById("edit-player-goals").value;
    const message = document.getElementById("edit-player-message");

    if (!playerId || !name || !team || goals === "") {
        message.textContent = "Please fill in all fields.";
        return;
    }

    const { error } = await supabaseClient
        .from("top_scorers")
        .update({
            player_name: name,
            team_id: Number(team),
            goals: Number(goals)
        })
        .eq("id", Number(playerId));

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Player updated successfully!";

    loadTopScorers();
    loadEditPlayers();

document.getElementById("delete-player-button").addEventListener("click", async function () {
    const playerId = document.getElementById("edit-player-select").value;
    const message = document.getElementById("delete-player-message");

    if (!playerId) {
        message.textContent = "Please select a player first.";
        return;
    }

    if (!confirm("Are you sure you want to delete this player?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("top_scorers")
        .delete()
        .eq("id", Number(playerId));

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Player deleted successfully!";

    document.getElementById("edit-player-name").value = "";
    document.getElementById("edit-player-goals").value = "";
    document.getElementById("edit-player-team").value = "";

    loadTopScorers();
    loadEditPlayers();
});

  
});

loadLeagueTable();
loadStatistics();


// ADMIN LOGIN
document.getElementById("login-button").addEventListener("click", async function () {
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;
    const message = document.getElementById("login-message");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        message.textContent = "Login failed: " + error.message;
        return;
    }

    message.textContent = "Login successful! Welcome, Admin.";
document.getElementById("score-management").style.display = "block";  
document.getElementById("player-management").style.display = "block";
    
});

// SAVE MATCH SCORE
document.getElementById("save-score-button").addEventListener("click", async function () {
    const matchId = document.getElementById("match-id").value;
    const score1 = document.getElementById("team1-score").value;
    const score2 = document.getElementById("team2-score").value;
    const message = document.getElementById("score-message");

    if (matchId === "" || score1 === "" || score2 === "") {
        message.textContent = "Please fill in all fields.";
        return;
    }

    const { error } = await supabaseClient
        .from("matches")
        .update({
            team1_score: Number(score1),
            team2_score: Number(score2),
            status: "finished"
        })
        .eq("id", Number(matchId));

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Score saved successfully!";

    loadFixtures();
    loadLeagueTable();
loadTopScorers();  
});

#player-editor {
    display: none;
}


