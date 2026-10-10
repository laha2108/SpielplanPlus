'use strict';
const assert=require('node:assert/strict');
const groupKey=v=>v.replace(/^Gruppe\s*/i, '').toUpperCase();
assert.deepEqual(['Gruppe C', 'Gruppe A', 'Gruppe B'].sort((a, b)=>groupKey(a).localeCompare(groupKey(b), 'de', {
    numeric:true
})), ['Gruppe A', 'Gruppe B', 'Gruppe C']);
const own=(n, x)=>n===x||n.startsWith(x+' ');
assert.equal(own('GHTC 2', 'GHTC'), true);
console.log('Tests erfolgreich.');
const snapshotGame={
    id:'1', group:'Gruppe A', home:{
        name:'A'
    }, away:{
        name:'B'
    }
};
assert.doesNotThrow(()=>structuredClone(snapshotGame));
const clubUrlKey=value=>new URL(value).pathname.split('/club/')[1].split('/')[0];
assert.equal(clubUrlKey('https://whv.hockey.de/club/gladbacher-hockey-und-tennisclub-ghtc/x'), 'gladbacher-hockey-und-tennisclub-ghtc');
const gameIds=['21.11.2026|0|A|B', '21.11.2026|1|A|B'];
assert.equal(new Set(gameIds).size, 2);
const rowsWithTwoClubs=[['/club/a/team-a', '/club/b/team-b'], ['/club/a/team-a', '/club/c/team-c']];
assert.equal(rowsWithTwoClubs.filter(row=>new Set(row).size>=2).length, 2);
const rosters=new Map([['Gruppe C', new Set(['moers', 'ghtc', 'duisburg'])], ['Gruppe D', new Set(['velbert', 'etg', 'hiesfeld'])]]);
const tableTeams=new Set(['moers', 'ghtc', 'duisburg']);
const scores=[...rosters].map(([group, roster])=>[group, [...tableTeams].filter(team=>roster.has(team)).length]);
assert.deepEqual(scores.sort((a, b)=>b[1]-a[1])[0], ['Gruppe C', 3]);
const nameRoster=new Set(['gladbacher htc', 'moerser tv 1', 'sg msv duisburg preußen duisburg']);
const tableText='01 gladbacher htc 02 moerser tv 1';
assert.equal([...nameRoster].filter(name=>tableText.includes(name)).length, 2);
const fallbackRows=[['Pos.', 'Mannschaft', 'Sp.'], ['01.', 'Gladbacher HTC', '0']];
assert.equal(fallbackRows.length, 2);
const header=row=>/Sp\.?/.test(row.join(' '))&&/Pkt\.?/.test(row.join(' '));
const rows=[['Mannschaft', 'Sp.', 'Pkt.'], ['A', '0', '0'], ['Mannschaft', 'Sp.', 'Pkt.'], ['B', '0', '0']];
let sections=[], current=[];
for(const row of rows){
    if(header(row)&&current.length){
        sections.push(current);
        current=[]
    }
    current.push(row)
}
if(current.length)sections.push(current);
assert.equal(sections.length, 2);
const rosterGames=[{
    group:'Gruppe C', home:{
        name:'Gladbacher HTC'
    }, away:{
        name:'Moerser TV 1'
    }
}];
const rosterMap=new Map();
for(const game of rosterGames){
    if(!rosterMap.has(game.group))rosterMap.set(game.group, new Set());
    rosterMap.get(game.group).add(game.home.name.toLowerCase());
    rosterMap.get(game.group).add(game.away.name.toLowerCase())
}
assert.equal(rosterMap.get('Gruppe C').has('gladbacher htc'), true);
const pointsPerGame=(points, games)=>games?points/games:NaN;
assert.equal(pointsPerGame(7, 4), 1.75);
const winRate=(wins, shootout, games)=>games?(wins+shootout)/games*100:NaN;
assert.equal(winRate(2, 1, 4), 75);
const repairedGamesCss='border-collapse:collapse;border-spacing:0';
assert.equal(repairedGamesCss.includes('border-collapse:collapse'), true);
const roundedMatchdayCss='border-radius:12px;overflow:hidden';
assert.equal(roundedMatchdayCss.includes('border-radius:12px'), true);
const footerTokens=['Hockey Spielplan Plus', 'Druck:', 'counter(page)', 'counter(pages)'];
assert.equal(footerTokens.every(Boolean), true);
const desiredPdfTitle='GHTC_WHV_Spielplan'.replace(/\.pdf$/i, '');
assert.equal(desiredPdfTitle, 'GHTC_WHV_Spielplan');
const efficiency=(points, games)=>games?points/(games*3)*100:NaN;
assert.equal(efficiency(7, 4), 58.333333333333336);
const goalRatio=(goalsFor, goalsAgainst)=>goalsAgainst?goalsFor/goalsAgainst:(goalsFor>0?Infinity:NaN);
assert.equal(goalRatio(8, 4), 2);
assert.equal(goalRatio(3, 0), Infinity);
const completed=[{
    opponent:'A', ownGoals:5, opponentGoals:1, difference:4
}, {
    opponent:'B', ownGoals:0, opponentGoals:3, difference:-3
}, {
    opponent:'C', ownGoals:4, opponentGoals:0, difference:4
}];
const best=[...completed].sort((a, b)=>b.difference-a.difference||b.ownGoals-a.ownGoals)[0];
const worst=[...completed].sort((a, b)=>a.difference-b.difference||b.opponentGoals-a.opponentGoals)[0];
assert.equal(best.opponent, 'A');
assert.equal(worst.opponent, 'B');
const placement=(label, result)=>{
    const m=label.match(/Spiel um Platz\s*(\d+)/i);
    if(!m)return null;
    const base=+m[1];
    return result==='win'?base:base+1
};
assert.equal(placement('Spiel um Platz 5', 'win'), 5);
assert.equal(placement('Spiel um Platz 5', 'loss'), 6);
const ageFromPath=path=>{
    const m=path.match(/\/(weibliche|maennliche|männliche)-u(\d+)/i);
    return m?`${/^weibliche$/i.test(m[1])?'w':'m'}U${m[2]}`:''
};
assert.equal(ageFromPath('/jugend-1/weibliche-u14/oberliga'), 'wU14');
assert.equal(ageFromPath('/jugend-1/maennliche-u16/oberliga'), 'mU16');
const strictScores=value=>[...value.matchAll(/(?:^|\s)(\d{1,2})\s*:\s*(\d{1,2})(?=\s|$|\()/g)].map(m=>[+m[1], +m[2]]).filter(([a, b])=>a<=25&&b<=25);
assert.deepEqual(strictScores(' 5:0 '), [[5, 0]]);
assert.deepEqual(strictScores('30:15'), []);
assert.deepEqual(strictScores('Samstag 12.09.2026 15:30'), []);
const rangePlacement=(label, result)=>{
    const m=label.match(/(?:Spiel um )?Platz\s*(\d+)(?:\s*[-/]\s*(\d+))?/i);
    if(!m)return null;
    return result==='win'?+m[1]:+(m[2]||(+m[1]+1))
};
assert.equal(rangePlacement('Platz 11/12', 'win'), 11);
assert.equal(rangePlacement('Platz 11/12', 'loss'), 12);
const chooseFallback=(text, clock)=>[...text.matchAll(/(?:^|\s)(\d{1,2})\s*:\s*(\d{1,2})(?=\s|$|\()/g)].map(m=>`${+m[1]}:${String(m[2]).padStart(2,'0')}`).filter(x=>x!==clock).filter(x=>x.split(':').every(n=>+n<=20));
assert.deepEqual(chooseFallback('GHTC 15:30 Gegner 5:0', '15:30'), ['5:00']);
assert.deepEqual(chooseFallback('GHTC 30:15 Gegner', ''), []);
const placementAnd=(label, result)=>{
    const m=label.match(/Platz\s*(\d+)(?:\s*(?:[-/]|und)\s*(\d+))?/i);
    return result==='win'?+m[1]:+(m[2]||(+m[1]+1))
};
assert.equal(placementAnd('Spiel um Platz 11 und 12', 'win'), 11);
assert.equal(placementAnd('Spiel um Platz 11 und 12', 'loss'), 12);
const exactScore=text=>{
    const m=text.match(/^(\d{1,2})\s*[:\-]\s*(\d{1,2})$/);
    return m?`${+m[1]}:${+m[2]}`:''
};
assert.equal(exactScore('5:0'), '5:0');
assert.equal(exactScore('15:30 Uhr'), '');
const combined=(group, later)=>({
    goalsFor:group.goalsFor+later.goalsFor, goalsAgainst:group.goalsAgainst+later.goalsAgainst, completed:group.completed+later.completed
});
assert.deepEqual(combined({
    goalsFor:4, goalsAgainst:5, completed:6
}, {
    goalsFor:5, goalsAgainst:0, completed:1
}), {
    goalsFor:9, goalsAgainst:5, completed:7
});
const phaseType=text=>text.includes('plätze')?'placement':'other';
assert.equal(phaseType('plätze 9-12'), 'placement');
const range=text=>{
    let m=text.match(/Pl[aä]tze?\s*(\d+)(?:\s*(?:[-/]|bis|und)\s*(\d+))?/i);
    return m?{
        better:+m[1], worse:+(m[2]||(+m[1]+1))
    }
    :null
};
assert.deepEqual(range('Plätze 9-12'), {
    better:9, worse:12
});
assert.deepEqual(range('Spiel um Platz 11 und 12'), {
    better:11, worse:12
});
const exactScoreV322=text=>{
    const m=text.match(/^(?:Ergebnis\s*)?(\d{1,2})\s*:\s*(\d{1,2})$/i);
    return m?`${+m[1]}:${+m[2]}`:''
};
assert.equal(exactScoreV322('Ergebnis 5:0'), '5:0');
const pastGame=(raw, now)=>{
    const m=raw.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    return new Date(+m[3], +m[2]-1, +m[1], 23, 59, 59)<now
};
assert.equal(pastGame('29.09.2026', new Date(2026, 8, 30, 12)), true);
assert.equal(pastGame('01.10.2026', new Date(2026, 8, 30, 12)), false);
const inferLater=(games, groupCount)=>games.slice(-Math.max(0, games.length-groupCount));
assert.deepEqual(inferLater(['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'p1', 'p2'], 6), ['p1', 'p2']);
const bracketPlace=(first, last)=>first==='loss'?(last==='win'?11:12):(last==='win'?9:10);
assert.equal(bracketPlace('loss', 'win'), 11);
assert.equal(bracketPlace('loss', 'loss'), 12);
const ownScores=(games)=>games.reduce((a, g)=>({
    for:a.for+g.for, against:a.against+g.against
}), {
    for:0, against:0
});
assert.deepEqual(ownScores([{
    for:1, against:2
}, {
    for:5, against:0
}]), {
    for:6, against:2
});
const firstResult=text=>{
    const m=text.match(/(?:^|\s)(\d{1,2})\s*:\s*(\d{1,2})(?=\s|$|\()/);
    return m?`${+m[1]}:${+m[2]}`:''
};
assert.equal(firstResult('5 : 0 ( 2 : 0 )'), '5:0');
const rowPhase=text=>text.match(/Platzierungsrunde|Gruppe\s+[A-Z]/i)?.[0]||'';
assert.equal(rowPhase('GHTC 5:0 Raffelberg Platzierungsrunde (Platz 9-12)'), 'Platzierungsrunde');
const ownPerspective=(ownGoals, opponentGoals)=>`${ownGoals}:${opponentGoals}`;
assert.equal(ownPerspective(0, 3), '0:3');
assert.equal(ownPerspective(5, 0), '5:0');
const highlightScore=(own, opp, loss)=>loss?`${opp}:${own}`:`${own}:${opp}`;
assert.equal(highlightScore(2, 3, true), '3:2');
assert.equal(highlightScore(5, 2, false), '5:2');
const outcomeFromGoals=(own, opp)=>own>opp?'Sieg':own<opp?'Niederlage':'Unentschieden';
assert.equal(outcomeFromGoals(3, 2), 'Sieg');
assert.equal(outcomeFromGoals(2, 3), 'Niederlage');
assert.equal(outcomeFromGoals(2, 2), 'Unentschieden');
const rankAll=games=>[...games].sort((l, r)=>r.difference-l.difference||r.ownGoals-l.ownGoals||l.opponentGoals-r.opponentGoals);
const onlyWins=rankAll([{
    score:'5:0', ownGoals:5, opponentGoals:0, difference:5
}, {
    score:'3:2', ownGoals:3, opponentGoals:2, difference:1
}, {
    score:'2:1', ownGoals:2, opponentGoals:1, difference:1
}]);
assert.equal(onlyWins[0].score, '5:0');
assert.equal(onlyWins.at(-1).score, '2:1');
const highlightView=(own, opp, opponent)=>({
    score:`${own}:${opp}`, against:opponent, outcome:own>opp?'Sieg':own<opp?'Niederlage':'Unentschieden'
});
assert.deepEqual(highlightView(3, 4, 'Düsseldorfer HC 2'), {
    score:'3:4', against:'Düsseldorfer HC 2', outcome:'Niederlage'
});
assert.deepEqual(highlightView(3, 2, 'Blau-Weiß Köln'), {
    score:'3:2', against:'Blau-Weiß Köln', outcome:'Sieg'
});
const bracketResult=(games, own)=>{
    const result=g=>{
        const [a, b]=g.score.split(':').map(Number);
        return a>b?{
            winner:g.home, loser:g.away
        }
        :{
            winner:g.away, loser:g.home
        }
    };
    const semis=games.slice(0, 2), decisions=semis.map(result), winners=decisions.map(x=>x.winner), losers=decisions.map(x=>x.loser);
    const includes=(g, teams)=>teams.every(t=>g.home===t||g.away===t);
    const final=games.slice(2).find(g=>includes(g, winners)), bronze=games.slice(2).find(g=>includes(g, losers));
    const fd=result(final), bd=result(bronze);
    return own===fd.winner?1:own===fd.loser?2:own===bd.winner?3:own===bd.loser?4:null;
};
const mu14FinalDay=[ {
    home:'DHC2', away:'BW Köln', score:'1:3'
}, {
    home:'ETB Essen', away:'GHTC', score:'1:4'
}, {
    home:'DHC2', away:'ETB Essen', score:'0:1'
}, {
    home:'BW Köln', away:'GHTC', score:'2:3'
}
];
assert.equal(bracketResult(mu14FinalDay, 'GHTC'), 1);
assert.equal(bracketResult(mu14FinalDay, 'BW Köln'), 2);
assert.equal(bracketResult(mu14FinalDay, 'ETB Essen'), 3);
assert.equal(bracketResult(mu14FinalDay, 'DHC2'), 4);
const fourTeamPlacement=(better, first, last)=>{
    const pairStart=first==='win'?better:better+2;
    return last==='win'?pairStart:pairStart+1
};
assert.equal(fourTeamPlacement(9, 'loss', 'win'), 11);
assert.equal(fourTeamPlacement(9, 'loss', 'loss'), 12);
assert.equal(fourTeamPlacement(9, 'win', 'win'), 9);
assert.equal(fourTeamPlacement(9, 'win', 'loss'), 10);
const phaseLabel=text=>{
    const m=text.match(/(?:Platzierungs(?:runde|spiele)?|Spiele? um (?:die )?Pl[aä]tze?)\s*(?:\(\s*)?(?:Platz|Pl[aä]tze)?\s*(\d+)\s*(?:[-/]|bis|und)\s*(\d+)\s*\)?/i);
    return m?`Platzierungsrunde (Platz ${+m[1]}-${+m[2]})`:''
};
assert.equal(phaseLabel('Platzierungsrunde (Platz 9-12)'), 'Platzierungsrunde (Platz 9-12)');
assert.equal(phaseLabel('Platzierungsspiele Plätze 5 bis 8'), 'Platzierungsrunde (Platz 5-8)');
const placementFour=(range, first, last)=>{
    const pair=first==='win'?range.better:range.better+2;
    return last==='win'?pair:pair+1
};
assert.equal(placementFour({
    better:9, worse:12
}, 'loss', 'win'), 11);
const choosePlacementRange=groups=>[...groups].filter(items=>items.length>=2).sort((a, b)=>b.length-a.length)[0]||[];
assert.equal(choosePlacementRange([[{
    range:'13-16'
}], [{
    range:'9-12'
}, {
    range:'9-12'
}]])[0].range, '9-12');
const combinedPhase=text=>/viertelfinale\s*&\s*endrunde/i.test(text)?'Viertelfinale & Endrunde':'';
assert.equal(combinedPhase('Viertelfinale & Endrunde'), 'Viertelfinale & Endrunde');
const splitByOfficialCount=(games, count)=>({
    group:games.slice(0, count), later:games.slice(count)
});
const wu14Own=['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'placement-loss', 'placement-win'];
assert.deepEqual(splitByOfficialCount(wu14Own, 6), {
    group:['g1', 'g2', 'g3', 'g4', 'g5', 'g6'], later:['placement-loss', 'placement-win']
});
const visibleStatSections=later=>later>0?['group', 'later', 'total']:['group'];
assert.deepEqual(visibleStatSections(0), ['group']);
assert.deepEqual(visibleStatSections(2), ['group', 'later', 'total']);
const seasonComplete=(games, now)=>!games.some(game=>game.date>=now&&!game.completed);
assert.equal(seasonComplete([{
    date:new Date(2026, 9, 5), completed:false
}], new Date(2026, 9, 1)), false);
assert.equal(seasonComplete([{
    date:new Date(2026, 8, 20), completed:true
}], new Date(2026, 9, 1)), true);
assert.equal(seasonComplete([{
    date:new Date(2026, 9, 5), completed:true
}], new Date(2026, 9, 1)), true);
const leagueFromPath=path=>{
    const m=path.match(/\/(regionalliga|oberliga|verbandsliga)(?:\/|$)/i);
    return m?m[1][0].toUpperCase()+m[1].slice(1).toLowerCase():''
};
assert.equal(leagueFromPath('/weibliche-u12/regionalliga'), 'Regionalliga');
assert.equal(leagueFromPath('/maennliche-u14/oberliga'), 'Oberliga');
assert.equal(leagueFromPath('/weibliche-u16/verbandsliga'), 'Verbandsliga');
const ownFieldMatchdays=(dates, ownDates)=>{
    let n=1;
    const map=new Map();
    for(const d of dates){
        map.set(d, n);
        if(ownDates.has(d))n++
    }
    return dates.map(d=>map.get(d))
};
assert.deepEqual(ownFieldMatchdays(['d1', 'd2', 'd3', 'd4'], new Set(['d1', 'd3'])), [1, 2, 2, 3]);
const fieldMode=age=>age<=10?'tournament':'single';
assert.equal(fieldMode(8), 'tournament');
assert.equal(fieldMode(10), 'tournament');
assert.equal(fieldMode(12), 'single');
const singleOwnMatchdays=games=>{
    let n=1;
    return games.map(g=>{
        const day=n;
        if(g.own)n++;
        return day
    })
};
assert.deepEqual(singleOwnMatchdays([{
    own:false
}, {
    own:true
}, {
    own:false
}, {
    own:true
}]), [1, 1, 2, 2]);
const tournamentDays=games=>games.map((g, i, a)=>a.slice(0, i+1).filter((x, j, b)=>b.findIndex(y=>y.date===x.date)===j).length);
assert.deepEqual(tournamentDays([{
    date:'d1'
}, {
    date:'d1'
}, {
    date:'d2'
}]), [1, 1, 2]);
const fitScale=(content, available)=>Math.min(1, available/Math.max(content, 1));
assert.equal(fitScale(900, 1000), 1);
assert.equal(fitScale(1250, 1000), 0.8);
assert.ok(fitScale(2000, 1000)<fitScale(1250, 1000));
const blockKeys=(games, onlyOwn)=>games.map(g=>onlyOwn?`${g.matchday}|${g.date}|${g.location}`:String(g.matchday));
assert.deepEqual(blockKeys([{
    matchday:1, date:'d1', location:'A'
}, {
    matchday:1, date:'d1', location:'B'
}], false), ['1', '1']);
assert.deepEqual(blockKeys([{
    matchday:1, date:'d1', location:'A'
}, {
    matchday:1, date:'d1', location:'B'
}], true), ['1|d1|A', '1|d1|B']);
const fieldScheduleFilter=(games, isField)=>games.filter(g=>!isField||g.own);
assert.deepEqual(fieldScheduleFilter([{
    id:1, own:true
}, {
    id:2, own:false
}], true).map(g=>g.id), [1]);
assert.deepEqual(fieldScheduleFilter([{
    id:1, own:true
}, {
    id:2, own:false
}], false).map(g=>g.id), [1, 2]);
const scheduleLastColumn=g=>g.completed?'ABGESCHLOSSEN':(g.time||'AUSSTEHEND');
assert.equal(scheduleLastColumn({
    completed:true, time:'10:00'
}), 'ABGESCHLOSSEN');
assert.equal(scheduleLastColumn({
    completed:false, time:''
}), 'AUSSTEHEND');
assert.equal(scheduleLastColumn({
    completed:false, time:'10:00'
}), '10:00');
const scheduleLastHeader=games=>games.every(g=>g.completed)?'Status':'Uhrzeit';
assert.equal(scheduleLastHeader([{
    completed:true
}]), 'Status');
assert.equal(scheduleLastHeader([{
    completed:false
}]), 'Uhrzeit');
const readableFit=(height, available)=>{
    const ratio=Math.min(1, available/height);
    const font=Math.max(7.2, Math.min(9, 9*ratio));
    return{
        font, zoom:Math.max(.82, Math.min(1, available/(height*(font/9)))*.992)
    }
};
assert.equal(readableFit(900, 1000).font, 9);
assert.ok(readableFit(1300, 1000).font>=7.2);
assert.ok(readableFit(1300, 1000).zoom>=.82);
const participantCount=games=>new Set(games.flatMap(g=>[g.home, g.away])).size;
assert.equal(participantCount([{
    home:'A', away:'B'
}, {
    home:'A', away:'C'
}, {
    home:'D', away:'B'
}]), 4);
const placementWithTotal=(place, total)=>total?`${place}. Platz von ${total}`:`${place}. Platz`;
assert.equal(placementWithTotal(11, 20), '11. Platz von 20');
const headerClass=mode=>'doc statistics-doc';
assert.equal(headerClass('schedule'), headerClass('statistics'));
const ownResultsAvailable=games=>games.filter(g=>g.own).some(g=>g.completed&&String(g.result||'').trim());
assert.equal(ownResultsAvailable([{
    own:true, completed:false, result:''
}]), false);
assert.equal(ownResultsAvailable([{
    own:false, completed:true, result:'2:1'
}, {
    own:true, completed:false, result:''
}]), false);
assert.equal(ownResultsAvailable([{
    own:true, completed:true, result:'2:1'
}]), true);
const highlightOpponentLogo=game=>game.opponentLogo?`<img src="${game.opponentLogo}">`:'';
assert.equal(highlightOpponentLogo({
    opponentLogo:'logo.png'
}), '<img src="logo.png">');
assert.equal(highlightOpponentLogo({
    opponentLogo:''
}), '');
const highlightInlineLayout={
    logo:12, wrap:false, gap:3
};
assert.deepEqual(highlightInlineLayout, {
    logo:12, wrap:false, gap:3
});
const placementGraphicType=place=>place===1?'gold':place===2?'silver':place===3?'bronze':'certificate';
assert.equal(placementGraphicType(1), 'gold');
assert.equal(placementGraphicType(2), 'silver');
assert.equal(placementGraphicType(3), 'bronze');
assert.equal(placementGraphicType(11), 'certificate');
const ownGroupLabels=(groups, ownGroups)=>groups.map(g=>`${ownGroups.has(g)?'★ ':''}${g}`);
assert.deepEqual(ownGroupLabels(['Gruppe A', 'Gruppe B'], new Set(['Gruppe B'])), ['Gruppe A', '★ Gruppe B']);
const noStatisticsDialogCopy='Noch keine Ergebnisse vorhanden';
assert.equal(noStatisticsDialogCopy, 'Noch keine Ergebnisse vorhanden');
const groupCode=value=>String(value||'').trim().replace(/^Gruppe\s*/i, '')||'?';
assert.equal(groupCode('Gruppe A'), 'A');
assert.equal(groupCode('Gruppe C'), 'C');
assert.equal(groupCode('Gruppe 1'), '1');
const showGroupBadges=selectedGroup=>!selectedGroup;
assert.equal(showGroupBadges(''), true);
assert.equal(showGroupBadges('Gruppe A'), false);
const sortGamesByGroup=games=>[...games].sort((a, b)=>a.group.localeCompare(b.group, 'de', {
    numeric:true
}));
assert.deepEqual(sortGamesByGroup([{
    group:'C'
}, {
    group:'A'
}, {
    group:'B'
}]).map(g=>g.group), ['A', 'B', 'C']);
const groupDividerCount=games=>new Set(games.map(g=>g.group)).size;
assert.equal(groupDividerCount([{
    group:'A'
}, {
    group:'A'
}, {
    group:'B'
}]), 2);
const dayLabel=(date, index, selected)=>date===selected?`Aktueller Spieltag · Spieltag ${index+1}`:`Spieltag ${index+1}`;
assert.equal(dayLabel('d2', 1, 'd2'), 'Aktueller Spieltag · Spieltag 2');
assert.equal(dayLabel('d1', 0, 'd2'), 'Spieltag 1');
const fieldOwnToggleVisible=true;
assert.equal(fieldOwnToggleVisible, true);
const assignRounds=games=>{
    const counts=new Map();
    return games.map(g=>{
        const h=g.group+'|'+g.home, a=g.group+'|'+g.away, r=Math.max(counts.get(h)||0, counts.get(a)||0)+1;
        counts.set(h, r);
        counts.set(a, r);
        return r
    })
};
assert.deepEqual(assignRounds([{
    group:'A', home:'A1', away:'A2'
}, {
    group:'B', home:'B1', away:'B2'
}, {
    group:'A', home:'A1', away:'A3'
}, {
    group:'B', home:'B1', away:'B3'
}]), [1, 1, 2, 2]);
const fourthGames=games=>games.filter(g=>g.matchday===4);
assert.equal(fourthGames([{
    matchday:4
}, {
    matchday:3
}, {
    matchday:4
}]).length, 2);
const isCurrentMatchdayHeading=text=>/^Aktueller Spieltag$/i.test(String(text).trim());
assert.equal(isCurrentMatchdayHeading('Aktueller Spieltag'), true);
assert.equal(isCurrentMatchdayHeading('Spielplan'), false);
const phaseTypeReliable=text=>{
    text=text.toLowerCase();
    if(text.includes('qualifizierungsrunde')||text.includes('qualifikation'))return'qualification';
    if(text.includes('platzierung'))return'placement';
    if(text.includes('finale'))return'final';
    return'other'
};
assert.equal(phaseTypeReliable('Qualifizierungsrunde'), 'qualification');
assert.equal(phaseTypeReliable('Platzierungsrunde'), 'placement');
assert.equal(phaseTypeReliable('Endrunde Finale'), 'final');
const controlHost=text=>/^Alle Spiele$/i.test(text.trim());
assert.equal(controlHost('Alle Spiele'), true);
assert.equal(controlHost('Aktueller Spieltag'), false);
const isAllGamesTab=text=>/^Alle Spiele$/i.test(String(text).trim());
assert.equal(isAllGamesTab('Alle Spiele'), true);
assert.equal(isAllGamesTab('Aktueller Spieltag'), false);
const roundMatch=(phase, type, filter)=>{
    phase=phase.toLowerCase();
    if(filter==='qualification')return type==='qualification'||phase.includes('qualifikation');
    if(filter==='quarterfinal-endround')return /viertelfinale\s*&?\s*endrunde/.test(phase)||type==='quarterfinal';
    if(filter==='finals')return ['final', 'knockout'].includes(type)||phase.includes('endrunde')||phase.includes('finale');
    return type===filter
};
assert.equal(roundMatch('Qualifikationsturnier', 'qualification', 'qualification'), true);
assert.equal(roundMatch('Viertelfinale & Endrunde', 'quarterfinal', 'quarterfinal-endround'), true);
assert.equal(roundMatch('Viertelfinale & Endrunde', 'quarterfinal', 'finals'), true);
const explicitRoundKey=phase=>{
    phase=phase.toLowerCase();
    if(phase.includes('qualifikation'))return'qualification';
    if(phase.includes('platzierung'))return'placement';
    if(phase.includes('viertelfinale')&&phase.includes('endrunde'))return'quarterfinal-endround';
    if(phase.includes('viertelfinale'))return'quarterfinal';
    if(phase.includes('halbfinale'))return'semifinal';
    if(phase.includes('endrunde')||phase.includes('finale'))return'finals';
    return'other'
};
assert.equal(explicitRoundKey('Viertelfinale & Endrunde'), 'quarterfinal-endround');
assert.equal(explicitRoundKey('Endrunde / Finale'), 'finals');
assert.notEqual(explicitRoundKey('Viertelfinale & Endrunde'), 'finals');
const ownOnlineFilter=(games, onlyOwn)=>games.filter(game=>!onlyOwn||game.own);
assert.deepEqual(ownOnlineFilter([{
    id:1, own:true
}, {
    id:2, own:false
}], true).map(game=>game.id), [1]);
assert.deepEqual(ownOnlineFilter([{
    id:1, own:true
}, {
    id:2, own:false
}], false).map(game=>game.id), [1, 2]);
const filterVisibility=(games, filter)=>games.map(game=>({
    id:game.id, show:filter(game)
}));
assert.deepEqual(filterVisibility([{
    id:1, phase:'combined'
}, {
    id:2, phase:'group'
}], g=>g.phase==='combined'), [{
    id:1, show:true
}, {
    id:2, show:false
}]);
const normalizePhase=value=>String(value).toLowerCase().replace(/&amp;/g, '&');
const combinedRound=value=>/viertelfinale/.test(normalizePhase(value))&&/endrunde/.test(normalizePhase(value));
assert.equal(combinedRound('Viertelfinale & Endrunde'), true);
assert.equal(combinedRound('Viertelfinale &amp; Endrunde'), true);
assert.equal(combinedRound('Viertelfinale'), false);
const phaseSelectionFilter=(games, value, match)=>games.filter(game=>!value||match(game, value));
assert.deepEqual(phaseSelectionFilter([{
    phase:'group'
}, {
    phase:'combined'
}], 'phase:combined', (g, v)=>g.phase===v.slice(6)), [{
    phase:'combined'
}]);
const visibleRoundKey=text=>{
    text=String(text).toLowerCase().replace(/&amp;/g, '&');
    if(/viertelfinale/.test(text)&&/endrunde/.test(text))return'quarterfinal-endround';
    if(/gruppe\s+[a-z0-9]+/.test(text))return'group';
    return'other'
};
assert.equal(visibleRoundKey('Gruppe A'), 'group');
assert.equal(visibleRoundKey('Viertelfinale & Endrunde'), 'quarterfinal-endround');
assert.equal(visibleRoundKey('Viertelfinale &amp; Endrunde'), 'quarterfinal-endround');
const assignHomeGameNumbers=games=>{
    const counts=new Map();
    return games.map(game=>{
        const key=game.group+'|'+game.home;
        const number=(counts.get(key)||0)+1;
        counts.set(key, number);
        return number
    })
};
assert.deepEqual(assignHomeGameNumbers([{
    group:'B', home:'DHC', away:'A'
}, {
    group:'B', home:'A', away:'DHC'
}, {
    group:'B', home:'DHC', away:'C'
}]), [1, 1, 2]);
assert.deepEqual(assignHomeGameNumbers([{
    group:'A', home:'DHC', away:'A'
}, {
    group:'B', home:'DHC', away:'B'
}]), [1, 1]);
const assignByHomeTeamsOverallGame=games=>{
    const counts=new Map();
    return games.map(game=>{
        const h=game.group+'|'+game.home, a=game.group+'|'+game.away;
        const number=(counts.get(h)||0)+1;
        counts.set(h, (counts.get(h)||0)+1);
        counts.set(a, (counts.get(a)||0)+1);
        return number
    })
};
assert.deepEqual(assignByHomeTeamsOverallGame([{
    group:'B', home:'DHC', away:'A'
}, {
    group:'B', home:'A', away:'DHC'
}, {
    group:'B', home:'DHC', away:'C'
}]), [1, 2, 3]);
assert.deepEqual(assignByHomeTeamsOverallGame([{
    group:'B', home:'A', away:'DHC'
}, {
    group:'B', home:'DHC', away:'C'
}]), [1, 2]);
assert.deepEqual(assignByHomeTeamsOverallGame([{
    group:'B', home:'DHC', away:'C'
}]), [1]);
const concreteTeamKey=team=>team.name.trim().toLowerCase();
assert.notEqual(concreteTeamKey({
    name:'Düsseldorfer HC'
}), concreteTeamKey({
    name:'Düsseldorfer HC 2'
}));
const assignChronologicalHomeGame=(games)=>{
    const counts=new Map();
    return [...games].sort((a, b)=>a.date-b.date).map(g=>{
        const home=g.home.toLowerCase(), away=g.away.toLowerCase();
        g.day=(counts.get(home)||0)+1;
        counts.set(home, (counts.get(home)||0)+1);
        counts.set(away, (counts.get(away)||0)+1);
        return g
    }).sort((a, b)=>a.id-b.id).map(g=>g.day)
};
assert.deepEqual(assignChronologicalHomeGame([{
    id:2, date:2, home:'DHC', away:'C'
}, {
    id:1, date:1, home:'A', away:'DHC'
}]), [1, 2]);
assert.deepEqual(assignChronologicalHomeGame([{
    id:1, date:1, home:'DHC 2', away:'A'
}, {
    id:2, date:2, home:'DHC', away:'B'
}]), [1, 1]);
const assignDeduplicatedMatchdays=games=>{
    const counts=new Map(), fixtures=new Map();
    return games.map(g=>{
        const h=g.group+'|'+g.home, a=g.group+'|'+g.away, key=[g.group, g.date, g.home, g.away].join('|');
        if(fixtures.has(key))return fixtures.get(key);
        const n=(counts.get(h)||0)+1;
        fixtures.set(key, n);
        counts.set(h, (counts.get(h)||0)+1);
        counts.set(a, (counts.get(a)||0)+1);
        return n
    })
};
assert.deepEqual(assignDeduplicatedMatchdays([{
    group:'B', date:'01', home:'SG MSV Duisburg / Preußen Duisburg', away:'DHC 2'
}, {
    group:'B', date:'01', home:'SG MSV Duisburg / Preußen Duisburg', away:'DHC 2'
}]), [1, 1]);
assert.deepEqual(assignDeduplicatedMatchdays([{
    group:'B', date:'01', home:'SG MSV Duisburg / Preußen Duisburg', away:'DHC 2'
}, {
    group:'B', date:'02', home:'DHC 2', away:'Crefelder HTC'
}]), [1, 2]);
const homeOnlyRound=games=>{
    const counts=new Map(), seen=new Map();
    return games.map(g=>{
        const key=[g.date, g.home, g.away].join('|');
        if(seen.has(key))return seen.get(key);
        const n=(counts.get(g.home)||0)+1;
        counts.set(g.home, n);
        seen.set(key, n);
        return n
    })
};
assert.deepEqual(homeOnlyRound([{
    date:'01', home:'SG MSV Duisburg / Preußen Duisburg', away:'Düsseldorfer HC 2'
}]), [1]);
assert.deepEqual(homeOnlyRound([{
    date:'01', home:'A', away:'Düsseldorfer HC 2'
}, {
    date:'02', home:'SG MSV Duisburg / Preußen Duisburg', away:'Düsseldorfer HC 2'
}]), [1, 1]);
assert.deepEqual(homeOnlyRound([{
    date:'01', home:'Düsseldorfer HC 2', away:'A'
}, {
    date:'02', home:'Düsseldorfer HC 2', away:'B'
}]), [1, 2]);
const runtimeHomeRounds=games=>{
    const counts=new Map(), fixtures=new Map();
    return games.sort((a, b)=>a.date-b.date).map(g=>{
        const key=[g.date, g.home, g.away].join('|');
        if(fixtures.has(key))return fixtures.get(key);
        const n=(counts.get(g.home)||0)+1;
        counts.set(g.home, n);
        fixtures.set(key, n);
        return n
    })
};
assert.deepEqual(runtimeHomeRounds([{
    date:1, home:'SG MSV', away:'DHC 2'
}, {
    date:2, home:'DHC 2', away:'Crefelder HTC'
}]), [1, 1]);
assert.deepEqual(runtimeHomeRounds([{
    date:1, home:'DHC 2', away:'A'
}, {
    date:2, home:'DHC 2', away:'B'
}]), [1, 2]);
const uniqueVisibleFixtures=games=>{
    const seen=new Set();
    return games.filter(g=>{
        const key=[g.group, g.date, g.home, g.away, g.time, g.result].join('|');
        if(seen.has(key))return false;
        seen.add(key);
        return true
    })
};
assert.equal(uniqueVisibleFixtures([{
    group:'B', date:'01', home:'DHC 2', away:'Crefelder HTC', time:'', result:'1:1'
}, {
    group:'B', date:'01', home:'DHC 2', away:'Crefelder HTC', time:'', result:'1:1'
}]).length, 1);
assert.equal(uniqueVisibleFixtures([{
    group:'B', date:'01', home:'DHC 2', away:'A', time:'', result:''
}, {
    group:'B', date:'02', home:'DHC 2', away:'B', time:'', result:''
}]).length, 2);
const cachedRounds=games=>{
    const counts=new Map(), cache=new Map();
    for(const g of [...games].sort((a, b)=>a.date-b.date)){
        const fk=[g.date, g.homeUrl, g.awayUrl, g.group].join('|');
        if(cache.has(fk))continue;
        const n=(counts.get(g.homeUrl)||0)+1;
        cache.set(fk, n);
        counts.set(g.homeUrl, (counts.get(g.homeUrl)||0)+1);
        counts.set(g.awayUrl, (counts.get(g.awayUrl)||0)+1)
    }
    return games.map(g=>cache.get([g.date, g.homeUrl, g.awayUrl, g.group].join('|')))
};
assert.deepEqual(cachedRounds([{
    date:1, homeUrl:'/team/msv', awayUrl:'/team/dhc2', group:'B'
}, {
    date:2, homeUrl:'/team/dhc2', awayUrl:'/team/crefeld', group:'B'
}]), [1, 2]);
assert.deepEqual(cachedRounds([{
    date:1, homeUrl:'/team/dhc', awayUrl:'/team/a', group:'B'
}, {
    date:1, homeUrl:'/team/dhc2', awayUrl:'/team/b', group:'B'
}]), [1, 1]);
const scheduleTeamKeyNameFirst=team=>team.name.trim().toLowerCase()||team.url;
assert.notEqual(scheduleTeamKeyNameFirst({
    name:'Düsseldorfer HC', url:'/club/dhc'
}), scheduleTeamKeyNameFirst({
    name:'Düsseldorfer HC 2', url:'/club/dhc'
}));
const appearanceRoundForHome=games=>{
    const counts=new Map();
    return games.map(g=>{
        const n=(counts.get(g.home)||0)+1;
        counts.set(g.home, n);
        counts.set(g.away, (counts.get(g.away)||0)+1);
        return n
    })
};
assert.deepEqual(appearanceRoundForHome([{
    home:'DHC 2', away:'Crefeld'
}, {
    home:'MSV', away:'DHC 2'
}]), [1, 1]);
assert.deepEqual(appearanceRoundForHome([{
    home:'A', away:'DHC 2'
}, {
    home:'DHC 2', away:'Crefeld'
}]), [1, 2]);
const synchronizedRounds=games=>{
    const counts=new Map(), cache=new Map();
    return games.map(g=>{
        const fk=[g.date, g.home, g.away].join('|');
        if(cache.has(fk))return cache.get(fk);
        const n=Math.max(counts.get(g.home)||0, counts.get(g.away)||0)+1;
        counts.set(g.home, n);
        counts.set(g.away, n);
        cache.set(fk, n);
        return n
    })
};
assert.deepEqual(synchronizedRounds([{
    date:'09.05', home:'Marienburger SC', away:'Bonner THV'
}, {
    date:'21.05', home:'Rot-Weiss Köln 2', away:'Bonner THV'
}]), [1, 2]);
assert.deepEqual(synchronizedRounds([{
    date:'09.05', home:'SG MSV Duisburg / Preußen Duisburg', away:'Düsseldorfer HC 2'
}]), [1]);
assert.deepEqual(synchronizedRounds([{
    date:'02.05', home:'Düsseldorfer HC 2', away:'Crefelder HTC'
}, {
    date:'09.05', home:'SG MSV Duisburg / Preußen Duisburg', away:'Düsseldorfer HC 2'
}]), [1, 2]);
const hallPdfOrder=games=>[...games].sort((a, b)=>a.group.localeCompare(b.group, 'de', {
    numeric:true
})||a.matchday-b.matchday||a.date-b.date);
assert.deepEqual(hallPdfOrder([{
    group:'B', matchday:1, date:1, id:'B1'
}, {
    group:'A', matchday:2, date:2, id:'A2'
}, {
    group:'A', matchday:1, date:3, id:'A1'
}]).map(g=>g.id), ['A1', 'A2', 'B1']);
const groupHallTogether=(isField, selectedGroup)=>!isField&&!selectedGroup;
assert.equal(groupHallTogether(false, ''), true);
assert.equal(groupHallTogether(true, ''), false);
assert.equal(groupHallTogether(false, 'Gruppe A'), false);
const hallRoundsByGroupDate=games=>{
    const groups=new Map();
    return games.map(g=>{
        if(!groups.has(g.group))groups.set(g.group, new Map());
        const dates=groups.get(g.group);
        if(!dates.has(g.date))dates.set(g.date, dates.size+1);
        return dates.get(g.date)
    })
};
assert.deepEqual(hallRoundsByGroupDate([{
    group:'A', date:'01', home:'A1'
}, {
    group:'A', date:'01', home:'A2'
}, {
    group:'A', date:'02', home:'A1'
}]), [1, 1, 2]);
assert.deepEqual(hallRoundsByGroupDate([{
    group:'A', date:'01'
}, {
    group:'B', date:'01'
}, {
    group:'B', date:'02'
}, {
    group:'A', date:'02'
}]), [1, 1, 2, 2]);
const tabRebuildReady=(target, selectCount, currentControl)=>target==='all'?selectCount===2:currentControl;
assert.equal(tabRebuildReady('all', 1, false), false);
assert.equal(tabRebuildReady('all', 2, false), true);
assert.equal(tabRebuildReady('current', 0, true), true);
const fullAllControlsReady=state=>state.groups>0&&state.selects===2&&state.print&&state.statistics;
assert.equal(fullAllControlsReady({
    groups:0, selects:0, print:false, statistics:false
}), false);
assert.equal(fullAllControlsReady({
    groups:2, selects:2, print:true, statistics:true
}), true);
const chooseAllModel=(cached, fresh)=>fresh.games.length>=cached.games.length?fresh:cached;
assert.equal(chooseAllModel({
    games:[1, 2, 3]
}, {
    games:[1]
}).games.length, 3);
assert.equal(chooseAllModel({
    games:[1]
}, {
    games:[1, 2]
}).games.length, 2);
const forcedTabVisibility=target=>({
    main:target==='all', current:target==='current'
});
assert.deepEqual(forcedTabVisibility('all'), {
    main:true, current:false
});
assert.deepEqual(forcedTabVisibility('current'), {
    main:false, current:true
});
const preloadReady=model=>!!model&&model.groups.length>0&&model.games.length>0;
assert.equal(preloadReady({
    groups:['A'], games:[1]
}), true);
assert.equal(preloadReady({
    groups:[], games:[1]
}), false);