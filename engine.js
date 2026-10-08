// Emittermath engine - drip irrigation math.
// Anchors (labeled in-app):
//  - 0.623 gallons per sq ft per inch of water (exact unit conversion).
//  - 60 GPH = 1 GPM (exact).
//  - Max lateral guidance per line size, typical manufacturer figures, labeled and editable:
//    1/4 in: 30 ft run / 30 GPH; 1/2 in: 200 ft / 220 GPH; 3/4 in: 480 ft / 480 GPH.
//  - Supply rule of thumb: design zone flow <= 75% of measured hose-bib flow (labeled).
//  - Run-time sanity cap: a single session over 2 hours usually means too few emitters
//    or too low a flow (labeled guidance).
const GAL_PER_SQFT_IN = 0.623; // exact: 231 cu in/gal over 144 sq in per sq ft x 1 in
const GPH_PER_GPM = 60;        // exact
const LATERAL_GUIDE = { '1/4': { maxFt: 30, maxGph: 30 }, '1/2': { maxFt: 200, maxGph: 220 }, '3/4': { maxFt: 480, maxGph: 480 } };
const SUPPLY_FRAC = 0.75;      // labeled rule of thumb
const SESSION_CAP_H = 2;       // labeled guidance

// Daily gallons per plant from canopy area and weekly evapotranspiration inches.
function plantNeed(areaSqFt, etInWeek){
  if (!(areaSqFt > 0)) throw new Error('canopy area must be positive');
  if (!(etInWeek > 0)) throw new Error('weekly water need must be positive');
  const galWeek = areaSqFt * etInWeek * GAL_PER_SQFT_IN;
  return { areaSqFt, etInWeek, galWeek, galDay: galWeek / 7 };
}

// Emitters per plant at gph each -> hours per session for the daily need, with guidance.
function watering(galPerSession, emitters, gph){
  if (!(galPerSession > 0)) throw new Error('gallons per session must be positive');
  if (!(emitters >= 1)) throw new Error('need at least one emitter');
  if (!(gph > 0)) throw new Error('emitter flow must be positive');
  const rate = emitters * gph;
  const hours = galPerSession / rate;
  const verdict = hours > SESSION_CAP_H
    ? 'over 2 hours - add emitters or use higher-flow ones'
    : 'in range';
  return { galPerSession, emitters, gph, rate, hours, minutes: hours * 60, verdict };
}

// Weekly schedule: sessions per week -> gallons per session, minutes per session.
function schedule(galWeek, sessionsPerWeek, emitters, gph){
  if (!(galWeek > 0)) throw new Error('weekly gallons must be positive');
  if (!(sessionsPerWeek >= 1)) throw new Error('need at least one session per week');
  const perSession = galWeek / sessionsPerWeek;
  const w = watering(perSession, emitters, gph);
  return { galWeek, sessionsPerWeek, perSession, hours: w.hours, minutes: w.minutes,
    rate: w.rate, verdict: w.verdict };
}

// Zone hydraulics: total flow and verdict vs measured supply.
function zoneFlow(emitterCount, gph, supplyGpm){
  if (!(emitterCount >= 1)) throw new Error('need at least one emitter');
  if (!(gph > 0)) throw new Error('emitter flow must be positive');
  if (!(supplyGpm > 0)) throw new Error('supply flow must be positive');
  const zoneGph = emitterCount * gph;
  const zoneGpm = zoneGph / GPH_PER_GPM;
  const budget = supplyGpm * SUPPLY_FRAC;
  const fits = zoneGpm <= budget;
  const verdict = fits
    ? 'uses ' + Math.round(zoneGpm / supplyGpm * 100) + '% of measured supply'
    : 'over budget - split into more zones (' + Math.round(zoneGpm / supplyGpm * 100) + '% of supply)';
  return { emitterCount, gph, zoneGph, zoneGpm, supplyGpm, budget, fits, verdict };
}

// Lateral check against the labeled manufacturer guidance for the line size.
function lateral(lineSize, runFt, totalGph){
  const g = LATERAL_GUIDE[lineSize];
  if (!g) throw new Error('line size must be one of ' + Object.keys(LATERAL_GUIDE).join(', '));
  if (!(runFt > 0)) throw new Error('run length must be positive');
  if (!(totalGph > 0)) throw new Error('lateral flow must be positive');
  const lenOk = runFt <= g.maxFt;
  const flowOk = totalGph <= g.maxGph;
  const verdict = lenOk && flowOk ? 'within typical ' + lineSize + ' in guidance'
    : (!lenOk ? 'run over ' + g.maxFt + ' ft guidance' : 'flow over ' + g.maxGph + ' GPH guidance') + ' - split the lateral or go bigger';
  return { lineSize, runFt, totalGph, maxFt: g.maxFt, maxGph: g.maxGph, lenOk, flowOk, verdict };
}

const API = { GAL_PER_SQFT_IN, GPH_PER_GPM, LATERAL_GUIDE, SUPPLY_FRAC, SESSION_CAP_H,
  plantNeed, watering, schedule, zoneFlow, lateral };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.Emittermath = API;
