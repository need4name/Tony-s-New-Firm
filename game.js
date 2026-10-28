'use strict';
// FIRM HEAD — Chapter 1: Crown Green Bowling.
//
// Tony doesn't play. He stands on the bank as Hallam's "12th man". Each level is
// one wet Saturday fixture made of short mini-games (chant, clap along, put him off).
// Every mini-game moves the match score and the moods of the people on the bank,
// who only came out for a quiet afternoon.

const app = document.getElementById('app');

// ---------------------------------------------------------------- audio
const Sound = (() => {
  let ctx = null;
  let muted = false;
  let noise = null;
  function get() {
    if (muted) return null;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }
  function tone(freq, dur, { type = 'sine', gain = 0.1, attack = 0.01, filter = 0, when = 0 } = {}) {
    const c = get();
    if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function burst(dur, freq, gain) {
    const c = get();
    if (!c) return;
    if (!noise) {
      noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource();
    s.buffer = noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(c.destination);
    s.start(t);
    s.stop(t + dur + 0.02);
  }
  return {
    toggle() { muted = !muted; return muted; },
    wah() {
      const f = 120 + Math.random() * 70;
      tone(f, 0.22, { type: 'sawtooth', gain: 0.05, filter: 380 });
      tone(f * 0.8, 0.22, { type: 'sawtooth', gain: 0.03, filter: 380, when: 0.1 });
    },
    pad() {
      [220, 277.18, 329.63, 440].forEach((f) => {
        tone(f, 4, { type: 'sawtooth', gain: 0.025, attack: 1.4, filter: 1100 });
        tone(f * 1.006, 4, { type: 'sawtooth', gain: 0.025, attack: 1.4, filter: 1100 });
      });
    },
    chant() {
      [196, 196, 220, 262, 220].forEach((f, i) =>
        tone(f, 0.22, { type: 'square', gain: 0.05, filter: 1400, when: i * 0.2 }));
    },
    unlock() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'square', gain: 0.05, when: i * 0.1 }));
    },
    stamp() { tone(70, 0.35, { type: 'square', gain: 0.25, filter: 260 }); },
    clap() { burst(0.1, 1600, 0.6); },
    tick(strong) { tone(strong ? 1300 : 950, 0.05, { type: 'square', gain: 0.035 }); },
    shout() { burst(0.3, 700, 0.5); tone(210, 0.3, { type: 'sawtooth', gain: 0.07, filter: 900 }); },
    cheer() { burst(1.2, 900, 0.3); },
    groan() { tone(150, 0.7, { type: 'sawtooth', gain: 0.05, filter: 400 }); },
  };
})();

document.getElementById('mute').addEventListener('click', (e) => {
  e.target.textContent = Sound.toggle() ? '♪ OFF' : '♪ ON';
});

// ---------------------------------------------------------------- data
const SPORTS = [
  'Crown Green Bowling', 'Badminton', 'Croquet', 'Darts', 'Archery', 'Snooker', 'Table Tennis',
  'Bird Watching', 'Fly Fishing', 'Curling', 'Pétanque', 'Flower Arranging', 'Synchronised Swimming',
  'Pigeon Racing', 'Crochet Circle', 'Pub Quiz Night', 'Amateur Operatics', 'Ballroom Dancing',
  'Footgolf', 'Dressage',
];

// Score is [Hallam, Dore & Totley] in shots, with the last few ends still to play.
const LEVELS = [
  {
    id: '1-1', name: 'First Saturday', start: [5, 5],
    blurb: 'Hallam v Dore & Totley. It\'s level, 5–5, with one end left. Nobody on the bank has made a sound all afternoon.',
    steps: ['chant', 'putoff'],
  },
  {
    id: '1-2', name: 'The Return Fixture', start: [7, 8],
    blurb: 'A week later. Hallam are a shot down with two ends left. Dore & Totley have brought their own flasks.',
    steps: ['clap', 'chant', 'putoff', 'putoff'],
  },
  {
    id: '1-3', name: 'Cup Semi-Final', start: [12, 14],
    blurb: 'The Sheffield & District Cup. Hallam are two shots down. The visiting bowler has started faking his backswing to catch you out.',
    steps: ['chant', 'clap', 'putoff', 'chant', 'putoff', 'putoff'],
    fakeouts: true,
  },
];

const PEOPLE = [
  { id: 'dorothy', name: 'Dorothy', desc: '74. Flask of oxtail soup. Came for a quiet afternoon.', body: '#7b5a93', x: 40 },
  { id: 'gerald', name: 'Gerald', desc: 'Walking Clive, a soaking wet whippet.', body: '#55703a', x: 104 },
  { id: 'lads', name: 'Dean & Wayne', desc: 'Sheltering from the rain. Bored out of their minds.', body: '#33598f', x: 178 },
  { id: 'pell', name: 'Mr Pell', desc: 'Hallam club secretary. Owns the rulebook.', body: '#33363b', x: 318 },
  { id: 'brian', name: 'Brian', desc: 'Groundsman. Re-seeded the ditch edge this morning.', body: '#8a6a2e', x: 370 },
];
const TONY_X = 250;

const MOODS = {
  '-3': 'Writing to the council',
  '-2': 'Fuming',
  '-1': 'Tutting',
  0: 'Minding their own business',
  1: 'Smiling',
  2: 'On your side',
  3: 'Joined the firm',
};

// ---------------------------------------------------------------- save data
const SAVE_KEY = 'firmhead-v2';
function freshMoods() { return { dorothy: 0, gerald: 0, lads: 0, pell: 0, brian: 0 }; }
function freshLog() { return { rude: 0, early: 0, ditched: 0, claps: 0, bestChant: '', bestScore: -1 }; }
function freshSave() { return { seenIntro: false, stars: {}, won: {}, moods: freshMoods(), log: freshLog(), chants: [], quirks: [] }; }
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.moods && s.log) return s;
  } catch (e) { /* no storage */ }
  return freshSave();
}
let save = loadSave();
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* no storage */ }
}
function hasQuirk(id) { return save.quirks.includes(id); }

