# Firm Head

A comedic 1980s tactical satire. The UK football firms are banned, and Tony Notion, the very short
former leader of the Steel City Anarchy, takes his terrace tactics into genteel British amateur sport.

The full design is in [`docs/Firm_Head_Game_Design_Document.pdf`](docs/Firm_Head_Game_Design_Document.pdf).

## Play it

**https://need4name.github.io/Tony-s-New-Firm/** (works on a phone; add it to your home screen).
Or open `index.html` in a browser. No build step.

## Chapter 1: Crown Green Bowling

Tony doesn't play. He stands on the bank as Hallam's **12th man** against Dore & Totley, on three
wet Saturdays at Hillsborough Park. Each sport in the design doc becomes a chapter; each level is a
short run of mini-games:

| Mini-game | What you do | What it changes |
| --- | --- | --- |
| **Chant** | Type any chant you like. It's marked for rhythm, rhyme, how much it's about the match, and cheek. Starter lines (the Mad-Libs) are there if you're stuck | Fills the Ultra Meter, rattles the visiting bowler, and wins over or upsets the bank |
| **Clap along** | Tap in time to the terrace rhythm | Fills the Ultra Meter; the bank joins in (or doesn't) |
| **Put him off** | Shout at the top of the visiting bowler's backswing | Decides who wins the end. Too early gets you a warning |

The people on the bank (Dorothy, Gerald and Clive the whippet, Dean & Wayne, Mr Pell, Brian the
groundsman) each have a mood that carries through the chapter. Everything you do shows up in their
reactions. At the end of the chapter, the banning order is written from what you actually did
(including your best chant), and anyone you won over joins Tony's new firm.

Progress is saved in the browser.

## Files

- `index.html`: page shell
- `style.css`: pale fanzine styling
- `game.js`: story scenes, levels, mini-games, chant marking, the bank, audio (Web Audio, no assets)
