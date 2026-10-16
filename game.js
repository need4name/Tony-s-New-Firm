'use strict';
// FIRM HEAD — Act I vertical slice: Crown Green Bowling.
// Flow: title → Act I intro → Epiphany Loop (monologue → epiphany → skill unlock)
//       → bowls match with Chant Builder → infraction → banning order → loophole.

const app = document.getElementById('app');

// ---------------------------------------------------------------- audio
const Sound = (() => {
  let ctx = null;
  let muted = false;
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
  function tone(freq, dur, { type = 'sine', gain = 0.1, attack = 0.02, filter = 0, when = 0 } = {}) {
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
  return {
    toggle() { muted = !muted; return muted; },
    // Muffled "wah-wah" adult voice for the rules monologue.
    wah() {
      const f = 120 + Math.random() * 70;
      tone(f, 0.22, { type: 'sawtooth', gain: 0.05, filter: 380 });
      tone(f * 0.8, 0.22, { type: 'sawtooth', gain: 0.03, filter: 380, when: 0.1 });
    },
    // Detuned 80s synth pad for the epiphany.
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
    clack() { tone(820, 0.08, { type: 'triangle', gain: 0.18 }); },
    stamp() { tone(70, 0.35, { type: 'square', gain: 0.25, filter: 260 }); },
    unlock() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 0.3, { type: 'square', gain: 0.05, when: i * 0.1 }));
    },
    boo() { tone(110, 0.6, { type: 'sawtooth', gain: 0.05, filter: 500 }); },
  };
})();

document.getElementById('mute').addEventListener('click', (e) => {
  e.target.textContent = Sound.toggle() ? '♪ OFF' : '♪ ON';
});

// ---------------------------------------------------------------- campaign state
const campaign = {
  quirks: [],   // accumulated Ultra Quirks (stack across sports)
  skills: [],   // unlocked mini-game abilities
  ultra: 0,     // Ultra Meter, 0–100
};

function hasQuirk(id) { return campaign.quirks.some((q) => q.id === id); }