// ---------------------------------------------------------------- helpers
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function show(html) {
  frameHook = null;
  onKey = null;
  app.innerHTML = html;
  window.scrollTo(0, 0);
}
function on(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}
function now() { return performance.now() / 1000; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

let onKey = null;
window.addEventListener('keydown', (e) => { if (onKey) onKey(e); });

// One animation loop for the whole game: draws the bank, then the current mini-game.
let frameHook = null;
function loop() {
  drawScene();
  if (frameHook) frameHook();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------------------------------------------------------------- story scenes
function titleScene() {
  show(`
    <section class="panel">
      <p class="eyebrow">Issue No. 1 · 20p · Unofficial</p>
      <h1 class="headline">Firm Head</h1>
      <p class="quote">"When terrace football dies, the ultra spirit finds a new green."</p>
      <p>Sheffield, 1984. The football firms are banned. Tony Notion still needs somewhere to go on a Saturday.</p>
      <div class="row">
        ${save.seenIntro ? '<button id="cont">Continue</button><button id="intro" class="ghost">Watch the intro</button>'
          : '<button id="intro">Start</button>'}
      </div>
    </section>`);
  on('cont', mapScene);
  on('intro', introScene);
}

function introScene() {
  show(`
    <section class="panel">
      <p class="eyebrow">Chapter 1 · Crown Green Bowling</p>
      <h2 class="headline">The firm is finished</h2>
      <p>The government has banned the football firms. Tony's lot, the Steel City Anarchy, are done.</p>
      <p>Tony is four foot ten, very loud, and has nowhere to be on a Saturday.</p>
      <p>It's raining. He cuts through Hillsborough Park and hears something he hasn't heard in weeks: a crowd.
         A small one. Five people and a wet dog, watching bowls.</p>
      <p class="speech"><b>TONY:</b> "Ey up. What's all this, then?"</p>
      <button id="next">Have a look</button>
    </section>`);
  on('next', monologueScene);
}

const MONOLOGUE = `Ah, a newcomer! Splendid. Now, crown green bowling, unlike its flat green cousin,
is played on a green with a raised crown, some ten to fourteen inches higher in the centre. Each bowl
carries a bias, which is to say it is weighted to one side, and will draw in a graceful arc as it slows.
The jack, likewise biased, is delivered first by the leader, who may send it in any direction he likes,
provided it travels no less than twenty-one yards. Spectators are asked to remain silent during delivery,
and to refrain from remarks of any kind, and the committee are most particular about soles of shoes, and
the tea urn is not to be touched before four o'clock.`.split(/\s+/);

function monologueScene() {
  show(`
    <section class="panel">
      <p class="eyebrow">Mr Pell explains the rules</p>
      <h2 class="headline">"Ah, a newcomer!"</h2>
      <p class="monologue" id="mono"></p>
      <button id="skip" class="ghost">Stop listening</button>
    </section>`);
  const box = document.getElementById('mono');
  let i = 0;
  let done = false;
  const timer = setInterval(() => {
    if (i >= MONOLOGUE.length) return finish();
    const tuneOut = Math.min(0.97, Math.max(0, (i - 10) / 25));
    const span = document.createElement('span');
    if (Math.random() < tuneOut) {
      span.className = 'wah';
      span.textContent = Math.random() < 0.5 ? 'wah ' : 'wah-wah ';
      if (i % 2 === 0) Sound.wah();
    } else {
      span.textContent = MONOLOGUE[i] + ' ';
    }
    box.appendChild(span);
    i++;
  }, 110);
  function finish() {
    if (done) return;
    done = true;
    clearInterval(timer);
    epiphanyScene();
  }
  on('skip', finish);
}

function epiphanyScene() {
  Sound.pad();
  show(`
    <section class="epiphany" id="epi">
      <div class="eyes"><div class="eye"></div><div class="eye"></div></div>
      <div class="line">He doesn't see bowls.<br>He sees a home end, an away end,<br>and a crowd with nobody leading it.</div>
    </section>`);
  let moved = false;
  const go = () => { if (!moved) { moved = true; unlockScene(); } };
  setTimeout(go, 5200);
  on('epi', () => setTimeout(go, 300));
}

function unlockScene() {
  Sound.unlock();
  if (!hasQuirk('jennels')) save.quirks.push('jennels');
  save.seenIntro = true;
  persist();
  show(`
    <section class="panel">
      <p class="eyebrow">Tony has a new team</p>
      <h2 class="headline">The 12th man</h2>
      <p>Hallam are at home to Dore &amp; Totley, the posh lot from the other side of the city. Hallam are struggling.</p>
      <p>Tony isn't allowed on the green. He doesn't need to be. He's going to stand on the bank and win it from there.</p>
      <p class="speech"><b>MR PELL:</b> "Spectators are asked to remain <i>silent</i>—"</p>
      <div class="card">
        <p class="tag">How to play</p>
        <p>Each level is one Saturday match. You play a few short mini-games from the bank:</p>
        <ul>
          <li><b>Chant:</b> type your own chant. The game marks it.</li>
          <li><b>Clap along:</b> tap in time to get the bank going.</li>
          <li><b>Put him off:</b> shout at the visiting bowler at the worst possible moment.</li>
        </ul>
        <p>Help Hallam win. Everything you do lands on the people around you. Some will join you. Some will complain.</p>
      </div>
      <div class="card">
        <p class="tag">Tony's habit: pacing the jennels</p>
        <p>Tony measures everything in alleyway strides now. In <b>Put him off</b>, your window to shout is 10% wider.</p>
      </div>
      <button id="go">To the match</button>
    </section>`);
  on('go', mapScene);
}

function mapScene() {
  const levelRows = LEVELS.map((L, i) => {
    const open = i === 0 || save.won[LEVELS[i - 1].id];
    const stars = save.stars[L.id] || 0;
    return `<div class="level">
      <div><div class="name">${i + 1}. ${esc(L.name)}</div>
        <div class="stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div></div>
      <button data-level="${i}" ${open ? '' : 'disabled'}>${open ? (save.won[L.id] ? 'Replay' : 'Play') : 'Locked'}</button>
    </div>`;
  }).join('');
  show(`
    <section class="panel">
      <p class="eyebrow">Chapter 1</p>
      <h2 class="headline">Crown Green Bowling</h2>
      <p class="how">Hillsborough Park. Three Saturdays. Win a match to unlock the next one.</p>
      <div class="levels">${levelRows}</div>
      ${save.won['1-3'] ? '<button id="letter" class="ghost">Read the letter again</button>' : ''}
    </section>
    <section class="panel">
      <h3 class="headline">The bank</h3>
      ${peopleList()}
    </section>
    <section class="panel">
      <h3 class="headline">Coming later</h3>
      <ul class="chapters">${SPORTS.map((s, i) => `<li class="${i === 0 ? 'on' : ''}">${i + 1}. ${esc(s)}</li>`).join('')}</ul>
    </section>
    <div class="row"><button id="title" class="ghost">Title screen</button><button id="reset" class="ghost">Reset progress</button></div>`);
  app.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => startLevel(Number(b.dataset.level))));
  on('title', titleScene);
  on('letter', banningScene);
  let armed = false;
  on('reset', (e) => {
    if (!armed) { armed = true; e.target.textContent = 'Tap again to wipe everything'; return; }
    save = freshSave();
    persist();
    titleScene();
  });
}

function peopleList() {
  return `<ul class="people">${PEOPLE.map((p) => {
    const m = save.moods[p.id];
    return `<li><span><b>${p.name}</b><br><span class="how">${p.desc}</span></span>
      <span class="chip ${m > 0 ? 'up' : m < 0 ? 'down' : ''}">${MOODS[m]}</span></li>`;
  }).join('')}</ul>`;
}

// ---------------------------------------------------------------- level runner
let run = null;

function startLevel(idx) {
  const L = LEVELS[idx];
  // A fresh run of the chapter starts the bank from scratch.
  if (idx === 0) { save.moods = freshMoods(); save.log = freshLog(); save.chants = []; persist(); }
  run = {
    idx, L, step: 0, score: L.start.slice(), ultra: 0, nerves: 0, complaints: 0,
    feed: [], flash: {}, shoutUntil: 0, shoutWord: '', clapUntil: 0,
  };
  show(`
    <section class="panel">
      <p class="eyebrow">Level ${idx + 1} of ${LEVELS.length}</p>
      <h2 class="headline">${esc(L.name)}</h2>
      <p>${esc(L.blurb)}</p>
      <p class="how">${L.steps.length} mini-games. Win the match. Try not to get thrown out.</p>
      <button id="go">Get on the bank</button>
    </section>
    <section class="panel"><h3 class="headline">Who's here</h3>${peopleList()}</section>`);
  on('go', nextStep);
}

