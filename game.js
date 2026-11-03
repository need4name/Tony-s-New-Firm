'use strict';
// FIRM HEAD
//
// Prologue: Tony runs the Steel City Anarchy on the football terraces (the tutorial),
// until the firms are banned. Chapter 1: Crown Green Bowling, where he stands on the
// bank as Hallam's "12th man". Each level is a short run of mini-games (chant, clap
// along, put him off) that move the score and the moods of the people around him.

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

// Where a level happens decides who's around Tony and what the put-off target is.
const TERRACE_CAST = [
  { id: 'col', name: 'Big Col', desc: 'Six foot four. Lifts Tony up so he can see.', body: '#b0172e', x: 40, h: 60 },
  { id: 'pete', name: 'Mucky Pete', desc: 'Hasn\'t washed his scarf since 1977.', body: '#b0172e', x: 104 },
  { id: 'spanner', name: 'Spanner', desc: 'Nobody knows his real name. Including Spanner.', body: '#d8d8d2', x: 178 },
  { id: 'copper', name: 'PC Hargreaves', label: 'Copper', desc: 'South Yorkshire Police. Writing everything down.', body: '#1d2a52', x: 318 },
  { id: 'barnsley', name: 'Barnsley fan', label: 'Barnsley', desc: 'In the next pen. Thinks pies are better in Barnsley.', body: '#2b2b6b', x: 372 },
];
const BANK_CAST = [
  { id: 'dorothy', name: 'Dorothy', desc: '74. Flask of oxtail soup. Came for a quiet afternoon.', body: '#7b5a93', x: 40, h: 44 },
  { id: 'gerald', name: 'Gerald', desc: 'Walking Clive, a soaking wet whippet.', body: '#55703a', x: 104 },
  { id: 'lads', name: 'Dean & Wayne', desc: 'Sheltering from the rain. Bored out of their minds.', body: '#33598f', x: 178, pair: true },
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

// Chant songs: fill in the {blanks}. `beats` is how many syllables fit the tune.
// `rhyme` means the word should rhyme with that word.
const SONGS = {
  terrace: [
    {
      lines: ['WE\'RE STEEL CITY AND WE\'RE PROUD,', 'WE PUT {A} ON OUR PIES!'],
      blanks: { A: { beats: 2, hint: 'What goes on everything in Sheffield?', ideas: ['HENDO\'S', 'RELISH', 'GRAVY'] } },
    },
  ],
  easy: [
    {
      lines: ['YOU\'RE GOING HOME,', 'YOU\'RE GOING HOME,', 'YOU\'RE GOING HOME IN A {A}!'],
      blanks: { A: { beats: 3, hint: 'Something slow to go home in', ideas: ['WHEELBARROW', 'TEA TROLLEY', 'COUNCIL SKIP'] } },
    },
    {
      lines: ['DORE AND TOTLEY,', 'WHO ARE YA?', 'YOU\'RE JUST A {A} IN A CARDIGAN!'],
      blanks: { A: { beats: 2, hint: 'Something boring', ideas: ['BUS PASS', 'TEA BAG', 'WET SOCK'] } },
    },
    {
      lines: ['YOUR {A} IS A DISGRACE,', 'IT\'S ALL OVER THE PLACE!'],
      blanks: { A: { beats: 2, hint: 'Something a posh bowler owns', ideas: ['SUN HAT', 'FLAT CAP', 'BLAZER'] } },
    },
  ],
  medium: [
    {
      lines: ['WE\'VE GOT {A}', 'AND YOU\'VE GOT {B},', 'AND WE\'RE STOPPING HERE IN THE RAIN!'],
      blanks: {
        A: { beats: 2, hint: 'Something great that Hallam have', ideas: ['HENDO\'S', 'BRIAN', 'TONY'] },
        B: { beats: 2, hint: 'Something rubbish the visitors have', ideas: ['NO FANS', 'WET FEET', 'SOFT HANDS'] },
      },
    },
    {
      lines: ['DORE AND TOTLEY, YOU\'RE {A},', 'YOU\'VE COME ALL THIS WAY TO {B}!'],
      blanks: {
        A: { beats: 2, hint: 'An insult (keep it clean, there are pensioners)', ideas: ['RUBBISH', 'SHOCKING', 'USELESS'] },
        B: { beats: 2, hint: 'Something sad to do', ideas: ['LOSE AGAIN', 'GET WET', 'GO HOME'] },
      },
    },
  ],
  rhyme: [
    {
      lines: ['WE ARE HALLAM, WE ARE LOUD,', 'WE\'RE THE BEST IN ALL THE {A}!'],
      blanks: { A: { beats: 1, rhyme: 'LOUD', hint: 'Must rhyme with LOUD', ideas: ['CROWD', 'CLOUD', 'TOWN'] } },
    },
    {
      lines: ['THE GREEN IS SOAKING, THE TEA IS COLD,', 'DORE AND TOTLEY ARE {A} AND {B}!'],
      blanks: {
        A: { beats: 2, hint: 'An insult', ideas: ['RUBBISH', 'SOGGY', 'BORING'] },
        B: { beats: 1, rhyme: 'COLD', hint: 'Must rhyme with COLD', ideas: ['OLD', 'MOULD', 'SOLD'] },
      },
    },
    {
      lines: ['DORE AND TOTLEY, GO HOME TO YOUR MUM,', 'YOU\'VE GOT A {A} AND A {B}!'],
      blanks: {
        A: { beats: 2, hint: 'Something in a posh picnic', ideas: ['FLASK', 'SCOTCH EGG', 'TEA COSY'] },
        B: { beats: 1, rhyme: 'MUM', hint: 'Must rhyme with MUM', ideas: ['DRUM', 'PLUM', 'CRUMB'] },
      },
    },
  ],
};

// `window` is half the shouting window in seconds: bigger is easier.
const PROLOGUE = {
  id: 'P', name: 'Away Day at Barnsley', place: 'terrace', tutorial: true,
  teams: ['Steel City', 'Barnsley'], start: [0, 0], window: 0.32,
  blurb: 'October 1983. Barnsley v Steel City, nil-nil, ten minutes left. Tony is on Big Col\'s shoulders in the away end.',
  steps: ['chant', 'clap', 'putoff'],
  songs: 'terrace',
};

const LEVELS = [
  {
    id: '1-1', name: 'First Saturday', place: 'bank', teams: ['Hallam', 'Dore & Totley'], start: [5, 5], window: 0.28,
    blurb: 'Hallam v Dore & Totley. It\'s level, 5–5, with one end left. Nobody on the bank has made a sound all afternoon.',
    steps: ['chant', 'putoff'], songs: 'easy',
  },
  {
    id: '1-2', name: 'The Return Fixture', place: 'bank', teams: ['Hallam', 'Dore & Totley'], start: [7, 8], window: 0.24,
    blurb: 'A week later. Hallam are a shot down with two ends left. Dore & Totley have brought their own flasks.',
    steps: ['clap', 'chant', 'putoff', 'putoff'], songs: 'medium',
  },
  {
    id: '1-3', name: 'Cup Semi-Final', place: 'bank', teams: ['Hallam', 'Dore & Totley'], start: [12, 13], window: 0.21,
    blurb: 'The Sheffield & District Cup. Hallam are a shot down. The visiting bowler has started faking his backswing to catch you out.',
    steps: ['chant', 'clap', 'putoff', 'chant', 'putoff'], songs: 'rhyme', fakeouts: true,
  },
];

// ---------------------------------------------------------------- save data
const SAVE_KEY = 'firmhead-v3';
function freshMoods() { return { dorothy: 0, gerald: 0, lads: 0, pell: 0, brian: 0 }; }
function terraceMoods() { return { col: 2, pete: 2, spanner: 1, copper: 0, barnsley: -1 }; }
function freshLog() { return { rude: 0, early: 0, ditched: 0, claps: 0, bestChant: '', bestScore: -1 }; }
function freshSave() {
  return { prologueDone: false, seenIntro: false, stars: {}, won: {}, moods: freshMoods(), log: freshLog(), chants: [], quirks: [] };
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.moods && s.log) return Object.assign(freshSave(), s);
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

// One animation loop for the whole game: draws the crowd, then the current mini-game.
let frameHook = null;
function loop() {
  drawScene();
  if (frameHook) frameHook();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------------------------------------------------------------- prologue: the firm
function titleScene() {
  show(`
    <section class="panel">
      <p class="eyebrow">Issue No. 1 · 20p · Unofficial</p>
      <h1 class="headline">Firm Head</h1>
      <p class="quote">"When terrace football dies, the ultra spirit finds a new green."</p>
      <p>Sheffield, 1983. Tony Notion runs the loudest firm in South Yorkshire. It's about to be taken off him.</p>
      <div class="row">
        ${save.prologueDone ? '<button id="cont">Continue</button><button id="intro" class="ghost">Start again from the prologue</button>'
          : '<button id="intro">Start</button>'}
      </div>
    </section>`);
  on('cont', mapScene);
  on('intro', prologueIntro);
}

function prologueIntro() {
  show(`
    <section class="panel">
      <p class="eyebrow">Prologue · The Steel City Anarchy</p>
      <h2 class="headline">Tony Notion, Firm Head</h2>
      <p>Every Saturday for eleven years, Tony has led the Steel City Anarchy: the loudest, proudest,
         shortest-led firm in South Yorkshire.</p>
      <p>He is four foot ten. He has never once seen a whole match. He has never needed to.
         He doesn't watch the game. He runs the crowd.</p>
      <p>He has a tracksuit for home games, a better tracksuit for away games, and a bottle of Henderson's Relish
         in a holster, for pies.</p>
      <div class="card">
        <p class="tag">The firm</p>
        <ul>${TERRACE_CAST.slice(0, 3).map((p) => `<li><b>${p.name}:</b> ${p.desc}</li>`).join('')}</ul>
      </div>
      <button id="next">Away day</button>
    </section>`);
  on('next', () => startLevel(PROLOGUE));
}

function prologueEnd() {
  save.prologueDone = true;
  persist();
  show(`
    <section class="panel">
      <p class="eyebrow">The Sheffield Evening Pipe · Monday</p>
      <h2 class="headline">Firms banned</h2>
      <p class="how">Home Office orders every football firm in the country to disband. Banners, flags and organised singing outlawed on the terraces.</p>
      <p>Tony reads it three times in the café on Hillsborough Corner. Big Col reads it over his shoulder. Then Col goes quiet for the first time anyone can remember.</p>
      <p class="speech"><b>BIG COL:</b> "What do we do on Saturdays now, Tone?"</p>
      <p class="speech"><b>TONY:</b> "We find another crowd, Col."</p>
      <p>Col gets a job at the Co-op. Mucky Pete moves to Rotherham. Spanner just stops turning up.</p>
      <p>Tony keeps the tracksuit. He keeps the Hendo's. And on Saturday, at three o'clock, he goes out anyway.</p>
      <button id="next">Saturday</button>
    </section>`);
  on('next', introScene);
}

// ---------------------------------------------------------------- chapter 1 story
function introScene() {
  show(`
    <section class="panel">
      <p class="eyebrow">Chapter 1 · Crown Green Bowling</p>
      <h2 class="headline">Nowhere to be</h2>
      <p>It's raining. Tony walks the jennels for an hour, measuring them in strides out of habit.</p>
      <p>He cuts through Hillsborough Park and hears something he hasn't heard in weeks: a crowd.
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
      <p>Tony isn't allowed on the green. He doesn't need to be. Same as the football: he'll win it from the crowd.</p>
      <p class="speech"><b>MR PELL:</b> "Spectators are asked to remain <i>silent</i>—"</p>
      <div class="card">
        <p class="tag">Same games, new crowd</p>
        <p>Chant, clap along and put him off all work the same as at Barnsley. This crowd is just a lot less keen.
           Everything you do lands on the people around you. Some will join you. Some will complain.</p>
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
    const hard = save.stars[L.id + 'h'] || 0;
    return `<div class="level">
      <div><div class="name">${i + 1}. ${esc(L.name)}</div>
        <div class="stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}
        ${save.won[L.id + 'h'] ? `<span class="how"> Hard ${'★'.repeat(hard)}</span>` : ''}</div></div>
      <div class="row">
        ${save.won[L.id] ? `<button class="ghost" data-hard="${i}">Hard</button>` : ''}
        <button data-level="${i}" ${open ? '' : 'disabled'}>${open ? (save.won[L.id] ? 'Replay' : 'Play') : 'Locked'}</button>
      </div>
    </div>`;
  }).join('');
  show(`
    <section class="panel">
      <p class="eyebrow">Chapter 1</p>
      <h2 class="headline">Crown Green Bowling</h2>
      <p class="how">Hillsborough Park. Three Saturdays. Win a match to unlock the next one.
        Win one to unlock its <b>Hard</b> version: write your own chants and a tighter shout.</p>
      <div class="levels">${levelRows}</div>
      ${save.won['1-3'] ? '<button id="letter" class="ghost">Read the letter again</button>' : ''}
    </section>
    <section class="panel">
      <h3 class="headline">The bank</h3>
      ${peopleList(BANK_CAST, save.moods)}
    </section>
    <section class="panel">
      <h3 class="headline">The road ahead</h3>
      <ul class="chapters">${SPORTS.map((s, i) => `<li class="${i === 0 ? 'on' : ''}">${i + 1}. ${esc(s)}</li>`).join('')}</ul>
    </section>
    <div class="row">
      <button id="prologue" class="ghost">Replay the prologue</button>
      <button id="title" class="ghost">Title screen</button>
      <button id="reset" class="ghost">Reset progress</button>
    </div>`);
  app.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => startLevel(LEVELS[Number(b.dataset.level)])));
  app.querySelectorAll('[data-hard]').forEach((b) => b.addEventListener('click', () => startLevel(LEVELS[Number(b.dataset.hard)], true)));
  on('title', titleScene);
  on('letter', banningScene);
  on('prologue', () => startLevel(PROLOGUE));
  let armed = false;
  on('reset', (e) => {
    if (!armed) { armed = true; e.target.textContent = 'Tap again to wipe everything'; return; }
    save = freshSave();
    persist();
    titleScene();
  });
}

function peopleList(cast, moods) {
  return `<ul class="people">${cast.map((p) => {
    const m = moods[p.id];
    return `<li><span><b>${p.name}</b><br><span class="how">${p.desc}</span></span>
      <span class="chip ${m > 0 ? 'up' : m < 0 ? 'down' : ''}">${MOODS[m]}</span></li>`;
  }).join('')}</ul>`;
}

// ---------------------------------------------------------------- level runner
let run = null;

function startLevel(L, hard = false) {
  const terrace = L.place === 'terrace';
  // A fresh run of the chapter starts the bank from scratch.
  if (L.id === '1-1' && !hard) { save.moods = freshMoods(); save.log = freshLog(); save.chants = []; persist(); }
  run = {
    L, hard, step: 0, score: L.start.slice(), ultra: 0, nerves: 0, complaints: 0,
    cast: terrace ? TERRACE_CAST : BANK_CAST,
    moods: terrace ? terraceMoods() : save.moods,
    feed: [], flash: {}, shoutUntil: 0, shoutWord: '', clapUntil: 0, songsUsed: [],
  };
  const label = L.tutorial ? 'Prologue · Tutorial' : `Level ${LEVELS.indexOf(L) + 1} of ${LEVELS.length}${hard ? ' · Hard' : ''}`;
  show(`
    <section class="panel">
      <p class="eyebrow">${label}</p>
      <h2 class="headline">${esc(L.name)}</h2>
      <p>${esc(L.blurb)}</p>
      <p class="how">${L.tutorial ? 'This is practice. You can\'t lose: take your time and learn the three games.'
        : `${L.steps.length} mini-games. Win the match. Try not to get thrown out.`}
        ${hard ? '<br><b>Hard:</b> you write your own chants from scratch, and the shouting window is much smaller.' : ''}</p>
      <button id="go">${terrace ? 'Get on the terrace' : 'Get on the bank'}</button>
    </section>
    <section class="panel"><h3 class="headline">Who's here</h3>${peopleList(run.cast, run.moods)}</section>`);
  on('go', nextStep);
}

function nextStep() {
  if (run.step >= run.L.steps.length) return run.L.tutorial ? prologueResults() : levelResults();
  const kind = run.L.steps[run.step];
  run.step++;
  if (kind === 'chant') return run.hard ? freestyleChantGame() : chantGame();
  return ({ clap: clapGame, putoff: putOffGame })[kind]();
}

function stage(title, how) {
  show(`
    <header class="bar">
      <p class="eyebrow">${run.L.tutorial ? 'Tutorial' : `Level ${LEVELS.indexOf(run.L) + 1}`} · Part ${run.step} of ${run.L.steps.length}</p>
      <div class="scoreline" id="score"></div>
    </header>
    <canvas id="scene" width="400" height="170" aria-label="The crowd around Tony"></canvas>
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
  const [a, b] = run.L.teams;
  const s = document.getElementById('score');
  if (s) s.innerHTML = `${esc(a)} <b>${run.score[0]}–${run.score[1]}</b> ${esc(b)}`;
  const u = document.getElementById('ultra');
  if (u) u.style.width = `${run.ultra}%`;
  const l = document.getElementById('ultralbl');
  if (l) l.textContent = run.ultra >= 100 ? 'Ultra Meter full: Wedge-Shove ready' : 'Ultra Meter';
}

// Change someone's mood and add their reaction to the feed.
function react(id, delta, quote) {
  const before = run.moods[id];
  run.moods[id] = clamp(before + delta, -3, 3);
  if (delta < 0 && run.moods[id] < 0) run.complaints += 1;
  const p = run.cast.find((x) => x.id === id);
  run.feed.unshift({ who: p.name, quote, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : '', mood: MOODS[run.moods[id]] });
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

function tip(text) {
  return run.L.tutorial ? `<div class="card"><p class="tag">How it works</p><p>${text}</p></div>` : '';
}

// ---------------------------------------------------------------- the crowd (canvas)
function drawScene() {
  const c = document.getElementById('scene');
  if (!c || !run) return;
  const g = c.getContext('2d');
  const t = now();
  if (run.L.place === 'terrace') drawTerrace(g, t);
  else drawBank(g, t);

  for (const p of run.cast) {
    if (p.pair) {
      drawPerson(g, p.x - 11, p, 50, t);
      drawPerson(g, p.x + 11, p, 47, t);
    } else {
      drawPerson(g, p.x, p, p.h || 52, t);
    }
  }
  drawTony(g, t);

  // drizzle, home and away
  g.strokeStyle = run.L.place === 'terrace' ? 'rgba(220, 230, 240, 0.35)' : 'rgba(70, 90, 110, 0.35)';
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 70; i++) {
    const y = ((i * 37 + t * 260) % 190) - 10;
    const x = ((i * 67 - y * 0.3) % 400 + 400) % 400;
    g.moveTo(x, y);
    g.lineTo(x - 3, y + 9);
  }
  g.stroke();

  g.font = 'bold 10px "Atkinson Hyperlegible", Verdana, sans-serif';
  g.textAlign = 'center';
  for (const p of run.cast) {
    g.fillStyle = run.L.place === 'terrace' ? '#ffffff' : '#122016';
    g.fillText(p.label || p.name, p.x, 166);
  }
  g.fillStyle = run.L.place === 'terrace' ? '#ffd0d6' : '#b0172e';
  g.fillText('Tony', TONY_X, 166);
}

function drawBank(g) {
  const sky = g.createLinearGradient(0, 0, 0, 70);
  sky.addColorStop(0, '#bcc6cd');
  sky.addColorStop(1, '#dde3e6');
  g.fillStyle = sky;
  g.fillRect(0, 0, 400, 170);
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
  g.fillStyle = '#5c8d57';
  g.fillRect(0, 62, 400, 38);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 400; i += 40) g.fillRect(i, 62, 20, 38);
  g.fillStyle = '#f3f3ee';
  g.fillRect(150, 70, 5, 11);
  g.fillRect(232, 72, 5, 10);
  g.beginPath(); g.arc(152.5, 68, 2.5, 0, Math.PI * 2); g.arc(234.5, 70, 2.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#7c9a6c';
  g.fillRect(0, 100, 400, 70);
}

function drawTerrace(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, 60);
  sky.addColorStop(0, '#4d5864');
  sky.addColorStop(1, '#7c8894');
  g.fillStyle = sky;
  g.fillRect(0, 0, 400, 170);
  // floodlights
  for (const fx of [30, 370]) {
    g.fillStyle = '#2b2f35';
    g.fillRect(fx - 2, 4, 4, 52);
    g.fillStyle = '#fffbe0';
    g.fillRect(fx - 12, 2, 24, 8);
    g.fillStyle = 'rgba(255, 251, 224, 0.12)';
    g.beginPath(); g.moveTo(fx - 12, 10); g.lineTo(fx + (fx < 200 ? 140 : -140), 90); g.lineTo(fx + (fx < 200 ? 60 : -60), 90); g.fill();
  }
  // pitch
  g.fillStyle = '#3f7d3a';
  g.fillRect(0, 50, 400, 44);
  g.strokeStyle = '#e8efe6';
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 60); g.lineTo(400, 60); g.moveTo(200, 50); g.lineTo(200, 94); g.stroke();
  g.fillStyle = '#ffffff';
  const bx = 200 + Math.sin(t * 0.7) * 120;
  g.beginPath(); g.arc(bx, 76, 2.5, 0, Math.PI * 2); g.fill();
  // terrace steps and crush barriers
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#80858b' : '#8c9197';
    g.fillRect(0, 94 + i * 13, 400, 13);
  }
  g.strokeStyle = '#3a3e44';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 118); g.lineTo(400, 118); g.stroke();
  // fence between the pens
  g.strokeStyle = '#c9ced3';
  g.lineWidth = 1;
  for (let x = 340; x <= 348; x += 4) { g.beginPath(); g.moveTo(x, 94); g.lineTo(x, 170); g.stroke(); }
}

function drawPerson(g, x, p, h, t) {
  const feet = 154;
  const mood = run.moods[p.id];
  const fresh = (run.flash[p.id] || 0) > t;
  const bob = mood >= 2 ? Math.abs(Math.sin(t * 6 + x)) * 3 : 0;
  const top = feet - h - bob;
  g.fillStyle = '#2a2d31';
  g.fillRect(x - 5, feet - h * 0.35, 4, h * 0.35);
  g.fillRect(x + 1, feet - h * 0.35, 4, h * 0.35);
  g.fillStyle = p.body;
  g.fillRect(x - 9, top + 14, 18, h * 0.5);
  g.strokeStyle = p.body;
  g.lineWidth = 3;
  g.beginPath();
  if (mood >= 2) {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 14, top + 2);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 14, top + 2);
  } else if (mood <= -2) {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 2, top + 24);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 2, top + 24);
  } else {
    g.moveTo(x - 8, top + 17); g.lineTo(x - 11, top + 30);
    g.moveTo(x + 8, top + 17); g.lineTo(x + 11, top + 30);
  }
  g.stroke();
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

  let markY = top - 6;
  if (p.id === 'dorothy') {
    g.fillStyle = '#5e3f78';
    g.beginPath(); g.arc(x, top - 1, 17, Math.PI, 0); g.fill();
    g.strokeStyle = '#2a2d31'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, top - 1); g.lineTo(x, top + 26); g.stroke();
    g.fillStyle = '#c9ccd0'; g.fillRect(x + 9, top + 26, 4, 10);
    markY = top - 20;
  } else if (p.id === 'gerald') {
    g.fillStyle = '#8d8f93';
    g.fillRect(x + 12, feet - 13, 18, 5);
    g.fillRect(x + 13, feet - 8, 2, 8); g.fillRect(x + 27, feet - 8, 2, 8);
    g.beginPath(); g.arc(x + 31, feet - 14, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a3c3f'; g.fillRect(x - 9, top - 2, 18, 4);
  } else if (p.id === 'brian') {
    g.strokeStyle = '#5a4a2a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + 13, top + 4); g.lineTo(x + 13, feet); g.stroke();
    g.beginPath(); g.moveTo(x + 7, top + 4); g.lineTo(x + 19, top + 4); g.stroke();
  } else if (p.id === 'pell') {
    g.fillStyle = '#f3f1e8'; g.fillRect(x - 9, top + 14, 18, 5);
    g.fillStyle = '#7a2230'; g.fillRect(x - 16, top + 22, 7, 9);
  } else if (p.id === 'copper') {
    g.fillStyle = '#141b38';
    g.beginPath(); g.ellipse(x, top - 2, 8, 11, 0, Math.PI, 0); g.fill();
    g.fillRect(x - 9, top - 2, 18, 3);
    g.fillStyle = '#f1f1f1'; g.fillRect(x + 10, top + 22, 6, 8); // notebook
    markY = top - 16;
  } else if (p.id === 'pete' || p.id === 'col') {
    g.fillStyle = '#ffffff';
    g.fillRect(x - 9, top + 14, 18, 3); // scarf
    g.fillStyle = '#b0172e';
    g.fillRect(x - 3, top + 14, 4, 3);
  } else if (p.id === 'barnsley') {
    g.fillStyle = '#ffffff'; g.fillRect(x - 9, top + 22, 18, 3);
  }

  if (fresh || mood <= -2) {
    g.font = 'bold 14px "Anton", Impact, sans-serif';
    g.textAlign = 'center';
    g.fillStyle = mood < 0 ? '#ff6b7d' : '#7be08a';
    if (run.L.place !== 'terrace') g.fillStyle = mood < 0 ? '#b0172e' : '#1f5a2c';
    const mark = mood <= -3 ? '✉' : mood < 0 ? '!!' : mood >= 2 ? '♪' : '?';
    g.fillText(mark, x, markY);
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
  g.fillStyle = '#5a3a1e'; g.fillRect(x - 7, top - 1, 14, 4);
  g.fillStyle = '#1b1b1b';
  g.fillRect(x - 3, top + 5, 1.6, 1.6);
  g.fillRect(x + 1.6, top + 5, 1.6, 1.6);
  if (shouting) {
    g.beginPath(); g.arc(x, top + 11, 2.5, 0, Math.PI * 2); g.fill();
    g.font = '18px "Anton", Impact, sans-serif';
    const w = g.measureText(run.shoutWord).width + 14;
    const bx = Math.min(x + 12, 396 - w);
    g.fillStyle = '#ffffff';
    g.fillRect(bx, top - 26, w, 24);
    g.strokeStyle = '#16191d'; g.lineWidth = 2;
    g.strokeRect(bx, top - 26, w, 24);
    g.fillStyle = '#b0172e';
    g.textAlign = 'left';
    g.fillText(run.shoutWord, bx + 7, top - 7);
  } else {
    g.fillRect(x - 2, top + 10, 4, 1.4);
  }
}

function tonyShouts(word, dur = 0.9) {
  run.shoutWord = word;
  run.shoutUntil = now() + dur;
}

// ---------------------------------------------------------------- chant marking
const TOPIC = ['jack', 'bowl', 'bowls', 'bowling', 'green', 'mat', 'bias', 'end', 'ends', 'ditch', 'wood', 'woods',
  'hallam', 'dore', 'totley', 'pell', 'umpire', 'cardigan', 'cardigans', 'flask', 'soup', 'tea', 'urn', 'scone', 'scones',
  'sandwich', 'sandwiches', 'cucumber', 'biscuit', 'biscuits', 'rain', 'wet', 'drizzle', 'cold', 'saturday', 'crown',
  'whippet', 'clive', 'rake', 'blazer', 'posh', 'pension', 'pensioners', 'slippers', 'bench', 'brian', 'dorothy',
  'gerald', 'trolley', 'wheelbarrow', 'skip', 'hat', 'cap', 'sock', 'pass', 'bag'];
const FOOTBALL = ['goal', 'goals', 'ref', 'referee', 'keeper', 'barnsley', 'rotherham', 'pie', 'pies', 'gravy',
  'bovril', 'terrace', 'kop', 'away', 'offside', 'penalty', 'bucket', 'taxi', 'bin', 'tractor', 'coal', 'pit', 'whistle'];
const SHEFF = ['sheffield', 'sheff', 'steel', 'city', 'hendo', 'hendos', "hendo's", 'hendersons', "henderson's", 'relish',
  'jennel', 'jennels', 'gennel', 'nesh', 'mardy', 'chuffed', 'owt', 'nowt', 'hillsborough', 'tony', 'firm',
  'ultra', 'ultras', 'yorkshire', 'chip', 'chips', 'oatcake'];
const TAUNTS = ['going home', 'who are ya', 'who are you', 'sit down', 'shut up', 'rubbish', 'shocking', 'disgrace',
  "can't", 'cant', 'never', 'useless', 'your mum', "you're", 'youre', 'you are', "we're", 'we are', "we'll", 'pathetic',
  'boring', 'soft', 'nobody', 'losing', 'lose', 'beat you', 'scared', 'shaking', 'crying', 'go home', 'is that all', 'soggy', 'old'];
const RUDE = /\b(shit|fuck|bastard|wanker|twat|arse|bollocks|piss|crap|dick|bugger|prick)/g;

function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
function phraseSyllables(s) { return s.split(/\s+/).filter(Boolean).reduce((n, w) => n + syllables(w), 0); }
function rhymeKey(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  const m = w.match(/[aeiouy]+[^aeiouy]*$/);
  return m ? m[0] : w;
}
function rhymes(a, b) {
  a = a.toLowerCase().replace(/[^a-z]/g, '');
  b = b.toLowerCase().replace(/[^a-z]/g, '');
  if (!a || !b || a === b) return false;
  // Close enough for a terrace: same ending sound, or same last two letters.
  return rhymeKey(a) === rhymeKey(b) || a.slice(-2) === b.slice(-2) || a.slice(-3, -1) === b.slice(-3, -1) && a.length > 2;
}
function topicalWords(lower) {
  const words = lower.split(/[^a-z']+/).filter(Boolean);
  return new Set(words.filter((w) => TOPIC.includes(w) || SHEFF.includes(w) || FOOTBALL.includes(w)));
}

// Fill-in-the-blank: each blank scores up to 3, and generously.
function judgeBlank(value, blank) {
  const v = value.trim();
  if (!v) return { v: 0, tip: 'Left blank. Tony hums that bit.' };
  let score = 1;
  const tips = [];
  const syl = phraseSyllables(v);
  if (Math.abs(syl - blank.beats) <= 1) { score++; tips.push('Fits the tune.'); }
  else tips.push(`A bit ${syl > blank.beats ? 'long' : 'short'} for the tune: about ${blank.beats} beat${blank.beats > 1 ? 's' : ''} fits.`);
  const last = v.split(/\s+/).pop();
  const upper = v.toUpperCase();
  if (blank.rhyme) {
    if (rhymes(last, blank.rhyme) || blank.ideas.includes(upper)) { score++; tips.push(`Rhymes with ${blank.rhyme}.`); }
    else tips.push(`Doesn't rhyme with ${blank.rhyme}.`);
  } else if (blank.ideas.includes(upper) || topicalWords(v.toLowerCase()).size || TAUNTS.some((t) => v.toLowerCase().includes(t))) {
    score++;
    tips.push('The crowd gets it.');
  } else {
    score++; // anything daft is fine on a terrace
    tips.push('Daft. They like it.');
  }
  return { v: Math.min(3, score), tip: tips.join(' ') };
}

// Freestyle (Hard): mark a typed chant out of 12 across four plain categories.
function judgeChant(text) {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = lower.split(/[^a-z']+/).filter(Boolean);
  const lines = clean.split(/[\n\/.!?;,]+/).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));
  const res = { words: words.length, rude: (lower.match(RUDE) || []).length, marks: [] };
  if (words.length < 3) { res.short = true; res.total = 0; return res; }

  const perLine = lines.map((l) => phraseSyllables(l));
  const singable = perLine.filter((n) => n >= 4 && n <= 12).length / perLine.length;
  const totalSyl = perLine.reduce((a, b) => a + b, 0);
  const counts = {};
  words.forEach((w) => { if (w.length > 2) counts[w] = (counts[w] || 0) + 1; });
  const repeats = Object.values(counts).some((n) => n > 1);
  let rhythm = (singable >= 0.99 ? 2 : singable >= 0.5 ? 1 : 0) + (repeats ? 1 : 0);
  let rhythmTip = rhythm >= 3 ? 'Easy to sing, and it repeats. Proper chant.'
    : rhythm === 2 ? 'Good length to sing. Repeating a word or name makes it catchier.'
      : 'Hard to sing. Aim for lines of about 4 to 12 syllables.';
  if (totalSyl > 40) { rhythm = Math.min(rhythm, 1); rhythmTip = 'Too long. Nobody can remember all that.'; }

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

  const topical = topicalWords(lower);
  const topic = Math.min(3, topical.size);
  const topicTip = topic >= 3 ? 'All about the match and the city. Everyone gets every word.'
    : topic >= 1 ? `Mentions ${[...topical].slice(0, 2).map((w) => `"${w}"`).join(' and ')}. Mention more of what's in front of you.`
      : 'Not about anything here. Mention the match, the rain, the other lot or Sheffield.';

  const cheek = Math.min(3, TAUNTS.filter((p) => lower.includes(p)).length);
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
  res.key = lower.replace(/[^a-z]/g, '');
  res.stale = save.chants.includes(res.key);
  if (res.stale) res.total = Math.floor(res.total / 2);
  return res;
}

function dots(v) { return `<span class="dots" aria-label="${v} out of 3">${'●'.repeat(v)}${'○'.repeat(3 - v)}</span>`; }

function chantVerdict(total) {
  return total <= 3 ? 'A few people look round. Nobody joins in.'
    : total <= 6 ? 'A couple of voices join in, then trail off.'
      : total <= 9 ? 'The crowd picks it up. The other lot look over.'
        : 'Proper terrace noise. The other lot have gone quiet.';
}

// ---------------------------------------------------------------- mini-game: chant (fill the blanks)
function chantGame() {
  const pool = SONGS[run.L.songs];
  const fresh = pool.filter((s) => !run.songsUsed.includes(s));
  const song = pick(fresh.length ? fresh : pool);
  run.songsUsed.push(song);
  const ids = Object.keys(song.blanks);

  const el = stage('Chant', `Fill in the gap${ids.length > 1 ? 's' : ''} and sing it. Type your own word or tap an idea.`);
  const lineHtml = song.lines.map((l) => esc(l).replace(/\{(\w)\}/g, (_, id) =>
    `<input class="blank" id="blank-${id}" data-b="${id}" maxlength="24" autocomplete="off" autocapitalize="characters" aria-label="Gap ${id}" placeholder="?">`)).join('<br>');
  el.innerHTML = `
    ${tip('A chant is a song with gaps. Fill each gap with a word that fits the tune. Shorter words fit short gaps. Any of the ideas will work fine.')}
    <p class="song">${lineHtml}</p>
    ${ids.map((id) => `<div class="gap">
      <p class="eyebrow">${ids.length > 1 ? `Gap ${id}` : 'The gap'}: ${esc(song.blanks[id].hint)}</p>
      <div class="starters">${song.blanks[id].ideas.map((w) => `<button data-fill="${id}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>
    </div>`).join('')}
    <div class="row"><button id="sing">Sing it</button></div>
    <div id="result"></div>`;
  el.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => {
    const input = document.getElementById(`blank-${b.dataset.fill}`);
    input.value = b.dataset.w;
    sizeInput(input);
  }));
  el.querySelectorAll('.blank').forEach((input) => input.addEventListener('input', () => sizeInput(input)));

  on('sing', () => {
    const values = {};
    for (const id of ids) values[id] = document.getElementById(`blank-${id}`).value.trim();
    const out = document.getElementById('result');
    if (ids.some((id) => !values[id])) {
      out.innerHTML = '<p class="verdict">Fill in every gap first. Tap one of the ideas if you\'re stuck.</p>';
      return;
    }
    const marks = ids.map((id) => ({ id, ...judgeBlank(values[id], song.blanks[id]) }));
    const sung = song.lines.map((l) => l.replace(/\{(\w)\}/g, (_, id) => values[id].toUpperCase())).join(' ');
    const lower = sung.toLowerCase();
    const pct = marks.reduce((n, m) => n + m.v, 0) / (3 * ids.length);
    const total = Math.round(pct * 12);
    const r = {
      total, rude: (lower.match(RUDE) || []).length,
      cheek: Math.min(3, TAUNTS.filter((p) => lower.includes(p)).length),
      topic: Math.min(3, topicalWords(lower).size),
      mentionsTurf: /\b(green|ditch|grass|turf)\b/.test(Object.values(values).join(' ').toLowerCase()),
      text: sung,
    };
    el.querySelectorAll('.gap, .row, .card').forEach((n) => n.remove());
    el.querySelector('.song').remove();
    out.innerHTML = `
      <p class="sung">"${esc(sung)}"</p>
      <div class="marks">${marks.map((m) => `<div class="mark"><span class="k">${esc(values[m.id].toUpperCase())}</span>
        ${dots(m.v)}<span class="tip">${esc(m.tip)}</span></div>`).join('')}</div>
      <p class="verdict">${chantVerdict(total)}</p>`;
    singChant(r);
    continueButton(out);
  });
}

function sizeInput(input) {
  input.style.width = `${Math.max(3, input.value.length + 1)}ch`;
}

// ---------------------------------------------------------------- mini-game: chant (freestyle, Hard)
const STARTERS = ["YOU'RE GOING HOME IN A ", "WE'LL SING ON THE ", 'WHO ARE YA? WHO ARE YA? ', 'DORE AND TOTLEY, ', 'YOUR CARDIGAN IS '];

function freestyleChantGame() {
  const el = stage('Chant: freestyle', 'Write the whole chant yourself. Two short lines that rhyme work best. Mention what\'s in front of you. Aim it at the other lot.');
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
    const text = box.value.trim();
    [...el.children].forEach((n) => { if (n.id !== 'result') n.remove(); });
    out.innerHTML = `
      <p class="sung">"${esc(text)}"</p>
      <div class="marks">${r.marks.map((m) => `<div class="mark"><span class="k">${m.k}</span>${dots(m.v)}
        <span class="tip">${esc(m.tip)}</span></div>`).join('')}</div>
      ${r.stale ? '<p class="how">They\'ve heard that one already. Half marks.</p>' : ''}
      <p class="verdict">${r.total} out of 12. ${chantVerdict(r.total)}</p>`;
    if (!r.stale) save.chants.push(r.key);
    r.text = text;
    singChant(r);
    continueButton(out);
  });
}

// What a chant does to the match and the crowd.
function singChant(r) {
  Sound.chant();
  tonyShouts(pick(['LA LA LA', 'COME ON!', 'ALL TOGETHER']), 1.4);
  addUltra(r.total * 7);
  run.nerves += r.total;
  if (run.L.place === 'terrace') {
    if (r.total >= 6) react('col', 1, 'GET IN, TONE!');
    if (r.total >= 9) react('pete', 1, 'Even the Barnsley lot are humming it.');
    react('spanner', 1, 'Spanner sings it three times, slightly wrong.');
    if (r.cheek >= 1) react('barnsley', -1, 'They sing something back. Nobody can make it out.');
    react('copper', r.rude ? -2 : -1, r.rude ? 'PC Hargreaves underlines something twice.' : 'PC Hargreaves writes something in his notebook.');
  } else {
    if (r.total > save.log.bestScore && !r.rude) { save.log.bestScore = r.total; save.log.bestChant = r.text.toUpperCase(); }
    if (r.rude) {
      save.log.rude += r.rude;
      react('pell', -2, 'I have written that word down, Mr Notion. In pencil.');
      react('dorothy', -1, 'There are children in Crookes, you know.');
    }
    if (r.total >= 6) react('lads', 1, pick(['Go on then. That one\'s not bad.', 'Ha! Say it again!']));
    if (r.total >= 9) react('lads', 1, 'We\'re having that. Again!');
    if (r.total <= 3 && !r.rude) react('lads', -1, 'Embarrassing, that.');
    if (r.total >= 9 && !r.rude) react('dorothy', 1, 'She\'s humming it into her soup.');
    else if (r.cheek >= 2 && !r.rude) react('dorothy', -1, 'There\'s no need for that. They\'re from Dore.');
    if (r.topic >= 2) react('gerald', 1, 'That\'s actually quite funny. Isn\'t it, Clive?');
    if (r.mentionsTurf) react('brian', 1, 'Nice to hear someone appreciate the turf.');
    if (r.cheek >= 3) react('pell', -1, 'Spectators are asked to remain SILENT.');
  }
  renderFeed();
  updateHud();
  persist();
}

// ---------------------------------------------------------------- mini-game: clap along
function clapGame() {
  const el = stage('Clap along', 'Tap <b>Clap</b> each time a red dot reaches the black line. Get it right and the crowd joins in.');
  el.innerHTML = `
    ${tip('Dots slide in from the right. Clap when one touches the line. The pattern is the old terrace one: clap, clap, clap-clap-clap. Missing a few is fine.')}
    <canvas id="lane" width="400" height="110" aria-label="Clap marks moving towards the line"></canvas>
    <p id="judge" class="judge" aria-live="polite">Tap when you're ready</p>
    <button id="ready" class="big">I'm ready</button>
    <button id="clapbtn" class="big" hidden>Clap</button>
    <div id="result"></div>`;
  const lane = document.getElementById('lane');
  const g = lane.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 400, 110);
  readyThen(lane, 'clapbtn', begin);

  function begin() {
    const easy = !run.hard;
    const BEAT = 60 / (easy ? 80 : 96);
    const PATTERN = [0, 1, 2, 2.5, 3];
    const BARS = easy ? 2 : 3;
    const LEAD = 4;
    const PERFECT = easy ? 0.1 : 0.07;
    const GOOD = easy ? 0.2 : 0.13;
    const REACH = easy ? 0.3 : 0.2;
    const t0 = now() + 1.0;
    const notes = [];
    for (let bar = 0; bar < BARS; bar++) for (const b of PATTERN) notes.push({ t: t0 + (LEAD + bar * 4 + b) * BEAT, hit: null });
    const ticks = [];
    for (let i = 0; i < LEAD + BARS * 4; i++) ticks.push(t0 + i * BEAT);
    let nextTick = 0;
    let perfect = 0;
    let good = 0;
    let finished = false;
    const judgeEl = document.getElementById('judge');
    const HIT_X = 56;
    const SPEED = 170;
    const say = (t) => { judgeEl.textContent = t; };

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
        if (Math.abs(d) < REACH && (!best || Math.abs(d) < Math.abs(best.d))) best = { n, d };
      }
      if (!best) { say(t < notes[0].t - REACH ? 'Wait for it…' : 'No dot there'); return; }
      const ad = Math.abs(best.d);
      if (ad < PERFECT) { best.n.hit = 'perfect'; perfect++; say('Spot on'); }
      else if (ad < GOOD) { best.n.hit = 'good'; good++; say('Close enough'); }
      else { best.n.hit = 'miss'; say(best.d < 0 ? 'Bit early' : 'Bit late'); }
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
      for (const n of notes) if (!n.hit && t - n.t > REACH) { n.hit = 'miss'; say('Missed one'); }
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 400, 110);
      g.fillStyle = '#eef1f3';
      g.fillRect(0, 35, 400, 40);
      // the catch zone, so it's obvious where to tap
      g.fillStyle = 'rgba(45, 106, 57, 0.18)';
      g.fillRect(HIT_X - GOOD * SPEED, 30, GOOD * SPEED * 2, 50);
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
      addUltra(score * 50);
      run.nerves += Math.round(score * 6);
      const out = document.getElementById('result');
      const verdict = score >= 0.7 ? 'The whole crowd is clapping.'
        : score >= 0.4 ? 'A few people join in. It sort of holds together.'
          : 'Tony claps on his own for a bit. It is very quiet afterwards.';
      out.innerHTML = `<p class="verdict">${perfect} spot on, ${good} close, ${notes.length - perfect - good} missed (${pct}%). ${verdict}</p>`;
      if (run.L.place === 'terrace') {
        react('col', 1, 'Col claps so hard Tony nearly falls off his shoulders.');
        if (score >= 0.4) react('pete', 1, 'Whole end\'s going now!');
        react('copper', -1, 'PC Hargreaves writes "clapping (organised)".');
      } else {
        save.log.claps += 1;
        if (score >= 0.7) react('lads', 1, 'Dean\'s clapping. Wayne\'s clapping. They didn\'t mean to.');
        else if (score < 0.3) react('lads', -1, 'Is he alright?');
        if (score >= 0.85) react('dorothy', 1, 'She taps her flask along. Just a bit.');
        if (score >= 0.4) react('pell', -1, 'Clapping is for the END of an end, not during!');
        if (score >= 0.4) react('gerald', 1, 'Clive is wagging in time.');
      }
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
  const kick = run.L.place === 'terrace';
  const tut = run.L.tutorial;
  const wedge = run.ultra >= 100;
  const who = kick ? 'The Barnsley keeper is taking a goal kick. He swings his leg back' : 'The Dore &amp; Totley bowler swings his arm back';
  const el = stage('Put him off', `${who} before he hits it. Tap <b>Shout</b> when the marker is in the green part of the bar.
    ${wedge ? '<br><b>Ultra Meter full:</b> Tony and the lads do the Wedge-Shove. Your window is much wider this time.' : ''}`);
  el.innerHTML = `
    ${tip('Watch the bar under him. A red marker slides along it. When it reaches the green part, he\'s at the top of his swing: shout! If you go too early, he just starts again.')}
    <canvas id="mat" width="400" height="250" aria-label="The player you're putting off, and where the ball goes"></canvas>
    <p id="judge" class="judge" aria-live="polite">Tap when you're ready</p>
    <button id="ready" class="big">I'm ready</button>
    <button id="shout" class="big" hidden>Shout</button>
    <div id="result"></div>`;
  const cv = document.getElementById('mat');
  const g = cv.getContext('2d');
  const judgeEl = document.getElementById('judge');
  const shoutBtn = document.getElementById('shout');

  const widen = (!kick && hasQuirk('jennels') ? 1.1 : 1) * Math.min(1.4, 1 + run.nerves / 50) * (wedge ? 1.6 : 1);
  const halfBase = (run.L.window || 0.24) * (run.hard ? 0.5 : 1) * widen;
  const showNow = !run.hard;
  let earlyChances = tut ? Infinity : run.hard ? 0 : 1;

  let T = null;
  let outcome = null;
  let tapT = 0;
  let rollStart = 0;
  let finished = false;

  function setup() {
    const start = now() + 0.9;
    const fake = run.L.fakeouts && Math.random() < 0.6;
    const fakeEnd = fake ? start + 1.2 : start;
    const s1 = fakeEnd + (fake ? 0.4 : 0) + Math.random() * 0.4;
    const back = run.hard ? 0.55 + Math.random() * 0.4 : 0.9 + Math.random() * 0.4;
    const s2 = s1 + back;
    const hold = run.hard ? 0.05 + Math.random() * 0.15 : 0.2 + Math.random() * 0.15;
    const s2h = s2 + hold;
    const s3 = s2h + 0.3;
    const mid = (s2 + s2h) / 2;
    const half = halfBase + hold / 2;
    T = { start, fake, fakeEnd, s1, back, s2, s2h, s3, mid, half, winLo: mid - half, winHi: mid + half };
    outcome = null;
    tapT = 0;
    shoutBtn.disabled = false;
    judgeEl.textContent = 'Wait for the green…';
  }
  readyThen(cv, 'shout', setup);

  function swingAngle(t) {
    const deg = (d) => (d * Math.PI) / 180;
    if (!T) return 0;
    if (T.fake && t >= T.start && t < T.fakeEnd) return deg(-60 * Math.sin(((t - T.start) / (T.fakeEnd - T.start)) * Math.PI));
    if (outcome === 'retry' && t > tapT) return 0;
    if (t < T.s1) return 0;
    if (t < T.s2) return deg(-120 * ((t - T.s1) / T.back));
    if (t < T.s2h) return deg(-120);
    if (t < T.s3) return deg(-120 + 170 * ((t - T.s2h) / (T.s3 - T.s2h)));
    return deg(50);
  }

  function retry(msg) {
    outcome = 'retry';
    shoutBtn.disabled = true;
    judgeEl.textContent = msg;
    setTimeout(() => { if (document.getElementById('mat') === cv) setup(); }, 1700);
  }

  function shout(e) {
    if (e) e.preventDefault();
    if (!T || outcome) return;
    const t = now();
    tapT = t;
    Sound.shout();
    tonyShouts(pick(['OI!', 'HENDO\'S!', 'WHO ARE YA?', 'AWAY!']));
    let result;
    if (t < T.winLo) result = 'early';
    else if (t <= T.winHi) result = Math.abs(t - T.mid) <= T.half * 0.5 ? 'perfect' : 'good';
    else if (t < T.s3) result = 'late';
    else return;
    if (result === 'early' && earlyChances > 0) {
      earlyChances--;
      if (!tut) {
        save.log.early += 1;
        react('pell', -1, 'That is a formal warning, young man.');
        renderFeed();
      }
      return retry(tut ? 'Too early! Wait for the green. He\'s starting again…' : 'Too early! He glares at you and starts again. Last chance.');
    }
    if (result === 'late' && tut) return retry('Too late! Shout while the marker is in the green. Again…');
    outcome = result;
    resolve();
  }
  shoutBtn.addEventListener('pointerdown', shout);
  cv.addEventListener('pointerdown', shout);
  onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) shout(e); } };

  const TEXT = kick ? {
    perfect: 'Perfect. He shanks it straight into the stand. Steel City win it back and score!',
    good: 'Good shout. He scuffs it to a Steel City player, who scores!',
  } : {
    early: 'Too early again. He bowls calmly while the umpire takes your name.',
    perfect: 'Perfect timing. He jumps out of his skin and the bowl ends up in the ditch.',
    good: 'Good shout. He flinches and the bowl drifts wide.',
    late: 'Too late. He\'d already let go. He barely noticed.',
    missed: 'You didn\'t shout. His bowl curls in and kisses the jack.',
  };
  const LANDING = { perfect: { dx: 70, dy: -10 }, good: { dx: 34, dy: 14 }, late: { dx: 12, dy: 6 }, early: { dx: 7, dy: -5 }, missed: { dx: 2, dy: 3 } };

  function resolve() {
    rollStart = now() + 0.35;
    shoutBtn.disabled = true;
    judgeEl.textContent = { early: 'Too early!', perfect: 'Perfect!', good: 'Good shout', late: 'Too late', missed: 'Silence' }[outcome];
  }

  function finish() {
    finished = true;
    frameHook = null;
    onKey = null;
    shoutBtn.remove();
    if (wedge) run.ultra = 0;
    const out = document.getElementById('result');
    if (kick) {
      run.score[0] += 1;
      Sound.cheer();
      react('col', 1, 'Col throws Tony in the air. Tony lands on Spanner.');
      react('barnsley', -1, 'The Barnsley end goes very quiet.');
      react('copper', -1, 'PC Hargreaves turns to a new page.');
    } else if (outcome === 'perfect') {
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
      Sound.groan();
      react('dorothy', -1, 'I\'ve spilt my soup.');
      narrate('He bowls calmly. Dore & Totley win the end.');
    } else if (outcome === 'late') {
      run.score[1] += 1;
      Sound.groan();
      narrate('Dore & Totley win the end by a shot.');
    } else {
      run.score[1] += 1;
      Sound.groan();
      react('lads', -1, 'Thought you were meant to be good at this.');
      narrate('Dore & Totley win the end.');
    }
    out.innerHTML = `<p class="verdict">${TEXT[outcome]}</p>`;
    renderFeed();
    updateHud();
    persist();
    continueButton(out);
  }

  frameHook = () => {
    const t = now();
    if (T && !outcome && t >= T.s3) {
      if (tut) retry('He got it away. Watch the bar, and shout in the green. Again…');
      else { outcome = 'missed'; resolve(); }
    }
    g.fillStyle = kick ? '#3f7d3a' : '#5c8d57';
    g.fillRect(0, 0, 400, 250);

    // left: the player, side-on
    const bx = 100;
    const by = 150;
    const a = swingAngle(t);
    if (kick) {
      // goalkeeper in green, swinging his right leg
      g.fillStyle = '#1b1b1b';
      g.fillRect(bx - 6, by - 10, 6, 36);
      g.fillStyle = '#7ac943';
      g.fillRect(bx - 10, by - 48, 22, 40);
      g.fillStyle = '#e6c19c';
      g.beginPath(); g.arc(bx + 1, by - 58, 10, 0, Math.PI * 2); g.fill();
      const hx = bx + 3;
      const hy = by - 10;
      const fx = hx + Math.sin(-a) * 34 * -1;
      const fy = hy + Math.cos(a) * 34;
      g.strokeStyle = '#1b1b1b';
      g.lineWidth = 7;
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(fx, fy); g.stroke();
      g.fillStyle = '#ffffff';
      if (!(T && t > T.s3 && outcome !== 'retry')) { g.beginPath(); g.arc(bx + 22, by + 20, 7, 0, Math.PI * 2); g.fill(); }
    } else {
      g.fillStyle = '#2a2d31';
      g.fillRect(bx - 30, by + 26, 60, 6);
      g.fillStyle = '#f4f4ef';
      g.fillRect(bx - 7, by - 10, 6, 36);
      g.fillRect(bx + 3, by - 10, 6, 36);
      g.fillRect(bx - 10, by - 48, 22, 40);
      g.fillStyle = '#e6c19c';
      g.beginPath(); g.arc(bx + 1, by - 58, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f4f4ef';
      g.fillRect(bx - 10, by - 70, 22, 5);
      const sx = bx + 1;
      const sy = by - 42;
      const hx = sx + Math.sin(a) * 34;
      const hy = sy + Math.cos(a) * 34;
      g.strokeStyle = '#f4f4ef';
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
      if (!T || t < T.s3 || outcome === 'retry') {
        g.fillStyle = '#16191d';
        g.beginPath(); g.arc(hx, hy, 7, 0, Math.PI * 2); g.fill();
      }
    }

    // timing bar across the bottom, big and plain
    const barX = 16;
    const barW = 368;
    const barY = 214;
    g.fillStyle = '#ffffff';
    g.fillRect(barX, barY, barW, 24);
    if (T) {
      const span = T.s3 - T.start;
      const px = (tt) => barX + clamp((tt - T.start) / span, 0, 1) * barW;
      const inWindow = t >= T.winLo && t <= T.winHi && !outcome;
      g.fillStyle = inWindow ? '#1f7a35' : '#8fc48f';
      g.fillRect(px(T.winLo), barY, Math.max(4, px(T.winHi) - px(T.winLo)), 24);
      g.fillStyle = '#b0172e';
      const mt = outcome && outcome !== 'retry' ? tapT || t : t;
      g.fillRect(px(mt) - 3, barY - 6, 6, 36);
      if (inWindow && showNow) {
        g.font = '34px "Anton", Impact, sans-serif';
        g.fillStyle = '#ffffff';
        g.strokeStyle = '#16191d';
        g.lineWidth = 4;
        g.textAlign = 'center';
        g.strokeText('NOW!', 100, 40);
        g.fillText('NOW!', 100, 40);
      }
    }
    g.font = 'bold 12px "Atkinson Hyperlegible", Verdana, sans-serif';
    g.fillStyle = '#ffffff';
    g.textAlign = 'left';
    g.fillText('Shout in the green', barX, barY - 10);

    // right: where it goes
    const rx = 230;
    const rw = 150;
    g.fillStyle = kick ? '#2f6a2b' : '#6b5a3e';
    g.fillRect(rx - 10, 6, rw + 20, 186);
    g.fillStyle = kick ? '#4a9443' : '#4f8a4a';
    g.fillRect(rx, 14, rw, 170);
    const jx = rx + rw / 2 - 10;
    const jy = 54;
    if (kick) {
      g.fillStyle = '#2b2b6b'; // Barnsley player waiting for the ball
      g.fillRect(jx - 4, jy - 8, 8, 14);
      g.fillStyle = '#b0172e'; // Steel City player lurking
      g.fillRect(jx + 30, jy + 30, 8, 14);
    } else {
      g.fillStyle = '#f5f0c8';
      g.beginPath(); g.arc(jx, jy, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b0172e';
      g.beginPath(); g.arc(jx + 12, jy + 8, 7, 0, Math.PI * 2); g.fill();
    }
    if (outcome && outcome !== 'retry' && t >= rollStart) {
      const k = clamp((t - rollStart) / 1.6, 0, 1);
      const e = 1 - (1 - k) * (1 - k);
      let ex;
      let ey;
      if (kick) {
        ex = outcome === 'perfect' ? rx + rw + 8 : jx + 34;
        ey = outcome === 'perfect' ? 30 : jy + 30;
      } else {
        const L = LANDING[outcome];
        ex = jx + L.dx;
        ey = jy + L.dy;
      }
      const sx0 = rx + rw / 2 + 20;
      const sy0 = 180;
      const cx = sx0 - 50;
      const cy = (sy0 + ey) / 2;
      const x = (1 - e) * (1 - e) * sx0 + 2 * (1 - e) * e * cx + e * e * ex;
      const y = (1 - e) * (1 - e) * sy0 + 2 * (1 - e) * e * cy + e * e * ey;
      g.fillStyle = kick ? '#ffffff' : '#1d2a52';
      g.beginPath(); g.arc(x, y, kick ? 5 : 7, 0, Math.PI * 2); g.fill();
      if (k >= 1 && !finished) finish();
    }
    g.font = 'bold 11px "Atkinson Hyperlegible", Verdana, sans-serif';
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.fillText(kick ? 'Red: Steel City   Blue: Barnsley' : 'Red: Hallam   Blue: visitors', rx + rw / 2, 202);
  };
}

// ---------------------------------------------------------------- results
function prologueResults() {
  show(`
    <section class="panel">
      <p class="eyebrow">Full time</p>
      <h2 class="headline">Barnsley 0–1 Steel City</h2>
      <p>The away end goes up. Tony goes up with it, on Big Col's shoulders, Hendo's held high like the FA Cup.</p>
      <p>Behind them, PC Hargreaves closes his notebook. It's full.</p>
      <p class="speech"><b>TONY:</b> "Same again next week, lads."</p>
      <div class="card">
        <p class="tag">You've learned</p>
        <ul>
          <li><b>Chant:</b> fill the gaps in a song.</li>
          <li><b>Clap along:</b> tap when the dots hit the line.</li>
          <li><b>Put him off:</b> shout when the marker is in the green.</li>
        </ul>
        <p>Chants and claps also fill the <b>Ultra Meter</b>. When it's full, your next shout gets a much bigger window.</p>
      </div>
      <button id="next">There is no next week</button>
    </section>`);
  on('next', () => (save.seenIntro ? (save.prologueDone = true, persist(), mapScene()) : prologueEnd()));
}

function levelResults() {
  const L = run.L;
  const key = L.id + (run.hard ? 'h' : '');
  const [h, v] = run.score;
  const won = h > v;
  const allies = BANK_CAST.filter((p) => save.moods[p.id] >= 2).length;
  const checks = [
    { ok: won, text: 'Hallam win the match' },
    { ok: allies >= 2, text: 'At least two people on the bank on your side' },
    { ok: run.complaints < 3, text: 'Fewer than three complaints' },
  ];
  const stars = checks.filter((c) => c.ok).length;
  if (won) {
    save.won[key] = true;
    save.stars[key] = Math.max(save.stars[key] || 0, stars);
  }
  persist();
  const last = LEVELS.indexOf(L) === LEVELS.length - 1;
  const firstFinal = won && last && !run.hard;
  show(`
    <section class="panel">
      <p class="eyebrow">Full time · ${esc(L.name)}${run.hard ? ' · Hard' : ''}</p>
      <h2 class="headline">${won ? 'Hallam win!' : h === v ? 'A draw. Not good enough.' : 'Hallam lose'}</h2>
      <p class="scoreline">Hallam <b>${h}–${v}</b> Dore &amp; Totley</p>
      <p class="bigstars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
      <ul class="checks">${checks.map((c) => `<li class="${c.ok ? 'ok' : ''}">${c.text}</li>`).join('')}</ul>
      <p>${won ? (last ? 'Hallam are in the Cup Final. Mr Pell is not celebrating. He is writing a letter.'
        : 'Mr Pell shakes the visiting captain\'s hand and avoids eye contact with Tony.')
        : 'You need a win to unlock the next Saturday. Have another go.'}</p>
      <div class="row">
        ${firstFinal ? '<button id="letter">A letter arrives</button>'
          : won && !last && !run.hard ? '<button id="next">Next Saturday</button>' : !won ? '<button id="retry">Try again</button>' : ''}
        <button id="map" class="${firstFinal || (won && !last) || !won ? 'ghost' : ''}">Chapter map</button>
      </div>
    </section>
    <section class="panel"><h3 class="headline">The bank after the match</h3>${peopleList(BANK_CAST, save.moods)}</section>`);
  on('next', () => startLevel(LEVELS[LEVELS.indexOf(L) + 1]));
  on('retry', () => startLevel(L, run.hard));
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
  const recruits = BANK_CAST.filter((p) => save.moods[p.id] >= 2);
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
      <p class="how">That's the end of Chapter 1 for now. Chapter 2, Badminton, is next. Try the <b>Hard</b> versions on the chapter map.</p>
      <div class="row"><button id="map">Chapter map</button></div>
    </section>`);
  on('map', mapScene);
}

titleScene();
