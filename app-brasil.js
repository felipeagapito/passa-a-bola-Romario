const DATA_URL = "data/copa.json";
const rounds = ["Round of 32", "Round of 16", "Quarterfinal", "Semifinal", "3rd Place Playoff", "Final"];
const favs = new Set(["FRA", "ESP", "ARG", "BRA", "POR", "ENG", "BEL"]);
const zebras = new Set(["MAR", "PAR", "CAN", "NOR", "EGY", "COL", "SUI", "MEX", "USA"]);
const fase = {"Round of 32":"Fase de 32","Round of 16":"Oitavas de final","Quarterfinal":"Quartas de final","Semifinal":"Semifinal","3rd Place Playoff":"Disputa do 3º lugar","Final":"Final"};
const statusPt = {Complete:"Encerrado",Finished:"Encerrado",Scheduled:"Agendado",Live:"Ao vivo"};
const nomes = {BRA:"Brasil",JPN:"Japão",RSA:"África do Sul",CAN:"Canadá",GER:"Alemanha",PAR:"Paraguai",NED:"Países Baixos",MAR:"Marrocos",CIV:"Costa do Marfim",NOR:"Noruega",FRA:"França",SWE:"Suécia",MEX:"México",ECU:"Equador",ENG:"Inglaterra",COD:"RD Congo",BEL:"Bélgica",SEN:"Senegal",USA:"Estados Unidos",BIH:"Bósnia e Herzegovina",ESP:"Espanha",POR:"Portugal",CRO:"Croácia",SUI:"Suíça",DZA:"Argélia",AUS:"Austrália",EGY:"Egito",ARG:"Argentina",CPV:"Cabo Verde",COL:"Colômbia",GHA:"Gana"};