function nextStep() {
  if (run.step >= run.L.steps.length) return levelResults();
  const kind = run.L.steps[run.step];
  run.step++;
  ({ chant: chantGame, clap: clapGame, putoff: putOffGame })[kind]();
}

function stage(title, how) {
  show(`
    <header class="bar">
      <p class="eyebrow">Level ${run.idx + 1} · Part ${run.step} of ${run.L.steps.length}</p>
      <div class="scoreline" id="score"></div>
    </header>
    <canvas id="scene" width="400" height="170" aria-label="The bank: Tony and the spectators"></canvas>
    <div class="meter" title="Fills up from chants and clapping"><div id="ultra"></div><span id="ultralbl"></span></div>
    <section class="panel">
      <h2 class="headline">${title}</h2>
      <p class="how">${how}</p>
      <div id="game"></div>
    </section>
    <ul class="feed" id="feed" aria-live="polite"></ul>`);
  updateHud();
  renderFeed();
  return document.getElementById('game');
}

function updateHud() {
  const s = document.getElementById('score');
  if (s) s.innerHTML = `Hallam <b>${run.score[0]}–${run.score[1]}</b> Dore &amp; Totley`;
  const u = document.getElementById('ultra');
  if (u) u.style.width = `${run.ultra}%`;
  const l = document.getElementById('ultralbl');
  if (l) l.textContent = run.ultra >= 100 ? 'Ultra Meter full: Wedge-Shove ready' : 'Ultra Meter';
}

// Change someone's mood and add their reaction to the feed.
function react(id, delta, quote) {
  const before = save.moods[id];
  save.moods[id] = clamp(before + delta, -3, 3);
  if (delta < 0 && save.moods[id] < 0) run.complaints += 1;
  const p = PEOPLE.find((x) => x.id === id);
  run.feed.unshift({ who: p.name, quote, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : '', mood: MOODS[save.moods[id]] });
  run.flash[id] = now() + 2.5;
  persist();
}

function narrate(text) {
  run.feed.unshift({ who: '', quote: text, dir: '', mood: '' });
}

function renderFeed() {
  const f = document.getElementById('feed');
  if (!f) return;
  f.innerHTML = run.feed.slice(0, 5).map((r) => `<li class="${r.dir}">
    ${r.who ? `<span class="who">${esc(r.who)}:</span> ` : ''}${esc(r.quote)}
    ${r.mood ? `<span class="mood">Now: ${esc(r.mood)}</span>` : ''}</li>`).join('');
}

function addUltra(n) { run.ultra = clamp(Math.round(run.ultra + n), 0, 100); }

function continueButton(el, label = 'Next') {
  const b = document.createElement('button');
  b.textContent = run.step >= run.L.steps.length ? 'Final whistle' : label;
  b.addEventListener('click', nextStep);
  el.appendChild(b);
  b.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- the bank (canvas)
function drawScene() {
  const c = document.getElementById('scene');
  if (!c || !run) return;
  const g = c.getContext('2d');
  const W = 400;
  const H = 170;
  const t = now();

  const sky = g.createLinearGradient(0, 0, 0, 70);
  sky.addColorStop(0, '#bcc6cd');
  sky.addColorStop(1, '#dde3e6');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // terraced houses behind the park
  for (let i = 0; i < 11; i++) {
    const x = i * 38 - 6;
    const top = 30 + (i % 3) * 3;
    g.fillStyle = i % 2 ? '#a7a39b' : '#9d9890';
    g.fillRect(x, top, 36, 34);
    g.fillStyle = '#7f7a73';
    g.fillRect(x + 6, top - 6, 5, 6);
    g.fillStyle = '#d9d4c3';
    g.fillRect(x + 8, top + 10, 7, 8);
    g.fillRect(x + 22, top + 10, 7, 8);
  }

  // the green, with two tiny bowlers in white
  g.fillStyle = '#5c8d57';
  g.fillRect(0, 62, W, 38);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < W; i += 40) g.fillRect(i, 62, 20, 38);
  g.fillStyle = '#f3f3ee';
  g.fillRect(150, 70, 5, 11);
  g.fillRect(232, 72, 5, 10);
  g.beginPath(); g.arc(152.5, 68, 2.5, 0, Math.PI * 2); g.arc(234.5, 70, 2.5, 0, Math.PI * 2); g.fill();

  // the bank
  g.fillStyle = '#7c9a6c';
  g.fillRect(0, 100, W, 70);

  for (const p of PEOPLE) {
    if (p.id === 'lads') {
      drawPerson(g, p.x - 11, p, 50, t);
      drawPerson(g, p.x + 11, p, 47, t);
    } else {
      drawPerson(g, p.x, p, p.id === 'dorothy' ? 44 : 52, t);
    }
  }
  drawTony(g, t);

  // drizzle
  g.strokeStyle = 'rgba(70, 90, 110, 0.35)';
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 70; i++) {
    const y = ((i * 37 + t * 260) % (H + 20)) - 10;
    const x = ((i * 67 - y * 0.3) % W + W) % W;
    g.moveTo(x, y);
    g.lineTo(x - 3, y + 9);
  }
  g.stroke();

  // name labels
  g.font = 'bold 10px "Atkinson Hyperlegible", Verdana, sans-serif';
  g.textAlign = 'center';
  g.fillStyle = '#122016';
  for (const p of PEOPLE) g.fillText(p.name, p.x, 166);
  g.fillStyle = '#b0172e';
  g.fillText('Tony', TONY_X, 166);
}

