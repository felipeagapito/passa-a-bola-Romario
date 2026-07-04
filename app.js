const DATA_URL = "data/copa.json";
const roundOrder = ["Round of 32", "Round of 16", "Quarterfinal", "Semifinal", "3rd Place Playoff", "Final"];
const favoriteCodes = new Set(["FRA", "ESP", "ARG", "BRA", "POR", "ENG", "BEL"]);
const underdogCodes = new Set(["MAR", "PAR", "CAN", "NOR", "EGY", "COL", "SUI", "MEX", "USA"]);

function scoreText(match) {
  if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) return "—";
  const base = `${match.home_score}–${match.away_score}`;
  if (match.home_pen !== undefined || match.away_pen !== undefined) return `${base} · pên. ${match.home_pen ?? ""}–${match.away_pen ?? ""}`;
  return base;
}

function isComplete(match) {
  return String(match.status || "").toLowerCase().includes("complete") || String(match.status || "").toLowerCase().includes("finished") || Boolean(match.winner);
}

function teamMap(matches) {
  const teams = new Map();
  for (const m of matches) {
    for (const side of ["home", "away"]) {
      const name = m[side];
      const code = m[`${side}_code`];
      if (!name || !code || name.startsWith("Winner") || name.startsWith("Loser")) continue;
      if (!teams.has(code)) teams.set(code, { code, name, played: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, alive: false });
      const t = teams.get(code);
      if (isComplete(m)) {
        t.played += 1;
        const gf = side === "home" ? m.home_score : m.away_score;
        const ga = side === "home" ? m.away_score : m.home_score;
        t.goalsFor += Number(gf || 0);
        t.goalsAgainst += Number(ga || 0);
        if (m.winner_code === code) t.wins += 1;
      }
    }
  }
  for (const m of matches) {
    if (!isComplete(m)) {
      for (const side of ["home", "away"]) {
        const code = m[`${side}_code`];
        if (teams.has(code)) teams.get(code).alive = true;
      }
    }
  }
  return teams;
}

function powerIndex(team, notes = {}) {
  let score = 60;
  score += team.wins * 10;
  score += Math.max(-8, Math.min(10, (team.goalsFor - team.goalsAgainst) * 4));
  if (favoriteCodes.has(team.code)) score += 11;
  if (underdogCodes.has(team.code)) score += 5;
  if (notes[team.code]?.tier?.toLowerCase().includes("favorito")) score += 4;
  if (team.goalsAgainst >= 2) score -= 6;
  if (!team.alive) score -= 22;
  return Math.max(0, Math.min(99, Math.round(score)));
}

function renderKpis(data, teams) {
  const matches = data.matches || [];
  const complete = matches.filter(isComplete).length;
  const upcoming = matches.filter(m => !isComplete(m)).length;
  const alive = [...teams.values()].filter(t => t.alive).length;
  const penalties = matches.filter(m => m.home_pen !== undefined || m.away_pen !== undefined).length;
  document.getElementById("kpis").innerHTML = [
    [complete, "Jogos encerrados", "Base consolidada"],
    [upcoming, "Jogos futuros", "Agenda do mata-mata"],
    [alive, "Seleções vivas", "Com vaga no caminho atual"],
    [penalties, "Decisões nos pênaltis", "Alta volatilidade"]
  ].map(([value, label, sub]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong><em>${sub}</em></article>`).join("");
}

function renderRanking(data, teams) {
  const notes = data.team_notes || {};
  const ranked = [...teams.values()].filter(t => t.alive).map(t => ({ ...t, score: powerIndex(t, notes) })).sort((a,b) => b.score - a.score);
  document.getElementById("powerRanking").innerHTML = ranked.map((t, i) => `
    <div class="rank-row">
      <div class="rank-num">#${i + 1}</div>
      <div class="team-main"><strong>${t.name} · ${t.code}</strong><span>${notes[t.code]?.tier || "Seleção monitorada"} — ${notes[t.code]?.narrative || "Sem nota editorial específica."}</span></div>
      <div class="score">${t.score}</div>
    </div>`).join("");
}

function renderUpcoming(data) {
  const upcoming = (data.matches || []).filter(m => !isComplete(m)).slice(0, 6);
  document.getElementById("upcomingMatches").innerHTML = upcoming.map(m => `
    <article class="match-card"><div class="match-meta">${m.date} · ${m.time_brt || ""} · ${m.round}</div><div class="match-teams"><span>${m.home}</span><span class="vs">vs</span><span>${m.away}</span></div></article>
  `).join("");
}

function renderSignals(data) {
  const signals = data.signals || [];
  document.getElementById("signals").innerHTML = signals.map(s => `<article class="signal-card"><strong>${s.title}</strong><p>${s.body}</p></article>`).join("");
}

function renderBracket(data) {
  const byRound = new Map();
  for (const round of roundOrder) byRound.set(round, []);
  for (const m of data.matches || []) if (byRound.has(m.round)) byRound.get(m.round).push(m);
  document.getElementById("bracket").innerHTML = [...byRound.entries()].map(([round, matches]) => `
    <div class="round-col"><div class="round-title">${round}</div>${matches.map(m => `<div class="bracket-match"><div class="meta">${m.date} · ${m.time_brt || ""}</div><div class="line"><span>${m.home}</span><strong>${m.home_score ?? ""}</strong></div><div class="line"><span>${m.away}</span><strong>${m.away_score ?? ""}</strong></div><div class="meta">${m.status} · ${scoreText(m)}</div></div>`).join("")}</div>
  `).join("");
}

function renderTable(data) {
  document.getElementById("matchesTable").innerHTML = (data.matches || []).map(m => `
    <tr><td>${m.date} ${m.time_brt || ""}</td><td>${m.round}</td><td>${m.home} x ${m.away} · ${scoreText(m)}</td><td>${m.status}</td><td>${m.winner || "—"}</td></tr>
  `).join("");
}

async function main() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`);
    const data = await response.json();
    document.getElementById("updateMode").textContent = data.source_mode === "api" ? "Atualizado por API" : "Modo seed/fallback";
    document.getElementById("lastUpdated").textContent = `Última atualização: ${data.last_updated_brt || data.generated_at || "—"}`;
    const teams = teamMap(data.matches || []);
    renderKpis(data, teams);
    renderRanking(data, teams);
    renderUpcoming(data);
    renderSignals(data);
    renderBracket(data);
    renderTable(data);
  } catch (error) {
    document.getElementById("updateMode").textContent = "Erro ao carregar";
    document.getElementById("lastUpdated").textContent = String(error);
  }
}
main();