function tNome(nome, codigo){
  if(codigo && nomes[codigo]) return nomes[codigo];
  if(!nome) return "A definir";
  return String(nome).replace(/^Winner /,"Vencedor do jogo ").replace(/^Loser /,"Perdedor do jogo ").replace(/^TBD/,"A definir");
}
function tFase(r){return fase[r] || r || "Fase a definir";}
function tStatus(s){return statusPt[s] || s || "A definir";}
function terminou(j){return String(j.status||"").toLowerCase().includes("complete") || String(j.status||"").toLowerCase().includes("finished") || Boolean(j.winner);}
function placar(j){
  if(j.home_score===null || j.home_score===undefined || j.away_score===null || j.away_score===undefined) return "Placar a definir";
  const base = `${j.home_score}–${j.away_score}`;
  return j.home_pen!==undefined || j.away_pen!==undefined ? `${base} · pênaltis ${j.home_pen ?? ""}–${j.away_pen ?? ""}` : base;
}
function mapaTimes(jogos){
  const times = new Map();
  for(const j of jogos){
    for(const lado of ["home","away"]){
      const codigo = j[`${lado}_code`];
      if(!codigo) continue;
      const nome = tNome(j[lado], codigo);
      if(nome.startsWith("Vencedor") || nome.startsWith("Perdedor")) continue;
      if(!times.has(codigo)) times.set(codigo,{codigo,nome,jogos:0,vitorias:0,gp:0,gc:0,vivo:false});
      const time = times.get(codigo); time.nome = nome;
      if(terminou(j)){
        time.jogos++;
        const gp = lado === "home" ? j.home_score : j.away_score;
        const gc = lado === "home" ? j.away_score : j.home_score;
        time.gp += Number(gp||0); time.gc += Number(gc||0);
        if(j.winner_code === codigo) time.vitorias++;
      }
    }
  }
  for(const j of jogos){
    if(!terminou(j)) for(const lado of ["home","away"]){const c=j[`${lado}_code`]; if(times.has(c)) times.get(c).vivo=true;}
  }
  return times;
}
function indice(t, notas){
  let n = 60 + t.vitorias*10 + Math.max(-8,Math.min(10,(t.gp-t.gc)*4));
  if(favs.has(t.codigo)) n += 11;
  if(zebras.has(t.codigo)) n += 5;
  if((notas[t.codigo]?.tier||"").toLowerCase().includes("favorito")) n += 4;
  if(t.gc >= 2) n -= 6;
  if(!t.vivo) n -= 22;
  return Math.max(0,Math.min(99,Math.round(n)));
}
function kpis(d,times){
  const jogos=d.matches||[], encerrados=jogos.filter(terminou).length, futuros=jogos.filter(j=>!terminou(j)).length, vivos=[...times.values()].filter(t=>t.vivo).length, pen=jogos.filter(j=>j.home_pen!==undefined||j.away_pen!==undefined).length;
  document.getElementById("kpis").innerHTML = [["⚽",encerrados,"Jogos encerrados","Resultados consolidados"],["📅",futuros,"Jogos pela frente","Agenda do mata-mata"],["🏆",vivos,"Seleções vivas","Ainda sonham com a taça"],["🎯",pen,"Decisões nos pênaltis","Alta tensão"]].map(x=>`<article class="kpi"><span class="kpi-icon">${x[0]}</span><small>${x[2]}</small><strong>${x[1]}</strong><em>${x[3]}</em></article>`).join("");
}
function ranking(d,times){
  const notas=d.team_notes||{};
  const lista=[...times.values()].filter(t=>t.vivo).map(t=>({...t,score:indice(t,notas)})).sort((a,b)=>b.score-a.score);
  document.getElementById("powerRanking").innerHTML=lista.map((t,i)=>`<div class="rank-row ${t.codigo==="BRA"?"is-brasil":""}"><div class="rank-num">#${i+1}</div><div class="team-main"><strong>${t.codigo==="BRA"?"🇧🇷 ":""}${t.nome} · ${t.codigo}</strong><span>${notas[t.codigo]?.tier||"Seleção monitorada"} — ${notas[t.codigo]?.narrative||"Sem nota editorial específica."}</span></div><div class="score">${t.score}</div></div>`).join("");
}
function proximos(d){
  document.getElementById("upcomingMatches").innerHTML=(d.matches||[]).filter(j=>!terminou(j)).slice(0,6).map(j=>`<article class="match-card ${j.home_code==="BRA"||j.away_code==="BRA"?"is-brasil":""}"><div class="match-meta">${j.date} · ${j.time_brt||"Horário a definir"} · ${tFase(j.round)}</div><div class="match-teams"><span>${tNome(j.home,j.home_code)}</span><span class="vs">x</span><span>${tNome(j.away,j.away_code)}</span></div></article>`).join("");
}
function alertas(d){document.getElementById("signals").innerHTML=(d.signals||[]).map(s=>`<article class="signal-card"><strong>${s.title}</strong><p>${s.body}</p></article>`).join("");}
function chave(d){
  const grupos=new Map(rounds.map(r=>[r,[]]));
  for(const j of d.matches||[]) if(grupos.has(j.round)) grupos.get(j.round).push(j);
  document.getElementById("bracket").innerHTML=[...grupos.entries()].map(([r,js])=>`<div class="round-col"><div class="round-title">${tFase(r)}</div>${js.map(j=>`<div class="bracket-match ${j.home_code==="BRA"||j.away_code==="BRA"?"is-brasil":""}"><div class="meta">${j.date} · ${j.time_brt||"Horário a definir"}</div><div class="line"><span>${tNome(j.home,j.home_code)}</span><strong>${j.home_score??""}</strong></div><div class="line"><span>${tNome(j.away,j.away_code)}</span><strong>${j.away_score??""}</strong></div><div class="meta">${tStatus(j.status)} · ${placar(j)}</div></div>`).join("")}</div>`).join("");
}
function tabela(d){document.getElementById("matchesTable").innerHTML=(d.matches||[]).map(j=>`<tr class="${j.home_code==="BRA"||j.away_code==="BRA"?"is-brasil-row":""}"><td>${j.date} ${j.time_brt||""}</td><td>${tFase(j.round)}</td><td>${tNome(j.home,j.home_code)} x ${tNome(j.away,j.away_code)} · ${placar(j)}</td><td>${tStatus(j.status)}</td><td>${j.winner_code?tNome(j.winner,j.winner_code):"—"}</td></tr>`).join("");}
async function main(){
  try{const r=await fetch(DATA_URL+"?v="+Date.now());const d=await r.json();document.getElementById("updateMode").textContent=d.source_mode==="api"?"Dados atualizados":"Base inicial ativa";document.getElementById("lastUpdated").textContent="Última atualização: "+(d.last_updated_brt||d.generated_at||"—");const times=mapaTimes(d.matches||[]);kpis(d,times);ranking(d,times);proximos(d);alertas(d);chave(d);tabela(d);}catch(e){document.getElementById("updateMode").textContent="Erro ao carregar";document.getElementById("lastUpdated").textContent=String(e);}
}
main();