function drawPerson(g, x, p, h, t) {
  const feet = 154;
  const mood = save.moods[p.id];
  const fresh = (run.flash[p.id] || 0) > t;
  const bob = mood >= 2 ? Math.abs(Math.sin(t * 6 + x)) * 3 : 0;
  const top = feet - h - bob;
  // legs and body
  g.fillStyle = '#2a2d31';
  g.fillRect(x - 5, feet - h * 0.35, 4, h * 0.35);
  g.fillRect(x + 1, feet - h * 0.35, 4, h * 0.35);
  g.fillStyle = p.body;
  g.fillRect(x - 9, top + 14, 18, h * 0.5);
  // arms
  g.strokeStyle = p.body;
  g.lineWidth = 3;
  g.beginPath();
  if (mood >= 2) {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 14, top + 2);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 14, top + 2);
  } else if (mood <= -2) {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 2, top + 24); // arms folded
    g.moveTo(x + 8, top + 17); g.lineTo(x + 2, top + 24);
  } else {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 11, top + 30);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 11, top + 30);
  }
  g.stroke();
  // head and face
  g.fillStyle = '#e6c19c';
  g.beginPath(); g.arc(x, top + 7, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1b1b1b';
  g.fillRect(x - 3, top + 5, 1.6, 1.6);
  g.fillRect(x + 1.6, top + 5, 1.6, 1.6);
  g.strokeStyle = '#1b1b1b';
  g.lineWidth = 1.2;
  g.beginPath();
  if (mood > 0) g.arc(x, top + 8, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (mood < 0) g.arc(x, top + 13, 3, 1.15 * Math.PI, 1.85 * Math.PI);
  else { g.moveTo(x - 2.5, top + 10.5); g.lineTo(x + 2.5, top + 10.5); }
  g.stroke();

  // props
  if (p.id === 'dorothy') {
    g.fillStyle = '#5e3f78';
    g.beginPath(); g.arc(x, top - 1, 17, Math.PI, 0); g.fill();
    g.strokeStyle = '#2a2d31'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, top - 1); g.lineTo(x, top + 26); g.stroke();
    g.fillStyle = '#c9ccd0'; g.fillRect(x + 9, top + 26, 4, 10); // flask
  } else if (p.id === 'gerald') {
    g.fillStyle = '#8d8f93'; // Clive the whippet
    g.fillRect(x + 12, feet - 13, 18, 5);
    g.fillRect(x + 13, feet - 8, 2, 8); g.fillRect(x + 27, feet - 8, 2, 8);
    g.beginPath(); g.arc(x + 31, feet - 14, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a3c3f'; g.fillRect(x - 9, top - 2, 18, 4); // flat cap
  } else if (p.id === 'brian') {
    g.strokeStyle = '#5a4a2a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + 13, top + 4); g.lineTo(x + 13, feet); g.stroke();
    g.beginPath(); g.moveTo(x + 7, top + 4); g.lineTo(x + 19, top + 4); g.stroke();
  } else if (p.id === 'pell') {
    g.fillStyle = '#f3f1e8'; g.fillRect(x - 9, top + 14, 18, 5); // white collar of the blazer
    g.fillStyle = '#7a2230'; g.fillRect(x - 16, top + 22, 7, 9); // rulebook
  }

  // reaction marker
  if (fresh || mood <= -2) {
    g.font = 'bold 14px "Anton", Impact, sans-serif';
    g.textAlign = 'center';
    g.fillStyle = mood < 0 ? '#b0172e' : '#1f5a2c';
    const mark = mood <= -3 ? '✉' : mood < 0 ? '!!' : mood >= 2 ? '♪' : '?';
    g.fillText(mark, x, top - (p.id === 'dorothy' ? 20 : 6));
  }
}

function drawTony(g, t) {
  const x = TONY_X;
  const feet = 154;
  const h = 38; // four foot ten
  const shouting = run.shoutUntil > t;
  const clapping = run.clapUntil > t;
  const top = feet - h - (shouting ? 3 : 0);
  g.fillStyle = '#e9e9e9';
  g.fillRect(x - 5, feet - 11, 4, 11);
  g.fillRect(x + 1, feet - 11, 4, 11);
  // red and white tracksuit
  g.fillStyle = '#b0172e';
  g.fillRect(x - 9, top + 14, 18, 15);
  g.fillStyle = '#ffffff';
  g.fillRect(x - 9, top + 19, 18, 3);
  g.strokeStyle = '#b0172e';
  g.lineWidth = 3;
  g.beginPath();
  if (shouting) {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 15, top + 1);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 15, top + 1);
  } else if (clapping) {
    g.moveTo(x - 8, top + 17); g.lineTo(x, top + 10);
    g.moveTo(x + 8, top + 17); g.lineTo(x, top + 10);
  } else {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 11, top + 28);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 11, top + 28);
  }
  g.stroke();
  g.fillStyle = '#e6c19c';
  g.beginPath(); g.arc(x, top + 7, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5a3a1e'; g.fillRect(x - 7, top - 1, 14, 4); // hair
  g.fillStyle = '#1b1b1b';
  g.fillRect(x - 3, top + 5, 1.6, 1.6);
  g.fillRect(x + 1.6, top + 5, 1.6, 1.6);
  if (shouting) {
    g.beginPath(); g.arc(x, top + 11, 2.5, 0, Math.PI * 2); g.fill();
    // speech bubble
    g.font = '18px "Anton", Impact, sans-serif';
    const w = g.measureText(run.shoutWord).width + 14;
    g.fillStyle = '#ffffff';
    g.fillRect(x + 12, top - 26, w, 24);
    g.strokeStyle = '#16191d'; g.lineWidth = 2;
    g.strokeRect(x + 12, top - 26, w, 24);
    g.fillStyle = '#b0172e';
    g.textAlign = 'left';
    g.fillText(run.shoutWord, x + 19, top - 7);
  } else {
    g.fillRect(x - 2, top + 10, 4, 1.4);
  }
}

function tonyShouts(word, dur = 0.9) {
  run.shoutWord = word;
  run.shoutUntil = now() + dur;
}

// ---------------------------------------------------------------- mini-game: chant
const STARTERS = [
  "YOU'RE GOING HOME IN A ",
  "WE'LL FIGHT YOU ON THE ",
  'WHO ARE YA? WHO ARE YA? ',
  'DORE AND TOTLEY, ',
  'YOUR CARDIGAN IS ',
];

const TOPIC = ['jack', 'bowl', 'bowls', 'bowling', 'green', 'mat', 'bias', 'end', 'ends', 'ditch', 'wood', 'woods',
  'hallam', 'dore', 'totley', 'pell', 'umpire', 'cardigan', 'cardigans', 'flask', 'soup', 'tea', 'urn', 'scone', 'scones',
  'sandwich', 'sandwiches', 'cucumber', 'biscuit', 'biscuits', 'rain', 'wet', 'drizzle', 'cold', 'saturday', 'crown',
  'whippet', 'clive', 'rake', 'blazer', 'posh', 'pension', 'pensioners', 'slippers', 'bench'];
const SHEFF = ['sheffield', 'sheff', 'steel', 'city', 'hendo', 'hendos', "hendo's", 'hendersons', "henderson's", 'relish',
  'jennel', 'jennels', 'gennel', 'nesh', 'mardy', 'chuffed', 'owt', 'nowt', 'hillsborough', 'kop', 'tony', 'firm',
  'ultra', 'ultras', 'yorkshire', 'chip', 'chips', 'oatcake'];
const TAUNTS = ['going home', 'who are ya', 'who are you', 'sit down', 'shut up', 'rubbish', 'shocking', 'disgrace',
  "can't", 'cant', 'never', 'useless', 'your mum', "you're", 'youre', 'you are', "we're", 'we are', "we'll", 'pathetic',
  'boring', 'soft', 'nobody', 'losing', 'beat you', 'scared', 'shaking', 'crying', 'go home', 'is that all', 'whos that'];
const RUDE = /\b(shit|fuck|bastard|wanker|twat|arse|bollocks|piss|crap|dick|bugger|prick)/g;

function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function rhymeKey(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  const m = w.match(/[aeiouy]+[^aeiouy]*$/);
  return m ? m[0] : w;
}