function show(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

function on(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

// ---------------------------------------------------------------- scenes
function titleScene() {
  show(`
    <section class="zine">
      <p class="kicker">Issue No. 1 · Price 20p · Unofficial</p>
      <h1 class="headline">Firm Head</h1>
      <p class="quote">"When terrace football dies, the ultra spirit finds a new green."</p>
      <p>Sheffield, 1984. The firms are banned. Tony Notion — leader of the Steel City Anarchy,
         legend of the Kop, approximately four foot ten — needs somewhere to put all that energy.</p>
      <button id="start">Kick Off</button>
    </section>`);
  on('start', introScene);
}

function introScene() {
  show(`
    <section class="zine">
      <p class="kicker">Act I</p>
      <h2 class="headline">Disbanded &amp; Displacement</h2>
      <p>The Home Office letter arrived on a Tuesday. The Steel City Anarchy is formally disbanded.
         Tony's away-day tracksuit hangs on the back of the door like a flag at half mast.</p>
      <p>He walks the jennels for three days, measuring each one in strides, eating chips with Hendo's
         out of the paper. On the fourth day he cuts through Hillsborough Park and stops dead.</p>
      <p>Behind a privet hedge, on a square of turf so perfect it looks painted, eight men in white
         are rolling wooden balls at a tiny one.</p>
      <p><b>TONY:</b> "Ey up. What's all this, then?"</p>
      <button id="next">Lean Over The Hedge</button>
    </section>`);
  on('next', monologueScene);
}

const MONOLOGUE = `Ah, a newcomer! Splendid. Now, crown green bowling, unlike its flat green cousin,
is played on a green with a raised crown, some ten to fourteen inches higher in the centre. Each bowl
carries a bias, which is to say it is weighted to one side, and will draw in a graceful arc as it slows.
The jack, likewise biased, is delivered first by the leader, who may send it in any direction he likes,
provided it travels no less than twenty-one yards. Each player then delivers two bowls alternately,
and the nearer bowls to the jack score one shot apiece. One must of course stand with one foot on the
mat, and refrain from loud remarks, and the committee are most particular about soles of shoes, and the
tea urn is not to be touched before four o'clock.`.split(/\s+/);

function monologueScene() {
  show(`
    <section class="zine">
      <p class="kicker">The Monologue</p>
      <h2 class="headline">Mr Cuthbert Pell, Club Secretary</h2>
      <p class="monologue" id="mono"></p>
      <button id="skip" class="ghost">Stop Listening</button>
    </section>`);
  const box = document.getElementById('mono');
  let i = 0;
  let done = false;
  const timer = setInterval(() => {
    if (i >= MONOLOGUE.length) return finish();
    // Tony's attention fades fast: real words give way to white noise.
    const tuneOut = Math.min(0.97, Math.max(0, (i - 10) / 25));
    const span = document.createElement('span');
    span.className = 'w';
    if (Math.random() < tuneOut) {
      span.classList.add('wah');
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
      <div class="line">He doesn't see lawn bowls.<br>He sees sacred turf, and a front line waiting to be broken.</div>
    </section>`);
  let moved = false;
  const go = () => { if (!moved) { moved = true; unlockScene(); } };
  setTimeout(go, 5200);
  on('epi', () => setTimeout(go, 300));
}

function unlockScene() {
  Sound.unlock();
  if (!hasQuirk('jennels')) {
    campaign.quirks.push({
      id: 'jennels',
      sport: 'Crown Green Bowling',
      name: 'Pacing-Out Jennels',
      effect: '+10% Movement Spatial Awareness',
    });
  }
  if (!campaign.skills.includes('wedge')) campaign.skills.push('wedge');
  show(`
    <section class="zine">
      <p class="kicker">The Skill Unlock</p>
      <h2 class="headline">Tony snaps back</h2>
      <p><b>TONY:</b> "Right. Twenty-one yards. Two bowls each. Nearest wins. So it's a <i>ruck</i>, basically."</p>
      <p><b>MR PELL:</b> "It is <i>not</i> a—"</p>
      <div class="card">
        <div class="name">The Wedge-Shove</div>
        <p>Fill the <b>Ultra Meter</b> with well-built terrace chants, then arm the Wedge-Shove.
           Your next bowl goes out four times as heavy and clears anything in its path.</p>
      </div>
      <div class="card">
        <div class="name">Ultra Quirk: Pacing-Out Jennels</div>
        <p>Tony measures every green in alleyway strides.
           <span class="stat">+10% Movement Spatial Awareness</span> — while charging a delivery
           you see where the bowl will run.</p>
      </div>
      <button id="play">Challenge The Hallam Crown Green Society</button>
    </section>`);
  on('play', () => startMatch());
}

// ---------------------------------------------------------------- chant builder
const CHANT_TEMPLATES = [
  { text: "YOU'RE GOING HOME IN A [___]!", beats: 4 },
  { text: "WE'LL FIGHT YOU ON THE [___]!", beats: 3 },
  { text: 'WHO ARE YA? WHO ARE YA? YOU\'RE JUST A [___]!', beats: 3 },
  { text: 'STEEL CITY! STEEL CITY! WE\'VE COME FOR YOUR [___]!', beats: 2 },
  { text: 'YOUR [___] IS A DISGRACE!', beats: 2 },
];

// syl: syllables (rhythm fit), shock: 0–3 (intimidation)
const WORD_TILES = [
  { text: 'CROQUET BASKET', syl: 4, shock: 1, src: 'rulebook' },
  { text: 'SACRED TURF', syl: 3, shock: 2, src: 'rulebook' },
  { text: 'TEA COSY', syl: 3, shock: 1, src: 'village hall' },
  { text: 'BAG OF HENDO\'S', syl: 4, shock: 3, src: 'chippy' },
  { text: 'PARISH NEWSLETTER', syl: 5, shock: 1, src: 'noticeboard' },
  { text: 'JENNEL', syl: 2, shock: 2, src: 'town chatter' },
  { text: 'BURNT SCONE', syl: 2, shock: 2, src: 'tea room' },
  { text: 'MOBILITY SCOOTER', syl: 6, shock: 3, src: 'car park' },
  { text: 'COUNCIL SKIP', syl: 3, shock: 3, src: 'town chatter' },
  { text: 'CARDIGAN', syl: 3, shock: 1, src: 'dress code' },
  { text: 'TEA URN', syl: 2, shock: 2, src: 'rulebook' },
  { text: 'BIASED BOWL', syl: 3, shock: 1, src: 'rulebook' },
  { text: 'WHEELBARROW', syl: 3, shock: 2, src: 'groundsman' },
  { text: 'FOUR O\'CLOCK', syl: 3, shock: 1, src: 'rulebook' },
];

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function chantBuilder(endNo, onDone) {
  const tpl = CHANT_TEMPLATES[Math.floor(Math.random() * CHANT_TEMPLATES.length)];
  const tiles = shuffle(WORD_TILES).slice(0, 5);
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="zine">
      <p class="kicker">End ${endNo} · Chant Builder · The rhythm wants ${tpl.beats} beats</p>
      <div class="chant-line">${tpl.text.replace('[___]', '<span class="slot">&nbsp;?&nbsp;</span>')}</div>
      <div class="tiles">${tiles.map((t, i) =>
        `<button class="tile" data-i="${i}">${t.text}<small>${t.syl} beats · from the ${t.src}</small></button>`).join('')}
      </div>
      <div id="result"></div>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelectorAll('.tile').forEach((btn) => btn.addEventListener('click', () => {
    const w = tiles[Number(btn.dataset.i)];
    const off = Math.abs(w.syl - tpl.beats);
    const cohesion = off === 0 ? 2 : off === 1 ? 1 : 0;
    const intimidation = w.shock;
    const gain = cohesion * 22 + intimidation * 6;
    campaign.ultra = Math.min(100, campaign.ultra + gain);
    Sound.chant();
    const reactions = [
      'Mr Pell adjusts his spectacles and carries on regardless.',
      'A lady in a lilac cardigan tuts audibly.',
      'The Hallam lads exchange worried glances over the tea urn.',
      'Mr Pell\'s hand visibly trembles on the mat.',
    ];
    ov.querySelector('.chant-line').innerHTML = tpl.text.replace('[___]', `<span class="slot">${w.text}</span>`);
    ov.querySelector('.tiles').remove();
    ov.querySelector('#result').innerHTML = `
      <div class="ratings">
        <div><b>Intimidation</b><br>${'★'.repeat(intimidation)}${'☆'.repeat(3 - intimidation)}<br>
          <small>Opponent aim wobble +${intimidation * 30}%</small></div>
        <div><b>Cohesion</b><br>${['Off the beat', 'Near enough', 'Spot on'][cohesion]}<br>
          <small>Ultra Meter +${gain}</small></div>
      </div>
      <p>${reactions[intimidation]}</p>
      <button id="chant-go">Bowl</button>`;
    ov.querySelector('#chant-go').addEventListener('click', () => {
      ov.remove();
      onDone({ intimidation, cohesion });
    });
  }));
}

// ---------------------------------------------------------------- bowls physics
const W = 400;
const H = 700;
const GREEN = { x0: 24, y0: 24, x1: W - 24, y1: H - 24 };
const START = { x: W / 2, y: H - 60 };
const R_BOWL = 11;
const R_JACK = 6;
const MU = 280;          // rolling deceleration, px/s²
const BIAS = 70;         // bias draw, px/s²
const MAX_ANGLE = 0.55;  // radians either side of straight up
const ENDS = 3;
const BOWLS_EACH = 2;

function speedFor(power) { return 200 + power * 430; }

function makeBowl(side, angle, power, bias, mass = 1) {
  const v = speedFor(power);
  return {
    side, x: START.x, y: START.y,
    vx: Math.sin(angle) * v, vy: -Math.cos(angle) * v,
    r: R_BOWL, m: mass, bias, dead: false, heavy: mass > 1,
  };
}

// Advance one body; returns true if still moving.
function advance(o, dt) {
  const sp = Math.hypot(o.vx, o.vy);
  if (sp < 4) { o.vx = 0; o.vy = 0; return false; }
  if (o.bias) {
    // Bias draws harder as the bowl slows, like a real wood.
    const a = BIAS * o.bias * (0.35 + 0.65 * (1 - Math.min(1, sp / 600)));
    const vx = o.vx;
    const vy = o.vy;
    o.vx += (-vy / sp) * a * dt;
    o.vy += (vx / sp) * a * dt;
  }
  const sp2 = Math.hypot(o.vx, o.vy);
  const ns = Math.max(0, sp2 - MU * dt);
  o.vx *= ns / sp2;
  o.vy *= ns / sp2;
  o.x += o.vx * dt;
  o.y += o.vy * dt;
  return true;
}

function stepWorld(objs, dt) {
  let moving = false;
  for (const o of objs) {
    if (o.dead) continue;
    if (advance(o, dt)) moving = true;
    if (o.side === 'jack') {
      // The jack rebounds off the bank rather than going in the ditch.
      if (o.x < GREEN.x0 + o.r) { o.x = GREEN.x0 + o.r; o.vx = Math.abs(o.vx) * 0.5; }
      if (o.x > GREEN.x1 - o.r) { o.x = GREEN.x1 - o.r; o.vx = -Math.abs(o.vx) * 0.5; }
      if (o.y < GREEN.y0 + o.r) { o.y = GREEN.y0 + o.r; o.vy = Math.abs(o.vy) * 0.5; }
      if (o.y > GREEN.y1 - o.r) { o.y = GREEN.y1 - o.r; o.vy = -Math.abs(o.vy) * 0.5; }
    } else if (o.x < GREEN.x0 || o.x > GREEN.x1 || o.y < GREEN.y0 || o.y > GREEN.y1) {
      o.dead = true; // in the ditch
    }
  }
  for (let i = 0; i < objs.length; i++) {
    for (let j = i + 1; j < objs.length; j++) {
      const a = objs[i];
      const b = objs[j];
      if (a.dead || b.dead) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (d === 0 || d >= min) continue;
      const nx = dx / d;
      const ny = dy / d;
      // separate
      const overlap = (min - d) / 2;
      a.x -= nx * overlap; a.y -= ny * overlap;
      b.x += nx * overlap; b.y += ny * overlap;
      const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel >= 0) continue;
      const e = 0.85;
      const jImp = (-(1 + e) * rel) / (1 / a.m + 1 / b.m);
      a.vx -= (jImp / a.m) * nx; a.vy -= (jImp / a.m) * ny;
      b.vx += (jImp / b.m) * nx; b.vy += (jImp / b.m) * ny;
      if (Math.abs(rel) > 30) Sound.clack();
      moving = true;
    }
  }
  return moving;
}

// Path of a lone bowl (no collisions) — used for aim preview and the AI.
function tracePath(angle, power, bias, maxPoints = Infinity) {
  const b = makeBowl('probe', angle, power, bias);
  const pts = [];
  const dt = 1 / 60;
  for (let t = 0; t < 600 && pts.length < maxPoints; t++) {
    if (!advance(b, dt)) break;
    if (b.x < GREEN.x0 || b.x > GREEN.x1 || b.y < GREEN.y0 || b.y > GREEN.y1) {
      pts.push({ x: b.x, y: b.y, dead: true });
      break;
    }
    pts.push({ x: b.x, y: b.y });
  }
  return pts;
}

function gaussian() {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

// ---------------------------------------------------------------- match
function startMatch() {
  show(`
    <section class="zine">
      <div class="hud">
        <div class="score" id="score">TONY 0 – 0 HALLAM</div>
        <div class="kicker" id="endlbl"></div>
      </div>
      <div class="hud">
        <div class="meter"><div id="ultra"></div><span>ULTRA METER</span></div>
      </div>
      <canvas id="green" width="${W}" height="${H}"></canvas>
      <div class="msg" id="msg"></div>
      <div class="controls">
        <button id="bias">Bias: Right</button>
        <button id="wedge">Wedge-Shove</button>
      </div>
      <p class="help">Aim with mouse/finger or ← →. Hold (or Space) to charge, release to bowl.
        B flips bias, W arms the Wedge-Shove.</p>
    </section>`);

  const canvas = document.getElementById('green');
  const g = canvas.getContext('2d');
  const m = {
    end: 1,
    score: { tony: 0, opp: 0 },
    objs: [],
    jack: null,
    queue: [],          // whose delivery is next this end
    phase: 'chant',     // chant | aim | charging | rolling | opp | between | over
    angle: 0,
    power: 0,
    chargeT: 0,
    bias: 1,            // +1 draws right, -1 draws left (from the mat)
    wedgeArmed: false,
    intimidation: 0,
    last: performance.now(),
    raf: 0,
  };
  const showPreview = hasQuirk('jennels');

  function say(t) { document.getElementById('msg').innerHTML = t; }

  function refreshHud() {
    document.getElementById('score').textContent = `TONY ${m.score.tony} – ${m.score.opp} HALLAM`;
    document.getElementById('endlbl').textContent = `End ${Math.min(m.end, ENDS)} of ${ENDS}`;
    document.getElementById('ultra').style.width = `${campaign.ultra}%`;
    const wedge = document.getElementById('wedge');
    wedge.disabled = !(campaign.ultra >= 100 && !m.wedgeArmed && campaign.skills.includes('wedge'));
    wedge.textContent = m.wedgeArmed ? 'Wedge Armed!' : 'Wedge-Shove';
    document.getElementById('bias').textContent = `Bias: ${m.bias > 0 ? 'Right' : 'Left'}`;
  }

  function setupEnd() {
    m.objs = [];
    // Jack sits 21+ yards up the green, anywhere across it.
    m.jack = {
      side: 'jack', x: 110 + Math.random() * 180, y: 130 + Math.random() * 200,
      vx: 0, vy: 0, r: R_JACK, m: 0.35, dead: false,
    };
    m.objs.push(m.jack);
    m.queue = [];
    for (let i = 0; i < BOWLS_EACH; i++) m.queue.push('tony', 'opp');
    m.phase = 'chant';
    refreshHud();
    say('Before the end: give \'em a song.');
    chantBuilder(m.end, ({ intimidation }) => {
      m.intimidation = intimidation;
      refreshHud();
      nextDelivery();
    });
  }

  function nextDelivery() {
    if (m.queue.length === 0) return scoreEnd();
    const who = m.queue.shift();
    if (who === 'tony') {
      m.phase = 'aim';
      say(`Tony's on the mat. ${m.queue.filter((q) => q === 'tony').length + 1} bowl(s) left.`);
    } else {
      m.phase = 'opp';
      say('Mr Pell steps up, sucking a mint…');
      setTimeout(oppDelivery, 900);
    }
    refreshHud();
  }

  function oppDelivery() {
    // Pell searches for the line that finishes nearest the jack…
    let best = null;
    for (const bias of [1, -1]) {
      for (let a = -MAX_ANGLE; a <= MAX_ANGLE; a += 0.02) {
        for (let p = 0; p <= 1; p += 0.025) {
          const path = tracePath(a, p, bias);
          const end = path[path.length - 1];
          if (!end || end.dead) continue;
          const d = Math.hypot(end.x - m.jack.x, end.y - m.jack.y);
          if (!best || d < best.d) best = { a, p, bias, d };
        }
      }
    }
    if (!best) best = { a: 0, p: 0.5, bias: 1 };
    // …then the chant gets to him.
    const wobble = 1 + m.intimidation * 0.3;
    const a = best.a + gaussian() * 0.04 * wobble;
    const p = Math.min(1, Math.max(0, best.p + gaussian() * 0.06 * wobble));
    m.objs.push(makeBowl('opp', a, p, best.bias));
    m.phase = 'rolling';
  }

  function tonyDelivery() {
    const mass = m.wedgeArmed ? 4 : 1;
    const b = makeBowl('tony', m.angle, m.power, m.bias, mass);
    m.objs.push(b);
    if (m.wedgeArmed) {
      say('<b>TONY:</b> "WEDGE! WEDGE! GET IN THERE!"');
      m.wedgeArmed = false;
      campaign.ultra = 0;
    }
    m.phase = 'rolling';
    refreshHud();
  }

  function scoreEnd() {
    const live = m.objs.filter((o) => o.side !== 'jack' && !o.dead)
      .map((o) => ({ side: o.side, d: Math.hypot(o.x - m.jack.x, o.y - m.jack.y) }))
      .sort((a, b) => a.d - b.d);
    let line;
    if (live.length === 0) {
      line = 'Every bowl in the ditch. Dead end — no score.';
    } else {
      const winner = live[0].side;
      let shots = 0;
      for (const b of live) { if (b.side !== winner) break; shots++; }
      m.score[winner] += shots;
      line = winner === 'tony'
        ? `Tony takes the end — ${shots} shot${shots > 1 ? 's' : ''}! "ARE YOU WATCHING, HALLAM?"`
        : `Hallam take it, ${shots} shot${shots > 1 ? 's' : ''}. Polite applause. Tony kicks the bench.`;
      if (winner === 'opp') Sound.boo();
    }
    m.phase = 'between';
    refreshHud();
    say(`${line} <button id="cont">${m.end >= ENDS ? 'Final Whistle' : 'Next End'}</button>`);
    on('cont', () => {
      if (m.end >= ENDS) {
        m.phase = 'over';
        cancelAnimationFrame(m.raf);
        cleanup();
        infractionScene({ ...m.score });
      } else {
        m.end++;
        setupEnd();
      }
    });
  }

  // -------- input
  function pointerAngle(ev) {
    const r = canvas.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * W;
    const y = ((ev.clientY - r.top) / r.height) * H;
    const a = Math.atan2(x - START.x, START.y - y);
    return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, a));
  }
  function startCharge() {
    if (m.phase !== 'aim') return;
    m.phase = 'charging';
    m.chargeT = 0;
  }
  function release() {
    if (m.phase !== 'charging') return;
    tonyDelivery();
  }
  canvas.addEventListener('pointermove', (ev) => {
    if (m.phase === 'aim' || m.phase === 'charging') m.angle = pointerAngle(ev);
  });
  canvas.addEventListener('pointerdown', (ev) => {
    if (m.phase !== 'aim') return;
    m.angle = pointerAngle(ev);
    canvas.setPointerCapture(ev.pointerId);
    startCharge();
  });
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function keydown(ev) {
    if (ev.key === 'ArrowLeft') m.angle = Math.max(-MAX_ANGLE, m.angle - 0.02);
    else if (ev.key === 'ArrowRight') m.angle = Math.min(MAX_ANGLE, m.angle + 0.02);
    else if (ev.key === ' ') { ev.preventDefault(); if (!ev.repeat) startCharge(); }
    else if (ev.key === 'b' || ev.key === 'B') flipBias();
    else if (ev.key === 'w' || ev.key === 'W') armWedge();
  }
  function keyup(ev) { if (ev.key === ' ') release(); }
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  function cleanup() {
    window.removeEventListener('keydown', keydown);
    window.removeEventListener('keyup', keyup);
  }

  function flipBias() {
    if (m.phase !== 'aim' && m.phase !== 'chant' && m.phase !== 'between' && m.phase !== 'opp') return;
    m.bias = -m.bias;
    refreshHud();
  }
  function armWedge() {
    if (campaign.ultra < 100 || m.wedgeArmed || !campaign.skills.includes('wedge')) return;
    m.wedgeArmed = true;
    say('Wedge-Shove armed. Next bowl goes in like a corner-flag charge.');
    refreshHud();
  }
  on('bias', flipBias);
  on('wedge', armWedge);

  // -------- loop
  function frame(now) {
    const dt = Math.min(0.05, (now - m.last) / 1000);
    m.last = now;
    if (m.phase === 'charging') {
      m.chargeT += dt;
      m.power = 0.5 - 0.5 * Math.cos(m.chargeT * Math.PI / 0.9); // 0→1→0, 1.8s period
    }
    if (m.phase === 'rolling') {
      let moving = false;
      const sub = 4;
      for (let i = 0; i < sub; i++) if (stepWorld(m.objs, dt / sub)) moving = true;
      if (!moving) {
        m.phase = 'settling';
        setTimeout(nextDelivery, 500);
      }
    }
    draw();
    m.raf = requestAnimationFrame(frame);
  }

  function draw() {
    // ditch
    g.fillStyle = '#6b5a3e';
    g.fillRect(0, 0, W, H);
    // mown stripes
    const stripes = 10;
    const sh = (GREEN.y1 - GREEN.y0) / stripes;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? '#3f7d3a' : '#468a40';
      g.fillRect(GREEN.x0, GREEN.y0 + i * sh, GREEN.x1 - GREEN.x0, sh + 1);
    }
    // crown highlight
    const grad = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 320);
    grad.addColorStop(0, 'rgba(255,255,220,0.14)');
    grad.addColorStop(1, 'rgba(0,0,0,0.12)');
    g.fillStyle = grad;
    g.fillRect(GREEN.x0, GREEN.y0, GREEN.x1 - GREEN.x0, GREEN.y1 - GREEN.y0);
    // mat
    g.fillStyle = '#222';
    g.fillRect(START.x - 18, START.y - 8, 36, 30);

    // aim line + preview
    if (m.phase === 'aim' || m.phase === 'charging') {
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.setLineDash([4, 6]);
      g.beginPath();
      g.moveTo(START.x, START.y);
      g.lineTo(START.x + Math.sin(m.angle) * 90, START.y - Math.cos(m.angle) * 90);
      g.stroke();
      g.setLineDash([]);
      if (m.phase === 'charging' && showPreview) {
        // Jennel-pacing: see the first ~40% of the run.
        const full = tracePath(m.angle, m.power, m.bias);
        const pts = full.slice(0, Math.ceil(full.length * 0.4));
        g.fillStyle = 'rgba(255,240,120,0.8)';
        pts.forEach((p, i) => { if (i % 4 === 0) { g.beginPath(); g.arc(p.x, p.y, 2, 0, Math.PI * 2); g.fill(); } });
      }
      // power meter
      if (m.phase === 'charging') {
        g.fillStyle = '#000';
        g.fillRect(W - 46, H - 190, 18, 150);
        g.fillStyle = m.wedgeArmed ? '#ff0' : '#c8102e';
        g.fillRect(W - 44, H - 42 - 146 * m.power, 14, 146 * m.power);
      }
      // waiting bowl on mat
      drawBowl({ x: START.x, y: START.y, r: R_BOWL, side: 'tony', heavy: m.wedgeArmed });
    }

    for (const o of m.objs) {
      if (o.dead) continue;
      if (o.side === 'jack') {
        g.fillStyle = '#f5f0c8';
        g.beginPath(); g.arc(o.x, o.y, o.r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
      } else drawBowl(o);
    }
  }

  function drawBowl(o) {
    g.fillStyle = o.side === 'tony' ? '#c8102e' : '#1d2a52';
    g.beginPath(); g.arc(o.x, o.y, o.r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = o.heavy ? '#ff0' : '#fff';
    g.lineWidth = o.heavy ? 3 : 1.5;
    g.stroke();
    g.beginPath(); g.arc(o.x, o.y, o.r * 0.4, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1;
  }

  m.raf = requestAnimationFrame(frame);
  setupEnd();
}

// ---------------------------------------------------------------- bureaucracy
function infractionScene(score) {
  const won = score.tony > score.opp;
  const drew = score.tony === score.opp;
  show(`
    <section class="zine">
      <p class="kicker">Full Time · Tony ${score.tony} – ${score.opp} Hallam</p>
      <h2 class="headline">${won ? 'Get In!' : drew ? 'Honours Even' : 'Robbed!'}</h2>
      <p>${won
        ? 'Tony celebrates the only way he knows how.'
        : 'Tony takes the result the only way he knows how.'}
         A homemade banger-and-cardboard smoke bomb rolls, gently biased, across the green.
         Then another. Then a third, aimed squarely at the tea urn.</p>
      <p>Mr Pell, coughing through a cloud of Steel City red, produces a small notebook and writes something down very slowly.</p>
      <button id="next">Await Correspondence</button>
    </section>`);
  on('next', () => banningScene(score));
}

function banningScene(score) {
  setTimeout(Sound.stamp, 800);
  const today = new Date(1984, 5, 9);
  const tribunal = new Date(today.getTime() + (42 + Math.floor(Math.random() * 15)) * 86400000);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  show(`
    <section class="order">
      <h3>Hallam Crown Green Bowling Society</h3>
      <div class="sub">Standards &amp; Etiquette Sub-Committee · Ref. HCGBS/84/0001</div>
      <div class="stamp">Banned</div>
      <p><b>NOTICE OF INTENT TO ISSUE A BANNING ORDER</b><br>
         Re: Mr Anthony Notion ("Tony"), of no fixed bowls club.</p>
      <p>The Sub-Committee has resolved to consider the following grounds:</p>
      <ol>
        <li>Discharge of three (3) homemade smoke devices onto a Crown Green, one of which travelled a full twenty-one yards and was, the Committee concedes, nicely weighted.</li>
        <li>Chanting about croquet baskets at a bowls fixture, the Committee noting that croquet is a separate sport entirely.</li>
        <li>Measuring the green in units described as "jennels", which do not appear in the Laws of the Game.</li>
        <li>Application of Henderson's Relish to the cucumber sandwiches without committee approval.</li>
        ${score.tony > score.opp ? '<li>Winning.</li>' : ''}
      </ol>
      <p>A tribunal will be convened on <b>${fmt(tribunal)}</b>, subject to the availability of the Secretary's sister-in-law, who has the minute book.</p>
      <p style="text-align:right"><i>C. Pell</i><br>Hon. Secretary</p>
    </section>
    <p></p>
    <button id="next">Read The Small Print</button>`);
  on('next', loopholeScene);
}

function loopholeScene() {
  show(`
    <section class="zine">
      <p class="kicker">Loophole Window</p>
      <h2 class="headline">Six to eight weeks</h2>
      <p>Tony reads the letter four times on the bus. Then a fifth time, very slowly, the way his solicitor taught him.</p>
      <p class="quote">"…pending review, the member shall remain eligible for all regional fixtures…"</p>
      <p><b>TONY:</b> "Regional. <i>Regional.</i> Get the lads. Get the knitting needles. We're going to Barnsley."</p>
      <div class="card">
        <div class="name">Ultra Quirks Carried Forward</div>
        <ul>${campaign.quirks.map((q) => `<li><b>${q.name}</b> (${q.sport}) — <span class="stat">${q.effect}</span></li>`).join('')}</ul>
        <p>Skills: ${campaign.skills.map((s) => (s === 'wedge' ? 'The Wedge-Shove' : s)).join(', ')}</p>
      </div>
      <p class="kicker">End of the Act I slice · Next: Act II — The Recruitment Drive (Badminton)</p>
      <button id="again">Play Again</button>
    </section>`);
  on('again', titleScene);
}

titleScene();
