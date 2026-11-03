# Firm Head

A comedic 1980s tactical satire. The UK football firms are banned, and Tony Notion, the very short
former leader of the Steel City Anarchy, takes his terrace tactics into genteel British amateur sport.

The full design is in [`docs/Firm_Head_Game_Design_Document.pdf`](docs/Firm_Head_Game_Design_Document.pdf).

## Play it

**https://need4name.github.io/Tony-s-New-Firm/** (works on a phone; add it to your home screen).
Or open `index.html` in a browser. No build step.

## Prologue: the Steel City Anarchy (tutorial)

October 1983, away at Barnsley. Tony runs his firm from Big Col's shoulders, and you learn the three
mini-games where they came from: on the terrace. You can't lose the tutorial. Then the Home Office bans
the firms, the lads drift off, and Tony has nowhere to be on a Saturday.

## Chapter 1: Crown Green Bowling

Tony doesn't play. He stands on the bank as Hallam's **12th man** against Dore & Totley, on three
wet Saturdays at Hillsborough Park. Each sport becomes a chapter, and each level is a short run of mini-games:

| Mini-game | What you do | What it changes |
| --- | --- | --- |
| **Chant** | Fill the gaps in a preset song: type a word or tap an idea. Level 1 has one gap, level 2 has two, level 3 needs rhymes | Fills the Ultra Meter, rattles the other side, wins over or upsets the crowd |
| **Clap along** | Tap when the dots reach the line | Fills the Ultra Meter; the crowd joins in (or doesn't) |
| **Put him off** | Shout when the marker is in the green part of the bar | Decides who wins the end. One free "too early" per shout |

Win a level to unlock its **Hard** version: you write the whole chant yourself, the clapping is faster,
and the shouting window is half the size.

The people on the bank (Dorothy, Gerald and Clive the whippet, Dean & Wayne, Mr Pell, Brian the
groundsman) have moods that carry through the chapter. The banning order at the end is written from what
you actually did, and anyone you won over joins Tony's new firm.

Progress is saved in the browser.

## Files

- `index.html`: page shell
- `style.css`: pale fanzine styling
- `game.js`: story scenes, levels, mini-games, chant marking, the crowd, audio (Web Audio, no assets)