// Mark a typed chant out of 12 across four plain categories.
function judgeChant(text) {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = lower.split(/[^a-z']+/).filter(Boolean);
  const lines = clean.split(/[\n\/.!?;,]+/).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));
  const res = { words: words.length, rude: (lower.match(RUDE) || []).length, marks: [] };
  if (words.length < 3) {
    res.short = true;
    res.total = 0;
    return res;
  }

  // Rhythm: lines you could actually sing.
  const perLine = lines.map((l) => l.split(/\s+/).reduce((n, w) => n + syllables(w), 0));
  const singable = perLine.filter((n) => n >= 4 && n <= 12).length / perLine.length;
  const totalSyl = perLine.reduce((a, b) => a + b, 0);
  const counts = {};
  words.forEach((w) => { if (w.length > 2) counts[w] = (counts[w] || 0) + 1; });
  const repeats = Object.values(counts).some((n) => n > 1);
  let rhythm = singable >= 0.99 ? 2 : singable >= 0.5 ? 1 : 0;
  if (repeats) rhythm += 1;
  let rhythmTip = rhythm >= 3 ? 'Easy to sing, and it repeats. Proper chant.'
    : rhythm === 2 ? 'Good length to sing. Repeating a word or name makes it catchier.'
      : 'Hard to sing. Aim for lines of about 4 to 12 syllables.';
  if (totalSyl > 40) { rhythm = Math.min(rhythm, 1); rhythmTip = 'Too long. Nobody on the bank can remember all that.'; }

  // Rhyme: last words of neighbouring lines.
  let rhyme = 0;
  let rhymeTip = 'Add a second line that rhymes with the first.';
  if (lines.length >= 2) {
    const ends = lines.map((l) => l.split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, ''));
    rhymeTip = "The lines don't rhyme. Try making the last words sound alike.";
    for (let i = 1; i < ends.length; i++) {
      const a = ends[i - 1];
      const b = ends[i];
      if (!a || !b) continue;
      if (a === b) { if (rhyme < 2) { rhyme = 2; rhymeTip = 'Same word at the end of each line. Works on a terrace.'; } }
      else if (rhymeKey(a) === rhymeKey(b)) { rhyme = 3; rhymeTip = `"${a}" and "${b}" rhyme. Lovely.`; break; }
      else if (a.slice(-2) === b.slice(-2) && rhyme < 1) { rhyme = 1; rhymeTip = 'Nearly rhymes. Close enough for Yorkshire.'; }
    }
  }

  // On topic: is it about this match, this place?
  const topical = new Set(words.filter((w) => TOPIC.includes(w) || SHEFF.includes(w)));
  const topic = Math.min(3, topical.size);
  const topicTip = topic >= 3 ? 'All about the match and the city. The bank gets every word.'
    : topic >= 1 ? `Mentions ${[...topical].slice(0, 2).map((w) => `"${w}"`).join(' and ')}. Mention more of what's in front of you.`
      : 'Not about anything here. Mention the bowls, the rain, Dore & Totley or Sheffield.';

  // Cheek: is it aimed at the other lot?
  const cheekHits = TAUNTS.filter((p) => lower.includes(p)).length;
  const cheek = Math.min(3, cheekHits);
  const cheekTip = cheek >= 3 ? 'Proper terrace cheek. The visitors have heard it.'
    : cheek >= 1 ? 'A bit of cheek. Aim it straight at them: "you\'re", "who are ya", "going home".'
      : 'Too polite. A chant needs someone to aim at.';

  res.marks = [
    { k: 'Rhythm', v: Math.min(3, rhythm), tip: rhythmTip },
    { k: 'Rhyme', v: rhyme, tip: rhymeTip },
    { k: 'About the match', v: topic, tip: topicTip },
    { k: 'Cheek', v: cheek, tip: cheekTip },
  ];
  res.total = res.marks.reduce((n, m) => n + m.v, 0);
  res.cheek = cheek;
  res.topic = topic;
  res.mentionsTurf = /\b(green|ditch|grass|turf)\b/.test(lower);
  const key = lower.replace(/[^a-z]/g, '');
  res.stale = save.chants.includes(key);
  if (res.stale) res.total = Math.floor(res.total / 2);
  res.key = key;
  return res;
}

function chantGame() {
  const el = stage('Chant', 'Type your own chant and sing it to the bank. Two short lines that rhyme work best. Mention what\'s in front of you. Aim it at Dore &amp; Totley.');
  el.innerHTML = `
    <label class="eyebrow" for="chant">Your chant</label>
    <textarea id="chant" maxlength="160" placeholder="DORE AND TOTLEY, GO HOME TO YOUR MUM / YOU'VE GOT A FLASK AND A CARDIGAN"></textarea>
    <p class="how">Stuck? Start with one of these and finish it:</p>
    <div class="starters">${STARTERS.map((s, i) => `<button data-s="${i}">${esc(s.trim())}…</button>`).join('')}</div>
    <div class="row"><button id="sing">Sing it</button></div>
    <div id="result"></div>`;
  const box = document.getElementById('chant');
  el.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
    box.value = STARTERS[Number(b.dataset.s)];
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  }));
  on('sing', () => {
    const r = judgeChant(box.value);
    const out = document.getElementById('result');
    if (r.short) {
      out.innerHTML = '<p class="verdict">That\'s not a chant, that\'s a cough. Give it at least a few words.</p>';
      return;
    }
    Sound.chant();
    tonyShouts(pick(['LA LA LA', 'COME ON!', 'ALL TOGETHER']), 1.4);
    el.querySelector('.starters').previousElementSibling.remove();
    el.querySelector('.starters').remove();
    el.querySelector('.row').remove();
    box.remove();
    el.querySelector('label').remove();

    const verdict = r.total <= 3 ? 'A few people look round. Nobody joins in.'
      : r.total <= 6 ? 'A couple of voices join in, then trail off.'
        : r.total <= 9 ? 'The bank picks it up. The visitors look over.'
          : 'Proper terrace noise. The Dore & Totley bowler\'s hands are shaking.';
    out.innerHTML = `
      <p class="sung">"${esc(box.value.trim())}"</p>
      <div class="marks">${r.marks.map((m) => `<div class="mark"><span class="k">${m.k}</span>
        <span class="dots" aria-label="${m.v} out of 3">${'●'.repeat(m.v)}${'○'.repeat(3 - m.v)}</span>
        <span class="tip">${esc(m.tip)}</span></div>`).join('')}</div>
      ${r.stale ? '<p class="how">They\'ve heard that one already. Half marks.</p>' : ''}
      <p class="verdict">${r.total} out of 12. ${verdict}</p>`;

    // What it does to the match and the bank.
    addUltra(r.total * 7);
    run.nerves += r.total;
    if (!r.stale) save.chants.push(r.key);
    if (r.total > save.log.bestScore && !r.rude) { save.log.bestScore = r.total; save.log.bestChant = box.value.trim().toUpperCase(); }
    if (r.rude) {
      save.log.rude += r.rude;
      react('pell', -2, 'I have written that word down, Mr Notion. In pencil.');
      react('dorothy', -1, 'There are children in Crookes, you know.');
    }
    if (r.total >= 6) react('lads', 1, pick(['Go on then. That one\'s not bad.', 'Ha! Say it again!']));
    if (r.total >= 9) react('lads', 1, 'We\'re having that. Again!');
    if (r.total <= 3 && !r.rude) react('lads', -1, 'Embarrassing, that.');
    if (r.total >= 10 && !r.rude) react('dorothy', 1, 'She\'s humming it into her soup.');
    else if (r.cheek >= 2 && !r.rude) react('dorothy', -1, 'There\'s no need for that. They\'re from Dore.');
    if (r.topic >= 2) react('gerald', 1, 'That\'s actually quite funny. Isn\'t it, Clive?');
    if (r.mentionsTurf) react('brian', 1, 'Nice to hear someone appreciate the turf.');
    if (r.cheek >= 3) react('pell', -1, 'Spectators are asked to remain SILENT.');
    renderFeed();
    updateHud();
    persist();
    continueButton(out);
  });
  onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey && document.activeElement === box) { e.preventDefault(); document.getElementById('sing').click(); } };
}

