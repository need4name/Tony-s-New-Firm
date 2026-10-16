# Firm Head

A comedic 1980s tactical satire. The UK football firms are banned, and Tony Notion, the very short
former leader of the Steel City Anarchy, takes his terrace tactics into genteel British amateur sport.

The full design is in [`docs/Firm_Head_Game_Design_Document.pdf`](docs/Firm_Head_Game_Design_Document.pdf).

## Playable slice: Act I, Crown Green Bowling

Open `index.html` in a browser. There's no build step and nothing to install.
(Or serve the folder: `python3 -m http.server`, then visit http://localhost:8000.)

What this slice covers from the design doc:

| Design system | In the slice |
| --- | --- |
| Act I: Disbanded & Displacement | Intro, then Tony stumbles on a bowls match in Hillsborough Park |
| Narrative Epiphany Loop | **Monologue** (the rules fade into "wah-wah" white noise) → **Epiphany** (zoom on the eyes, synth pad) → **Skill Unlock** |
| Mad-Libs Terrace Chants | A chant before each end: pick a word tile for the slot. **Intimidation** (shock value) adds wobble to the opponent's aim. **Cohesion** (fitting the rhythm) charges the Ultra Meter |
| Sport #1: Crown Green Bowling | Top-down bowls with bias, a jack, the ditch and collisions; 3 ends, 2 bowls each, against an AI opponent |
| Skill: The Wedge-Shove | With the Ultra Meter full, the next bowl goes out 4× heavier |
| Quirk: Pacing-Out Jennels | +10% Movement Spatial Awareness: shows part of the bowl's path while you charge a shot |
| Bureaucracy loop | Infraction (smoke bombs) → Banning Order document with a stamp → tribunal 6–8 weeks later → Loophole Window |

### Controls

- **Aim**: mouse/finger over the green, or ← →
- **Bowl**: hold to charge power (mouse/touch or Space), release to deliver
- **B**: flip bias left/right · **W**: arm the Wedge-Shove

## Files

- `index.html`: page shell
- `style.css`: 1980s newsprint fanzine styling
- `game.js`: scenes, chant builder, bowls physics and AI, audio (Web Audio, no assets)
