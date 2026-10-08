# Emittermath

Drip irrigation math that holds water: plant water need from canopy and ET, emitter counts and session minutes, zone flow against a measured hose bib, and lateral runs against tubing limits.

## What it computes
- **Plant need**: canopy sq ft x weekly ET inches x 0.623 gal per sq ft per inch (exact) to gallons per day and week.
- **Schedule**: weekly gallons and sessions per week to minutes per session at your emitter count and flow, flagged past the labeled 2-hour session cap.
- **Zone flow**: total emitter GPH to GPM, checked against 75% of your measured hose-bib flow (labeled design rule).
- **Lateral check**: run length and total GPH against typical manufacturer guidance (1/4 in: 30 ft / 30 GPH; 1/2 in: 200 ft / 220 GPH; 3/4 in: 480 ft / 480 GPH - labeled, not code).

## Anchors
- 0.623 gallons per sq ft per inch of water: exact (231 cu in per gallon, 144 sq in per sq ft).
- 60 GPH = 1 GPM: exact.
- Lateral limits, the 75% supply rule, and the 2-hour session cap are typical manufacturer/extension guidance, labeled in-app.

## Files
- `index.html` - landing page
- `app.html` - four calculators
- `engine.js` - pure math engine (node + browser global)
- `test.js` + `expected.json` - 238 checks against an independent Python oracle, exact-conversion anchors and monotonicity properties

## Run tests
```
node test.js
```