// ---------------------------------------------------------------- mini-game: clap along
function clapGame() {
  const el = stage('Clap along', 'Tap <b>Clap</b> each time a mark reaches the line. It\'s the old terrace rhythm: clap, clap, clap-clap-clap. Get it right and the bank joins in.');
  el.innerHTML = `
    <canvas id="lane" width="400" height="110" aria-label="Clap marks moving towards the line"></canvas>
    <p id="judge" class="judge" aria-live="polite">Tap when you're ready</p>
    <button id="ready" class="big">I'm ready</button>
    <button id="clapbtn" class="big" hidden>Clap</button>
    <div id="result"></div>`;
  const lane0 = document.getElementById('lane');
  lane0.getContext('2d').fillStyle = '#ffffff';
  lane0.getContext('2d').fillRect(0, 0, 400, 110);
  readyThen(lane0, 'clapbtn', begin);

  function begin() {
  const BEAT = 60 / 92;
  const PATTERN = [0, 1, 2, 2.5, 3];
  const BARS = 3;
  const LEAD = 4;
  const t0 = now() + 1.2;
  const notes = [];
  for (let bar = 0; bar < BARS; bar++) for (const b of PATTERN) notes.push({ t: t0 + (LEAD + bar * 4 + b) * BEAT, hit: null });
  const ticks = [];
  for (let i = 0; i < LEAD + BARS * 4; i++) ticks.push(t0 + i * BEAT);
  let nextTick = 0;
  let perfect = 0;
  let good = 0;
  let finished = false;
  const lane = document.getElementById('lane');
  const g = lane.getContext('2d');
  const judgeEl = document.getElementById('judge');
  const HIT_X = 56;
  const SPEED = 190;

  function say(t) { judgeEl.textContent = t; }

  function tap(e) {
    if (e) e.preventDefault();
    if (finished) return;
    const t = now();
    Sound.clap();
    run.clapUntil = t + 0.15;
    let best = null;
    for (const n of notes) {
      if (n.hit) continue;
      const d = t - n.t;
      if (Math.abs(d) < 0.22 && (!best || Math.abs(d) < Math.abs(best.d))) best = { n, d };
    }
    if (!best) { say(t < notes[0].t - 0.22 ? 'Wait for it…' : 'No mark there'); return; }
    const ad = Math.abs(best.d);
    if (ad < 0.075) { best.n.hit = 'perfect'; perfect++; say('Spot on'); }
    else if (ad < 0.15) { best.n.hit = 'good'; good++; say('Close enough'); }
    else { best.n.hit = 'miss'; say(best.d < 0 ? 'Too early' : 'Too late'); }
  }
  document.getElementById('clapbtn').addEventListener('pointerdown', tap);
  lane.addEventListener('pointerdown', tap);
  onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) tap(e); } };

  frameHook = () => {
    const t = now();
    while (nextTick < ticks.length && t >= ticks[nextTick]) {
      Sound.tick(nextTick < LEAD || (nextTick - LEAD) % 4 === 0);
      if (nextTick < LEAD) say(String(LEAD - nextTick));
      else if (nextTick === LEAD) say('Clap!');
      nextTick++;
    }
    for (const n of notes) if (!n.hit && t - n.t > 0.22) { n.hit = 'miss'; say('Missed one'); }

    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 400, 110);
    g.fillStyle = '#eef1f3';
    g.fillRect(0, 35, 400, 40);
    g.fillStyle = '#16191d';
    g.fillRect(HIT_X - 2, 20, 4, 70);
    for (const n of notes) {
      const x = HIT_X + (n.t - t) * SPEED;
      if (x < -20 || x > 420) continue;
      g.fillStyle = n.hit === 'perfect' ? '#2d6a39' : n.hit === 'good' ? '#7fa66f' : n.hit === 'miss' ? '#c8d0d5' : '#b0172e';
      g.beginPath();
      g.arc(x, 55, n.hit && n.hit !== 'miss' ? 9 : 13, 0, Math.PI * 2);
      g.fill();
    }
    if (!finished && notes.every((n) => n.hit) && t > notes[notes.length - 1].t + 0.3) finish();
  };

  function finish() {
    finished = true;
    frameHook = null;
    onKey = null;
    document.getElementById('clapbtn').remove();
    const score = (perfect * 2 + good) / (notes.length * 2);
    const pct = Math.round(score * 100);
    save.log.claps += 1;
    addUltra(score * 45);
    run.nerves += Math.round(score * 6);
    const out = document.getElementById('result');
    const verdict = score >= 0.8 ? 'The whole bank is clapping. Even the umpire\'s foot is going.'
      : score >= 0.5 ? 'A few people join in. It sort of holds together.'
        : 'Tony claps on his own for a bit. It is very quiet afterwards.';
    out.innerHTML = `<p class="verdict">${perfect} spot on, ${good} close, ${notes.length - perfect - good} missed (${pct}%). ${verdict}</p>`;
    if (score >= 0.8) react('lads', 1, 'Dean\'s clapping. Wayne\'s clapping. They didn\'t mean to.');
    else if (score < 0.4) react('lads', -1, 'Is he alright?');
    if (score >= 0.9) react('dorothy', 1, 'She taps her flask along. Just a bit.');
    if (score >= 0.5) react('pell', -1, 'Clapping is for the END of an end, not during!');
    if (score >= 0.5) react('gerald', 1, 'Clive is wagging in time.');
    renderFeed();
    updateHud();
    persist();
    continueButton(out);
  }
  }
}

// Timing games wait until the player says they're ready, then scroll the game into view.
function readyThen(canvas, actionId, begin) {
  on('ready', () => {
    document.getElementById('ready').remove();
    document.getElementById(actionId).hidden = false;
    canvas.scrollIntoView({ block: 'start', behavior: 'smooth' });
    begin();
  });
}

// ---------------------------------------------------------------- mini-game: put him off
function putOffGame() {
  const wedge = run.ultra >= 100;
  const el = stage('Put him off', `The Dore &amp; Totley bowler swings his arm back before he lets go.
    Tap <b>Shout</b> when his arm is right at the top: the bar turns green. Too early and the umpire takes your name.
    ${wedge ? '<br><b>Ultra Meter full:</b> Tony and the lads do the Wedge-Shove along the bank. Your window is much wider this time.' : ''}`);
  el.innerHTML = `
    <canvas id="mat" width="400" height="230" aria-label="The visiting bowler and the green"></canvas>
    <p id="judge" class="judge" aria-live="polite">Tap when you're ready</p>
    <button id="ready" class="big">I'm ready</button>
    <button id="shout" class="big" hidden>Shout</button>
    <div id="result"></div>`;
  const cv = document.getElementById('mat');
  const g = cv.getContext('2d');
  const judgeEl = document.getElementById('judge');
  g.fillStyle = '#5c8d57';
  g.fillRect(0, 0, 400, 230);
  readyThen(cv, 'shout', () => { judgeEl.textContent = 'Wait for his backswing'; begin(); });

  function begin() {
  const widen = (hasQuirk('jennels') ? 1.1 : 1) * Math.min(1.6, 1 + run.nerves / 40) * (wedge ? 1.9 : 1);
  const start = now() + 1.2;
  const fake = run.L.fakeouts && Math.random() < 0.65;
  const fakeEnd = fake ? start + 1.1 : start;
  const s1 = fakeEnd + (fake ? 0.35 : 0) + Math.random() * 0.4; // real backswing starts
  const back = 0.55 + Math.random() * 0.45;
  const s2 = s1 + back;                                         // top of backswing
  const hold = 0.06 + Math.random() * 0.18;
  const s2h = s2 + hold;
  const s3 = s2h + 0.32;                                         // release
  const mid = (s2 + s2h) / 2;
  const half = 0.11 * widen + hold / 2;
  const winLo = mid - half;
  const winHi = mid + half;
  const timelineEnd = s3;

  let outcome = null;
  let tapT = 0;
  let rollStart = 0;
  let finished = false;

  function armAngle(t) {
    const deg = (d) => (d * Math.PI) / 180;
    if (fake && t >= start && t < fakeEnd) {
      const k = (t - start) / (fakeEnd - start);
      return deg(-60 * Math.sin(k * Math.PI));
    }
    if (outcome === 'early' && t > tapT) return 0; // he stops and glares
    if (t < s1) return 0;
    if (t < s2) return deg(-120 * ((t - s1) / back));
    if (t < s2h) return deg(-120);
    if (t < s3) return deg(-120 + 170 * ((t - s2h) / (s3 - s2h)));
    return deg(50);
  }

  function shout(e) {
    if (e) e.preventDefault();
    if (outcome) return;
    const t = now();
    tapT = t;
    Sound.shout();
    tonyShouts(pick(['OI!', 'HENDO\'S!', 'WHO ARE YA?', 'AWAY!']));
    if (t < winLo) outcome = 'early';
    else if (t <= winHi) outcome = Math.abs(t - mid) <= half * 0.45 ? 'perfect' : 'good';
    else if (t < s3) outcome = 'late';
    else return; // already let go; ignore
    resolve();
  }
  document.getElementById('shout').addEventListener('pointerdown', shout);
  cv.addEventListener('pointerdown', shout);
  onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) shout(e); } };

  const TEXT = {
    early: 'Too early. He stops, glares, and starts again. The umpire wants your name.',
    perfect: 'Perfect timing. He jumps out of his skin and the bowl ends up in the ditch.',
    good: 'Good shout. He flinches and the bowl drifts wide.',
    late: 'Too late. He\'d already let go. He barely noticed.',
    missed: 'You didn\'t shout. His bowl curls in and kisses the jack.',
  };
  // Where his bowl stops relative to the jack, by outcome (in strip pixels).
  const LANDING = { perfect: { dx: 70, dy: -10 }, good: { dx: 34, dy: 14 }, late: { dx: 12, dy: 6 }, early: { dx: 7, dy: -5 }, missed: { dx: 2, dy: 3 } };

  function resolve() {
    rollStart = now() + (outcome === 'early' ? 1.4 : 0.35);
    document.getElementById('shout').disabled = true;
    judgeEl.textContent = { early: 'Too early!', perfect: 'Perfect!', good: 'Good shout', late: 'Too late', missed: 'Silence' }[outcome];
  }

  function finish() {
    finished = true;
    frameHook = null;
    onKey = null;
    document.getElementById('shout').remove();
    if (wedge) run.ultra = 0;
    const out = document.getElementById('result');
    if (outcome === 'perfect') {
      run.score[0] += 2;
      save.log.ditched += 1;
      Sound.cheer();
      react('brian', -1, 'That\'s MY ditch! I re-seeded that this morning!');
      react('lads', 1, 'GET IN! Do it again!');
      narrate('Hallam win the end. Two shots. Mr Pell doesn\'t know whether to clap.');
    } else if (outcome === 'good') {
      run.score[0] += 1;
      Sound.cheer();
      react('lads', 1, 'Ha! He\'s rattled!');
      narrate('Hallam win the end by a shot.');
    } else if (outcome === 'early') {
      run.score[1] += 1;
      save.log.early += 1;
      Sound.groan();
      react('pell', -1, 'That is a formal warning, young man. Name?');
      react('dorothy', -1, 'I\'ve spilt my soup.');
      narrate('He bowls again, calmly. Dore & Totley win the end.');
    } else if (outcome === 'late') {
      run.score[1] += 1;
      Sound.groan();
      narrate('Dore & Totley win the end by a shot.');
    } else {
      run.score[1] += 2;
      Sound.groan();
      react('lads', -1, 'Thought you were meant to be good at this.');
      narrate('Dore & Totley win the end. Two shots.');
    }
    out.innerHTML = `<p class="verdict">${TEXT[outcome]}</p>`;
    renderFeed();
    updateHud();
    persist();
    continueButton(out);
  }

  frameHook = () => {
    const t = now();
    if (!outcome && t >= s3) { outcome = 'missed'; resolve(); }
    const W = 400;
    g.fillStyle = '#5c8d57';
    g.fillRect(0, 0, W, 230);

    // left: side-on bowler on the mat
    const bx = 100;
    const by = 150;
    g.fillStyle = '#2a2d31';
    g.fillRect(bx - 30, by + 26, 60, 6); // mat
    g.fillStyle = '#f4f4ef'; // whites
    g.fillRect(bx - 7, by - 10, 6, 36);
    g.fillRect(bx + 3, by - 10, 6, 36);
    g.fillRect(bx - 10, by - 48, 22, 40);
    g.fillStyle = '#e6c19c';
    g.beginPath(); g.arc(bx + 1, by - 58, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f4ef';
    g.fillRect(bx - 10, by - 70, 22, 5); // sun hat brim, in this weather
    const a = armAngle(t);
    const sx = bx + 1;
    const sy = by - 42;
    const hx = sx + Math.sin(-a) * -34;
    const hy = sy + Math.cos(a) * 34;
    g.strokeStyle = '#f4f4ef';
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
    if (t < s3 || outcome === 'early') {
      g.fillStyle = '#16191d';
      g.beginPath(); g.arc(hx, hy, 7, 0, Math.PI * 2); g.fill();
    }
    if (outcome === 'early' && t > tapT && t < rollStart) {
      g.font = '20px "Anton", Impact, sans-serif';
      g.fillStyle = '#b0172e';
      g.textAlign = 'center';
      g.fillText('…', bx + 26, by - 66);
    }

    // timing bar under the bowler
    const barX = 16;
    const barW = 168;
    const barY = 200;
    const span = timelineEnd - start;
    const px = (tt) => barX + clamp((tt - start) / span, 0, 1) * barW;
    g.fillStyle = '#ffffff';
    g.fillRect(barX, barY, barW, 14);
    const inWindow = t >= winLo && t <= winHi;
    g.fillStyle = inWindow ? '#1f7a35' : '#9fc79f';
    g.fillRect(px(winLo), barY, Math.max(3, px(winHi) - px(winLo)), 14);
    g.fillStyle = '#b0172e';
    g.fillRect(px(Math.min(t, outcome ? tapT || t : t)) - 2, barY - 4, 4, 22);
    g.font = 'bold 11px "Atkinson Hyperlegible", Verdana, sans-serif';
    g.fillStyle = '#ffffff';
    g.textAlign = 'left';
    g.fillText('Shout in the green bit', barX, barY - 8);

    // right: top-down strip showing where his bowl goes
    const rx = 230;
    const rw = 150;
    g.fillStyle = '#6b5a3e';
    g.fillRect(rx - 10, 10, rw + 20, 210);
    g.fillStyle = '#4f8a4a';
    g.fillRect(rx, 20, rw, 190);
    const jx = rx + rw / 2 - 10;
    const jy = 60;
    g.fillStyle = '#f5f0c8';
    g.beginPath(); g.arc(jx, jy, 4, 0, Math.PI * 2); g.fill();
    // Hallam bowl already sitting near the jack
    g.fillStyle = '#b0172e';
    g.beginPath(); g.arc(jx + 12, jy + 8, 7, 0, Math.PI * 2); g.fill();
    if (outcome && t >= rollStart) {
      const k = clamp((t - rollStart) / 1.6, 0, 1);
      const e = 1 - (1 - k) * (1 - k);
      const L = LANDING[outcome];
      const ex = jx + L.dx;
      const ey = jy + L.dy;
      const sx0 = rx + rw / 2 + 20;
      const sy0 = 205;
      // biased curve: drifts out then draws back in
      const cx = sx0 - 50;
      const cy = (sy0 + ey) / 2;
      const x = (1 - e) * (1 - e) * sx0 + 2 * (1 - e) * e * cx + e * e * ex;
      const y = (1 - e) * (1 - e) * sy0 + 2 * (1 - e) * e * cy + e * e * ey;
      g.fillStyle = '#1d2a52';
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
      if (k >= 1 && !finished) finish();
    }
    g.font = 'bold 11px "Atkinson Hyperlegible", Verdana, sans-serif';
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.fillText('Red: Hallam   Blue: visitors', rx + rw / 2, 225);
  };
  }
}

// ---------------------------------------------------------------- results
function levelResults() {
  const L = run.L;
  const [h, v] = run.score;
  const won = h > v;
  const allies = PEOPLE.filter((p) => save.moods[p.id] >= 2).length;
  const checks = [
    { ok: won, text: 'Hallam win the match' },
    { ok: allies >= 2, text: 'At least two people on the bank on your side' },
    { ok: run.complaints < 3, text: 'Fewer than three complaints' },
  ];
  const stars = checks.filter((c) => c.ok).length;
  if (won) {
    save.won[L.id] = true;
    save.stars[L.id] = Math.max(save.stars[L.id] || 0, stars);
  }
  persist();
  const last = run.idx === LEVELS.length - 1;
  show(`
    <section class="panel">
      <p class="eyebrow">Full time · ${esc(L.name)}</p>
      <h2 class="headline">${won ? 'Hallam win!' : h === v ? 'A draw. Not good enough.' : 'Hallam lose'}</h2>
      <p class="scoreline">Hallam <b>${h}–${v}</b> Dore &amp; Totley</p>
      <p class="bigstars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
      <ul class="checks">${checks.map((c) => `<li class="${c.ok ? 'ok' : ''}">${c.text}</li>`).join('')}</ul>
      <p>${won ? (last ? 'Hallam are in the Cup Final. Mr Pell is not celebrating. He is writing a letter.'
        : 'Mr Pell shakes the visiting captain\'s hand and avoids eye contact with Tony.')
        : 'You need a win to unlock the next Saturday. Have another go.'}</p>
      <div class="row">
        ${won && last ? '<button id="letter">A letter arrives</button>'
          : won ? '<button id="next">Next Saturday</button>' : '<button id="retry">Try again</button>'}
        <button id="map" class="ghost">Chapter map</button>
      </div>
    </section>
    <section class="panel"><h3 class="headline">The bank after the match</h3>${peopleList()}</section>`);
  on('next', () => startLevel(run.idx + 1));
  on('retry', () => startLevel(run.idx));
  on('map', mapScene);
  on('letter', banningScene);
}

function banningScene() {
  setTimeout(Sound.stamp, 800);
  const lg = save.log;
  const grounds = [
    'Standing on the bank in a tracksuit on three consecutive Saturdays, which the Committee considers "loitering with intent to support".',
  ];
  if (lg.bestChant) grounds.push(`Singing, at volume, "${esc(lg.bestChant)}".`);
  if (lg.ditched) grounds.push(`Causing ${lg.ditched} visiting bowl${lg.ditched > 1 ? 's' : ''} to enter the ditch by shouting at the top of a backswing. The groundsman has asked for it to be noted that he had only just re-seeded it.`);
  if (lg.early) grounds.push(`Receiving ${lg.early} formal warning${lg.early > 1 ? 's' : ''} from the umpire, one of which he was still writing when the next end began.`);
  if (lg.claps) grounds.push('Organising rhythmic clapping during play. Clapping is for the end of an end.');
  if (lg.rude) grounds.push('Language unbecoming of a bowls fixture, recorded by the Secretary in pencil.');
  grounds.push('Putting Henderson\'s Relish on the cucumber sandwiches without committee approval.');
  const tribunal = new Date(1984, 3, 7 + 42 + Math.floor(Math.random() * 15));
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  show(`
    <section class="order">
      <h3>Hallam Crown Green Bowling Society</h3>
      <div class="sub">Standards &amp; Etiquette Sub-Committee · Ref. HCGBS/84/0001</div>
      <div class="stamp">Banned</div>
      <p><b>NOTICE OF INTENT TO ISSUE A BANNING ORDER</b><br>Re: Mr Anthony Notion ("Tony"), spectator.</p>
      <p>The Sub-Committee will consider the following:</p>
      <ol>${grounds.map((x) => `<li>${x}</li>`).join('')}</ol>
      <p>A tribunal will meet on <b>${fmt(tribunal)}</b>, when the Secretary's sister-in-law is back from Skegness with the minute book.</p>
      <p style="text-align:right"><i>C. Pell</i><br>Hon. Secretary</p>
    </section>
    <button id="next">Read the small print</button>`);
  on('next', loopholeScene);
}

function loopholeScene() {
  const recruits = PEOPLE.filter((p) => save.moods[p.id] >= 2);
  show(`
    <section class="panel">
      <p class="eyebrow">The small print</p>
      <h2 class="headline">Six to eight weeks</h2>
      <p>Tony reads the letter four times on the bus. Then a fifth time, very slowly.</p>
      <p class="quote">"…until the tribunal meets, the spectator may attend all other regional fixtures."</p>
      <p class="speech"><b>TONY:</b> "All <i>other</i> fixtures. Right. Get the lads. We're going to badminton."</p>
      <div class="card">
        <p class="tag">Tony's new firm</p>
        ${recruits.length
          ? `<p>These people from the bank are coming with him:</p><ul>${recruits.map((p) => `<li><b>${p.name}</b>: ${p.desc}</li>`).join('')}</ul>`
          : '<p>Nobody from the bank is coming with him. Win people over next time: good chants and good clapping help.</p>'}
      </div>
      <p class="how">That's the end of Chapter 1 for now. Chapter 2, Badminton, is next.</p>
      <div class="row"><button id="map">Chapter map</button></div>
    </section>`);
  on('map', mapScene);
}

titleScene();
