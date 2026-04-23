const csInterface = new CSInterface();

// ─────────────────────────────────────────────────────
// #region BANK ICON POOL
// Random icons assigned to banks at creation; stored as index in bank.iconIdx
// ─────────────────────────────────────────────────────
const BANK_ICONS = [
    // 0: wave
    `<svg viewBox="0 0 12 7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M.5 3.5c1-3 2.5-3 3 0s2 3 3 0 2-3 3 0 1 3 2 0"/></svg>`,
    // 1: diamond
    `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5,0.8 9.2,5 5,9.2 0.8,5"/></svg>`,
    // 2: triangle
    `<svg viewBox="0 0 10 9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5,0.8 9.2,8.5 0.8,8.5"/></svg>`,
    // 3: crosshair circle
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="3.2"/><line x1="5.5" y1=".5" x2="5.5" y2="2.2"/><line x1="5.5" y1="8.8" x2="5.5" y2="10.5"/><line x1=".5" y1="5.5" x2="2.2" y2="5.5"/><line x1="8.8" y1="5.5" x2="10.5" y2="5.5"/></svg>`,
    // 4: hexagon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5.5,0.8 9.8,3.1 9.8,7.9 5.5,10.2 1.2,7.9 1.2,3.1"/></svg>`,
    // 5: lightning bolt
    `<svg viewBox="0 0 8 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6.5.5H3L.5 5.5h3L1.5 10.5l6-6.5H4.5z"/></svg>`,
    // 6: star
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5.5,0.5 6.57,4.43 10.5,5.5 6.57,6.57 5.5,10.5 4.43,6.57 0.5,5.5 4.43,4.43"/></svg>`,
    // 7: arrow right
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="1.5" y1="5.5" x2="9.5" y2="5.5"/><polyline points="6.5,2.5 9.5,5.5 6.5,8.5"/></svg>`,
    // 8: eye
    `<svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M.5 4C2 1.5 3.8.5 6 .5 8.2.5 10 1.5 11.5 4 10 6.5 8.2 7.5 6 7.5 3.8 7.5 2 6.5.5 4z"/><circle cx="6" cy="4" r="1.5" fill="currentColor" stroke="none"/></svg>`,
    // 9: grid / four squares
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="3.5" height="3.5" rx=".5"/><rect x="6.5" y="1" width="3.5" height="3.5" rx=".5"/><rect x="1" y="6.5" width="3.5" height="3.5" rx=".5"/><rect x="6.5" y="6.5" width="3.5" height="3.5" rx=".5"/></svg>`,
    // 10: layers / stack
    `<svg viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 3l5 2.5 5-2.5-5-2.5z"/><path d="M1 6l5 2.5 5-2.5"/><path d="M1 4.5l5 2.5 5-2.5"/></svg>`,
    // 11: octagon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3.5.7h4l2.8 2.8v4L7.5 10.3h-4L.7 7.5v-4z"/></svg>`,
    // 12: moon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M8 7A4.5 4.5 0 014 2.5a4.5 4.5 0 100 9A4.5 4.5 0 008 7z"/></svg>`,
    // 13: circle + ring
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="4.5" stroke-width="1.1"/><circle cx="5.5" cy="5.5" r="1.8" stroke-width="1.1"/></svg>`,
    // 14: plus / cross bold
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="5.5" y1="1.5" x2="5.5" y2="9.5"/><line x1="1.5" y1="5.5" x2="9.5" y2="5.5"/></svg>`,
    // 15: X bold
    `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>`,
    // 16: pentagon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5.5,0.5 10.2,3.9 8.4,9.5 2.6,9.5 0.8,3.9"/></svg>`,
    // 17: arrow up
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5.5" y1="9.5" x2="5.5" y2="1.5"/><polyline points="2.5,4.5 5.5,1.5 8.5,4.5"/></svg>`,
    // 18: arrow down
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5.5" y1="1.5" x2="5.5" y2="9.5"/><polyline points="2.5,6.5 5.5,9.5 8.5,6.5"/></svg>`,
    // 19: code brackets
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 1.5L1.5 5.5L3.5 9.5"/><path d="M7.5 1.5L9.5 5.5L7.5 9.5"/></svg>`,
    // 20: hash
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="1.5" y1="4" x2="9.5" y2="4"/><line x1="1.5" y1="7" x2="9.5" y2="7"/><line x1="3.5" y1="1.5" x2="2.5" y2="9.5"/><line x1="7" y1="1.5" x2="6" y2="9.5"/></svg>`,
    // 21: heart
    `<svg viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M6 8.5C3.5 6.5 1 5 1 3a2.5 2.5 0 014.5-1.4A2.5 2.5 0 0111 3c0 2-2.5 3.5-5 5.5z"/></svg>`,
    // 22: crown
    `<svg viewBox="0 0 12 9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="1,7.5 1,1.5 3.5,4.5 6,1.5 8.5,4.5 11,1.5 11,7.5"/><line x1="1" y1="7.5" x2="11" y2="7.5"/></svg>`,
    // 23: flag
    `<svg viewBox="0 0 10 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="0.8" x2="2" y2="10.2"/><path d="M2 0.8L8.5 2.5L2 5.5Z"/></svg>`,
    // 24: pin / location
    `<svg viewBox="0 0 9 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 10C4.5 10 1 6.5 1 4a3.5 3.5 0 017 0c0 2.5-3.5 6-3.5 6z"/><circle cx="4.5" cy="4" r="1.2" fill="currentColor" stroke="none"/></svg>`,
    // 25: bell
    `<svg viewBox="0 0 11 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 1.5a3 3 0 013 3c0 2.5.8 4 1.5 4.5H1c.7-.5 1.5-2 1.5-4.5a3 3 0 013-3z"/><line x1="4.5" y1="10" x2="6.5" y2="10"/></svg>`,
    // 26: hourglass
    `<svg viewBox="0 0 9 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 0.8h7L5.5 5.5 8 10.2H1L3.5 5.5z"/></svg>`,
    // 27: shield
    `<svg viewBox="0 0 10 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M5 0.8L9.2 2.5v3C9.2 8 5 10.2 5 10.2S.8 8 .8 5.5v-3z"/></svg>`,
    // 28: refresh / cycle arrow
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 5.5a4 4 0 11-1.2-2.8"/><polyline points="8,1 8.3,2.7 10,2.4"/></svg>`,
    // 29: spiral
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 5.5a1 1 0 110 2a2 2 0 110-4a3 3 0 110 6"/></svg>`,
    // 30: curly braces
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 1.5Q2.5 1.5 2.5 3L2.5 4.5Q2.5 5.5 1.5 5.5Q2.5 5.5 2.5 6.5L2.5 8Q2.5 9.5 4 9.5"/><path d="M7 1.5Q8.5 1.5 8.5 3L8.5 4.5Q8.5 5.5 9.5 5.5Q8.5 5.5 8.5 6.5L8.5 8Q8.5 9.5 7 9.5"/></svg>`,
    // 31: asterisk / sparkle
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="5.5" y1="1" x2="5.5" y2="10"/><line x1="1" y1="5.5" x2="10" y2="5.5"/><line x1="2.5" y1="2.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="2.5" x2="2.5" y2="8.5"/></svg>`,
    // 32: target / bullseye
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="4.5"/><circle cx="5.5" cy="5.5" r="2.5"/><circle cx="5.5" cy="5.5" r="0.8" fill="currentColor" stroke="none"/></svg>`,
    // 33: lock
    `<svg viewBox="0 0 10 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="5" width="7" height="5" rx=".5"/><path d="M3 5V3.5a2 2 0 014 0V5"/><circle cx="5" cy="7.5" r=".8" fill="currentColor" stroke="none"/></svg>`,
    // 34: magnifying glass
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="4.8" cy="4.8" r="3.5"/><line x1="7.5" y1="7.5" x2="10" y2="10"/></svg>`,
    // 35: film strip
    `<svg viewBox="0 0 12 11" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="10" height="9" rx=".5"/><line x1="1" y1="3.5" x2="11" y2="3.5"/><line x1="1" y1="7.5" x2="11" y2="7.5"/><rect x="2.5" y="4.5" width="3" height="2.5" rx=".3"/><rect x="6.5" y="4.5" width="3" height="2.5" rx=".3"/></svg>`,
    // 36: camera
    `<svg viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 3h2l1-1.5h4l1 1.5h2v6H1z"/><circle cx="6" cy="6" r="2"/></svg>`,
    // 37: eye slash (hidden)
    `<svg viewBox="0 0 12 9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M.5 4.5C2 2 3.8 1 6 1c2.2 0 4 1 5.5 3.5"/><line x1="1" y1="1" x2="11" y2="8"/><circle cx="6" cy="4.5" r="1.2"/></svg>`,
    // 38: scissors
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="3" cy="8.5" r="1.5"/><circle cx="8" cy="8.5" r="1.5"/><line x1="4.5" y1="7.5" x2="8" y2="2"/><line x1="6.5" y1="7.5" x2="3" y2="2"/></svg>`,
    // 39: folder
    `<svg viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 2.5h3.5l1.5 1H11v5.5H1z"/></svg>`,
    // 40: tag / label
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 1h6l3 3-6 6-3-3z"/><circle cx="8" cy="3.5" r=".7" fill="currentColor" stroke="none"/></svg>`,
    // 41: compass
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="4.5"/><polygon points="5.5,2 6.5,5.5 5.5,9 4.5,5.5" fill="currentColor" opacity="0.3"/></svg>`,
    // 42: zap / flash
    `<svg viewBox="0 0 8 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5 .5H2.5L.5 6h2.5L1 11.5l5.5-6H4L5.5.5z"/></svg>`,
    // 43: square outline
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="8" height="8"/></svg>`,
    // 44: circle outline
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="4.5"/></svg>`,
    // 45: play button
    `<svg viewBox="0 0 10 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l8 4.5L1 10z"/></svg>`,
    // 46: pause button
    `<svg viewBox="0 0 10 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1" width="2.5" height="9"/><rect x="6" y="1" width="2.5" height="9"/></svg>`,
    // 47: stop button
    `<svg viewBox="0 0 10 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="7" height="8"/></svg>`,
    // 48: rewind
    `<svg viewBox="0 0 12 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6 1l-5 4.5L6 10z"/><path d="M11 1l-5 4.5L11 10z"/></svg>`,
    // 49: fast forward
    `<svg viewBox="0 0 12 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l5 4.5L1 10z"/><path d="M6 1l5 4.5L6 10z"/></svg>`,
    // 50: keyframe diamond (small, at position)
    `<svg viewBox="0 0 11 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 1L9 5.5 5.5 10 2 5.5z"/></svg>`,
    // 51: keyframe diamond (with handles)
    `<svg viewBox="0 0 14 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5.5" x2="4" y2="5.5"/><line x1="10" y1="5.5" x2="14" y2="5.5"/><path d="M4 1l3 4.5L4 10z" fill="currentColor"/></svg>`,
    // 52: ease in curve (spline)
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 9C3 9 4 2 10 2"/><circle cx="1" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="2" r="1" fill="currentColor" stroke="none"/></svg>`,
    // 53: ease out curve (spline)
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 9C7 9 8 2 10 2"/><circle cx="1" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="2" r="1" fill="currentColor" stroke="none"/></svg>`,
    // 54: ease in-out S-curve
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 9C2 9 3 2 5.5 2S9 9 10 2"/><circle cx="1" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="2" r="1" fill="currentColor" stroke="none"/></svg>`,
    // 55: linear ramp (stepped)
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 9h2V5h2V2h2v3h2"/></svg>`,
    // 56: bounce curve
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 9C2 2 4 9 5 5s2-4 3-1 1 5 2 2"/></svg>`,
    // 57: motion path (wavy)
    `<svg viewBox="0 0 12 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 8c1.5-3 3-5 4.5-2s1.5 5 3 2 2-5 2.5-3"/><circle cx="1" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="5" r="1" fill="currentColor" stroke="none"/></svg>`,
    // 58: bezier handle
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 9C4 1 7 1 10 9"/><line x1="4" y1="4.5" x2="4" y2="9" stroke-dasharray="1 1"/><line x1="7" y1="4.5" x2="7" y2="9" stroke-dasharray="1 1"/><circle cx="4" cy="4.5" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="4.5" r="1" fill="currentColor" stroke="none"/></svg>`,
    // 59: value graph
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="1,9 3,5 5,7 7,3 9,6"/><circle cx="1" cy="9" r=".8" fill="currentColor" stroke="none"/><circle cx="3" cy="5" r=".8" fill="currentColor" stroke="none"/><circle cx="5" cy="7" r=".8" fill="currentColor" stroke="none"/><circle cx="7" cy="3" r=".8" fill="currentColor" stroke="none"/><circle cx="9" cy="6" r=".8" fill="currentColor" stroke="none"/></svg>`,
    // 60: clock
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="4.5"/><line x1="5.5" y1="3" x2="5.5" y2="5.5"/><line x1="5.5" y1="5.5" x2="7.5" y2="6.5"/></svg>`,
    // 61: stopwatch
    `<svg viewBox="0 0 11 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="6.5" r="4"/><line x1="5.5" y1="1" x2="5.5" y2="2.5"/><line x1="8" y1="1.5" x2="7" y2="2.5"/><line x1="5.5" y1="4.5" x2="5.5" y2="6.5"/><line x1="5.5" y1="6.5" x2="7.5" y2="7.5"/></svg>`,
    // 62: gauge / speedometer
    `<svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 7A5 5 0 0111 7"/><line x1="6" y1="4" x2="8.5" y2="2"/><circle cx="6" cy="4" r=".8" fill="currentColor" stroke="none"/></svg>`,
    // 63: playhead / marker
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 1h5l2 3-3.5 6L1 4z"/><line x1="5.5" y1="5" x2="5.5" y2="7.5" stroke-linecap="round"/></svg>`,
];

// Default color palette for auto-assigning to new banks
const BANK_PALETTE = [
    '#ff7c44', // orange
    '#44aaff', // blue
    '#44e8aa', // mint
    '#aa44ff', // purple
    '#ffcc44', // amber
    '#ff4488', // pink
    '#44e8ff', // cyan
    '#aaff44', // lime
    '#ff6655', // coral
    '#7755ff', // violet
    '#55ff99', // green
    '#ff99bb', // rose
];
// #endregion

// ─────────────────────────────────────────────────────
// #region SVG ICON STRINGS (for select / capture / close)
// ─────────────────────────────────────────────────────
const SVG = {
    // icons-cursor-sting — select / recall
    select:  `<svg viewBox="0 0 9.98 9.98" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9.17,5.27l-2.69.92c-.13.05-.24.15-.28.28l-.92,2.69c-.13.38-.66.41-.83.05L.55,1.15c-.19-.39.22-.79.6-.6l8.07,3.89c.36.18.33.7-.05.83Z"/></svg>`,
    // icons-lens-split — capture / focus
    capture: `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="3.59" y1="3.59" x2=".5" y2=".5"/><line x1="10.5" y1="10.5" x2="7.41" y2="7.41"/><path d="M7.41,3.59c-1.05-1.05-2.76-1.05-3.82,0-1.05,1.05-1.05,2.76,0,3.82,1.05,1.05,2.76,1.05,3.82,0,1.05-1.05,1.05-2.76,0-3.82Z"/></svg>`,
    // icons-cross-diagonal — delete / clear
    close:   `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="10.5" y1=".5" x2=".5" y2="10.5"/><line x1=".5" y1=".5" x2="10.5" y2="10.5"/></svg>`
};
// #endregion

// ─────────────────────────────────────────────────────
// #region STORAGE PATH HELPERS
// Path strings are built in JSX (hlm_getSavePath etc.) — these JS helpers
// just format the evalScript call strings so call-sites stay readable.
// ─────────────────────────────────────────────────────
function _jsxPath(projPath, compId, bankId) {
    // Returns the evalScript expression that resolves to the save path string
    return `hlm_getSavePath("${_esc(projPath)}", "${compId}", "${bankId}")`;
}
// Escape backslashes for embedding in an evalScript string literal
function _esc(str) {
    return str.replace(/\\/g, '\\\\');
}
// #endregion

// ─────────────────────────────────────────────────────
// #region DEFAULT CONFIG
// ─────────────────────────────────────────────────────
function makeDefaultConfig() {
    return {
        kfBanks: [
            { id: 'KfBank_1', name: 'KF Bank A', iconIdx: 5 },
            { id: 'KfBank_2', name: 'KF Bank B', iconIdx: 0 },
            { id: 'KfBank_3', name: 'KF Bank C', iconIdx: 4 }
        ],
        layBanks: [
            { id: 'LayBank_1', name: 'Lay Bank A', iconIdx: 6 },
            { id: 'LayBank_2', name: 'Lay Bank B', iconIdx: 9 },
            { id: 'LayBank_3', name: 'Lay Bank C', iconIdx: 8 }
        ],
        layStates: [
            { id: 'State_1', name: 'State A' },
            { id: 'State_2', name: 'State B' },
            { id: 'State_3', name: 'State C' }
        ],
        nextId: 4,
        sectionOrder: ['kf', 'lay', 'selecta', 'states'], // tab system replaces old search+rename sections
        kfRowBreaks: [],        // bank IDs after which a forced row break is inserted
        layRowBreaks: [],       // same for layer banks
        selectaMinLayers: 2,    // min layer-count a pattern must hit to appear on SELECTA
        selectaActivated: [],   // patterns explicitly dragged out of quarantine (per comp, synced from map)
        selectaActivatedMap: {},// compId → activated patterns array (persistent per-comp storage)
        selectaShowFileTypes: false, // include file type extensions as patterns
        selectaPrefixOnly: true,     // only use text before first space in layer names
        selectaPatternColors: {},    // pattern name → hex color for chip buttons
        kfStrictMatch: false,        // KF recall: strict (only exact matches) vs fuzzy (default)
        bankLabelIndices: {},        // bankId → AE label index (1-16) derived from bank color
        bankColors: {
            'KfBank_1':  '#ff7c44',
            'KfBank_2':  '#44aaff',
            'KfBank_3':  '#44e8aa',
            'LayBank_1': '#aa44ff',
            'LayBank_2': '#ffcc44',
            'LayBank_3': '#ff4488',
        }
    };
}

let currentConfig   = makeDefaultConfig();
let currentProjPath = null;
let currentCompId   = null;
let currentCompName = null;
let activeStateId   = 'State_1';
// #endregion

// ─────────────────────────────────────────────────────
// #region HELPERS
// ─────────────────────────────────────────────────────
function getBankColor(bankId) {
    return currentConfig.bankColors[bankId] || '#ff7c44';
}

function getBankIconSvg(bank) {
    const idx = (bank.iconIdx !== undefined) ? (bank.iconIdx % BANK_ICONS.length) : 0;
    return BANK_ICONS[idx];
}
// #endregion

// ─────────────────────────────────────────────────────
// #region TABS
// ─────────────────────────────────────────────────────
let activeTab = 'memory';

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    var nav = document.getElementById('tab-nav');
    if (nav) {
        nav.addEventListener('wheel', function(e) {
            e.preventDefault();
            var btns = [].slice.call(document.querySelectorAll('.tab-btn'));
            var currentIdx = -1;
            btns.forEach(function(b, i) {
                if (b.dataset.tab === activeTab) currentIdx = i;
            });
            if (currentIdx === -1) return;
            var dir = e.deltaY > 0 ? 1 : -1;
            var nextIdx = (currentIdx + dir + btns.length) % btns.length;
            switchTab(btns[nextIdx].dataset.tab);
        }, { passive: false });
    }
}

function switchTab(name) {
    activeTab = name;
    document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.tab === name);
    });
    document.querySelectorAll('.tab-panel').forEach(function(p) {
        p.classList.toggle('active', p.id === 'tab-' + name);
    });
}
// #endregion

// ─────────────────────────────────────────────────────
// #region COLOR PICKER (delegates to HLMColorPicker module in colorpicker.js)
// ─────────────────────────────────────────────────────
let _aeLabels = null;

function fetchAELabels(cb) {
    if (_aeLabels) { cb(_aeLabels); return; }
    csInterface.evalScript('getAELabelData()', raw => {
        try { _aeLabels = JSON.parse(raw); } catch(e) { _aeLabels = []; }
        cb(_aeLabels);
    });
}

// Map a hex color to the nearest AE label index (1–16) using cached _aeLabels.
// Returns 0 if labels not loaded yet.
function _nearestLabelIndex(hex) {
    if (!_aeLabels || !_aeLabels.length) return 0;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var bestIdx = 1, bestDist = Infinity;
    for (var i = 0; i < _aeLabels.length; i++) {
        var lh = (_aeLabels[i].hex || '').replace(/^#/, '');
        if (lh.length < 6) continue;
        var lr = parseInt(lh.slice(0, 2), 16);
        var lg = parseInt(lh.slice(2, 4), 16);
        var lb = parseInt(lh.slice(4, 6), 16);
        var dist = (r - lr) * (r - lr) + (g - lg) * (g - lg) + (b - lb) * (b - lb);
        if (dist < bestDist) { bestDist = dist; bestIdx = i + 1; }
    }
    return bestIdx;
}

// Thin wrapper — KF banks open in label-only mode (no free hex, swatches only)
function openColorPicker(bankId, anchorEl) {
    const isKfBank = currentConfig.kfBanks.some(b => b.id === bankId);
    HLMColorPicker.open(bankId, anchorEl, currentConfig.bankColors[bankId], isKfBank ? { labelOnly: true } : undefined);
}
// #endregion

// ─────────────────────────────────────────────────────
// #region CONFIG PERSISTENCE
// loadConfig is now async — pass a callback that receives the config object.
// saveConfig is fire-and-forget (no callback needed).
// ─────────────────────────────────────────────────────
function loadConfig(projPath, compId, cb) {
    csInterface.evalScript(`hlm_readConfig("${_esc(projPath)}", "${compId || ''}")`, raw => {
        try {
            // Check for empty, missing, or JSX error strings BEFORE parsing
            if (!raw || raw === 'NOT_FOUND' || raw.indexOf('ERROR') === 0) {
                console.log('[HLM] loadConfig: no config found or error returned, using defaults. Message:', raw);
                cb(makeDefaultConfig());
                return;
            }
            
            const cfg = JSON.parse(raw);
            
            // Backfill missing fields
            if (!cfg.layStates)    cfg.layStates    = makeDefaultConfig().layStates;
            if (!cfg.bankColors)   cfg.bankColors   = {};
            if (!cfg.sectionOrder) cfg.sectionOrder = ['kf', 'lay', 'selecta', 'states'];
            if (!cfg.kfRowBreaks)                   cfg.kfRowBreaks        = [];
            if (!cfg.layRowBreaks)                  cfg.layRowBreaks       = [];
            if (cfg.selectaMinLayers === undefined)  cfg.selectaMinLayers   = 2;
            if (!cfg.selectaActivated)               cfg.selectaActivated   = [];
            if (!cfg.selectaActivatedMap)            cfg.selectaActivatedMap = {};
            if (cfg.selectaShowFileTypes === undefined) cfg.selectaShowFileTypes = false;
            if (cfg.selectaPrefixOnly === undefined)    cfg.selectaPrefixOnly    = true;
            if (!cfg.selectaPatternColors)             cfg.selectaPatternColors = {};
            if (cfg.kfStrictMatch === undefined)        cfg.kfStrictMatch        = false;
            if (!cfg.bankLabelIndices)                  cfg.bankLabelIndices     = {};

            // Ensure every bank has iconIdx and a color
            const allBanks = [...cfg.kfBanks, ...cfg.layBanks];
            allBanks.forEach((bank, i) => {
                if (bank.iconIdx === undefined) bank.iconIdx = i % BANK_ICONS.length;
                if (!cfg.bankColors[bank.id])   cfg.bankColors[bank.id] = BANK_PALETTE[i % BANK_PALETTE.length];
            });
            
            cb(cfg);
        } catch(e) {
            // This catch prevents the silent failure!
            console.error('[HLM] Fatal error inside loadConfig callback:', e);
            cb(makeDefaultConfig());
        }
    });
}

function saveConfig() {
    if (!currentProjPath) return;
    const jsonStr = JSON.stringify(currentConfig).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    csInterface.evalScript(`hlm_writeConfig("${_esc(currentProjPath)}", "${currentCompId || ''}", "${jsonStr}")`, result => {
        if (result && result.indexOf('ERROR') === 0) console.error('[HLM] saveConfig failed:', result);
    });
}
// #endregion

// ─────────────────────────────────────────────────────
// #region RENDER BANK ROW
// Order: [Sel — bank icon, fully colored] [Name input] [Cap — smaller] [×]
// ─────────────────────────────────────────────────────
// #region RENDER BANK CELL
// Builds a draggable .bank-cell for the flex-wrap .bank-grid.
// Sel btn (top) + Cap btn (below) as a stack, name input beneath (wide mode only).
// ─────────────────────────────────────────────────────
function renderBankCell(type, bank) {
    const isKf = type === 'kf';
    const color = getBankColor(bank.id);

    const cell = document.createElement('div');
    cell.className = 'bank-cell';
    cell.dataset.bankId   = bank.id;
    cell.dataset.bankType = type;
    cell.draggable = true;

    // SELECT button
    const selBtn = document.createElement('button');
    selBtn.id        = `sel_${bank.id}`;
    selBtn.className = 'icon-btn sel-btn';
    selBtn.innerHTML = getBankIconSvg(bank);
    selBtn.title     = isKf ? 'Restore saved keyframe positions' : 'Recall saved layer selection';
    selBtn.addEventListener('click', () => selectData(type, bank.id, `name_${bank.id}`));

    // CAPTURE button
    const capBaseTitle = isKf
        ? 'Capture current keyframe positions. Warning: Adding more keyframes after capture will alter the state.'
        : 'Capture current selection into this layer memory bank';
    const capBtn = document.createElement('button');
    capBtn.id              = `cap_${bank.id}`;
    capBtn.className       = 'icon-btn cap-btn';
    capBtn.innerHTML       = SVG.capture;
    capBtn.title           = capBaseTitle;
    capBtn.dataset.baseTitle = capBaseTitle;
    capBtn.addEventListener('click', () => captureData(type, bank.id));

    // Clear logic shared by verbose clrBtn and lean leanClrBtn
    function _doClear() {
        if (!currentProjPath || !currentCompId) return;
        csInterface.evalScript(`hlm_deleteFile(${_jsxPath(currentProjPath, currentCompId, bank.id)})`, () => {
            refreshBankIndicators();
        });
    }

    // CLEAR button — lives in cap-clr-row in verbose mode, visible (not hover-only)
    const clrBtn = document.createElement('button');
    clrBtn.className = 'clr-btn bank-cell-clr';
    clrBtn.innerHTML = SVG.close;
    clrBtn.title = 'Clear this bank for the current comp';
    clrBtn.addEventListener('click', _doClear);

    // Cap + Clr row — side by side below sel button, verbose wide mode only
    const capClrRow = document.createElement('div');
    capClrRow.className = 'bank-cap-clr-row';
    capClrRow.appendChild(capBtn);
    capClrRow.appendChild(clrBtn);

    // Stack: sel on top, cap-clr-row beneath
    const stack = document.createElement('div');
    stack.className = 'bank-btn-stack';
    stack.appendChild(selBtn);
    stack.appendChild(capClrRow);

    // Name input — hidden until wide mode, editable
    const nameInput = document.createElement('input');
    nameInput.type        = 'text';
    nameInput.value       = bank.name;
    nameInput.id          = `name_${bank.id}`;
    nameInput.className   = 'bank-cell-name';
    nameInput.title       = bank.name;
    nameInput.draggable    = false; // Prevent text selection from triggering bank cell drag
    nameInput.addEventListener('input', () => {
        bank.name = nameInput.value;
        nameInput.title = nameInput.value;
        leanName.textContent = nameInput.value;
        saveConfig();
    });
    // Prevent drag/click events from propagating to bank cell
    nameInput.addEventListener('mousedown', e => e.stopPropagation());
    nameInput.addEventListener('click', e => e.stopPropagation());

    // ── Lean mode overlays ─────────────────────────────────────
    // Name label — overlays bottom-left of sel button, pointer-events:none
    const leanName = document.createElement('span');
    leanName.className   = 'bank-lean-name';
    leanName.textContent = bank.name;

    // Lean action cluster — tiny cap + clr overlaying top-right of sel button
    const leanActions = document.createElement('div');
    leanActions.className = 'bank-lean-actions';

    const leanCapBtn = document.createElement('button');
    leanCapBtn.className = 'bank-lean-cap';
    leanCapBtn.innerHTML = SVG.capture;
    leanCapBtn.title     = capBaseTitle;
    leanCapBtn.addEventListener('click', e => { e.stopPropagation(); captureData(type, bank.id); });

    const leanClrBtn = document.createElement('button');
    leanClrBtn.className = 'bank-lean-clr';
    leanClrBtn.innerHTML = SVG.close;
    leanClrBtn.title     = 'Clear this bank for the current comp';
    leanClrBtn.addEventListener('click', e => { e.stopPropagation(); _doClear(); });

    leanActions.appendChild(leanCapBtn);
    leanActions.appendChild(leanClrBtn);

    if (window._attachBankContextMenu) {
        window._attachBankContextMenu(bank.id, type, capBtn, selBtn);
    }

    cell.appendChild(stack);
    cell.appendChild(nameInput);
    cell.appendChild(leanName);
    cell.appendChild(leanActions);
    return cell;
}

function renderAll() {
    console.log('[HLM Trace] 🟢 renderAll() fired.');
    const kfContainer  = document.getElementById('kfBanksContainer');
    const layContainer = document.getElementById('layBanksContainer');
    
    if (!kfContainer || !layContainer) return;

    kfContainer.innerHTML  = '';
    layContainer.innerHTML = '';

    // Ensure containers carry the flex-wrap grid class
    kfContainer.classList.add('bank-grid');
    layContainer.classList.add('bank-grid');

    const kfBreaks  = currentConfig.kfRowBreaks  || [];
    const layBreaks = currentConfig.layRowBreaks || [];

    currentConfig.kfBanks.forEach(bank => {
        kfContainer.appendChild(renderBankCell('kf', bank));
        if (kfBreaks.indexOf(bank.id) !== -1) {
            const br = document.createElement('div');
            br.className = 'bank-row-break';
            kfContainer.appendChild(br);
        }
    });
    currentConfig.layBanks.forEach(bank => {
        layContainer.appendChild(renderBankCell('lay', bank));
        if (layBreaks.indexOf(bank.id) !== -1) {
            const br = document.createElement('div');
            br.className = 'bank-row-break';
            layContainer.appendChild(br);
        }
    });

    refreshBankIndicators();
    refreshPatternChips();
    // Sync selecta min-layers display
    var _patCount = document.getElementById('selectaPatternCount');
    if (_patCount) _patCount.textContent = (currentConfig.selectaMinLayers || 2);
    // Sync selecta checkboxes
    var _prefixCb = document.getElementById('selectaPrefixOnly');
    if (_prefixCb) _prefixCb.checked = currentConfig.selectaPrefixOnly !== false;
    var _ftCb = document.getElementById('selectaShowFileTypes');
    if (_ftCb) _ftCb.checked = !!currentConfig.selectaShowFileTypes;
    // Sync KF strict-match toggle visual state
    var _strictBtn = document.getElementById('kfStrictToggle');
    if (_strictBtn) _strictBtn.classList.toggle('kf-strict-toggle--active', !!currentConfig.kfStrictMatch);
    if (typeof syncStatesUI === 'function') syncStatesUI();

    // NOTE: initBankGridDrag is NOT called here — drag listeners bind once at boot
    //       to the persistent container elements. Calling here would stack duplicates.

    // Re-stamp section drag handles after async DOM update
    if (typeof HLMDragDrop !== 'undefined') {
        console.log('[HLM Trace] Calling HLMDragDrop.refresh()...');
        HLMDragDrop.refresh();
    } else {
        console.error('[HLM Trace] 🔴 HLMDragDrop.refresh is UNDEFINED! The module did not update properly.');
    }
}
// #endregion

// ─────────────────────────────────────────────────────
// #region ADD / REMOVE BANKS
// ─────────────────────────────────────────────────────
function addBank(type) {
    const id   = type === 'kf' ? `KfBank_${currentConfig.nextId}`  : `LayBank_${currentConfig.nextId}`;
    const name = type === 'kf' ? `KF Bank ${currentConfig.nextId}` : `Lay Bank ${currentConfig.nextId}`;
    const iconIdx = Math.floor(Math.random() * BANK_ICONS.length);
    currentConfig.nextId++;

    const banks = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
    banks.push({ id, name, iconIdx });

    // Auto-assign a palette color to the new bank
    if (!currentConfig.bankColors[id]) {
        const allBanks = [...currentConfig.kfBanks, ...currentConfig.layBanks];
        const colorIdx = (allBanks.length - 1) % BANK_PALETTE.length;
        currentConfig.bankColors[id] = BANK_PALETTE[colorIdx];
    }

    saveConfig();
    renderAll();
}

function removeBank(type) {
    const banks = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
    if (banks.length === 0) return;
    banks.pop();
    saveConfig();
    renderAll();
}
// #endregion

// ─────────────────────────────────────────────────────
// #region ACTIVE COMP LABEL
// ─────────────────────────────────────────────────────
function updateCompLabel(name) {
    const el = document.getElementById('activeCompLabel');
    if (!el) return;
    el.textContent = name ? name.toUpperCase() : 'NO ACTIVE COMP';
    if (name) {
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
        el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
    }
}
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK INDICATORS
// refreshBankIndicators is now async — it fires N evalScript calls (one per bank)
// and updates each button individually as results arrive.
// ─────────────────────────────────────────────────────
function refreshBankIndicators() {
    // Snapshot at call time — callbacks may return after comp has changed (rapid switching).
    // Any callback whose snapshot no longer matches currentCompId is discarded as stale.
    var _snapCompId   = currentCompId;
    var _snapProjPath = currentProjPath;

    [...currentConfig.kfBanks, ...currentConfig.layBanks].forEach(bank => {
        const { id } = bank;
        const capBtn = document.getElementById(`cap_${id}`);
        const selBtn = document.getElementById(`sel_${id}`);
        if (!capBtn || !selBtn) return;

        const color = getBankColor(id);

        // SELECT: always fully colored with bank's theme color (no async needed)
        selBtn.style.backgroundColor = color;
        selBtn.style.borderColor     = color;
        selBtn.style.color           = '#0d0d0f';

        if (!_snapProjPath || !_snapCompId) {
            // No project/comp open — clear indicators without an evalScript round-trip
            _applyCapBtnState(capBtn, false, 0, color);
            return;
        }

        csInterface.evalScript(
            `hlm_getBankCount("${_esc(_snapProjPath)}", "${_snapCompId}", "${id}")`,
            countStr => {
                // Discard if comp changed while this evalScript round-trip was in flight
                if (_snapCompId !== currentCompId) return;
                const count   = parseInt(countStr, 10) || 0;
                const hasData = count > 0;
                _applyCapBtnState(capBtn, hasData, count, color);
            }
        );
    });
}

function _applyCapBtnState(capBtn, hasData, count, color) {
    capBtn.classList.toggle('cap-active', hasData);
    if (hasData) {
        capBtn.style.backgroundColor = 'transparent';
        capBtn.style.borderColor     = color;
        capBtn.style.color           = color;
    } else {
        capBtn.style.backgroundColor = '';
        capBtn.style.borderColor     = '';
        capBtn.style.color           = '';
    }
    const base = capBtn.dataset.baseTitle || '';
    capBtn.title = hasData ? `${base} (${count} saved)` : base;
}
// #endregion

// ─────────────────────────────────────────────────────
// #region LAYER STATES
// ─────────────────────────────────────────────────────
function syncStatesUI() {
    const input = document.getElementById('stateNameInput');
    if (!input) return;
    if (!activeStateId || !currentConfig.layStates.find(s => s.id === activeStateId)) {
        activeStateId = currentConfig.layStates.length > 0 ? currentConfig.layStates[0].id : null;
    }
    if (activeStateId) {
        const state = currentConfig.layStates.find(s => s.id === activeStateId);
        input.value = state ? state.name : '';
    } else {
        input.value = '';
    }
    refreshStateIndicator();
}

function renderStatesDropdown() {
    const list  = document.getElementById('stateDropdownList');
    const input = document.getElementById('stateNameInput');
    list.innerHTML = '';

    currentConfig.layStates.forEach(state => {
        const item = document.createElement('div');
        item.className   = 'dropdown-item' + (state.id === activeStateId ? ' active' : '');
        item.textContent = state.name;
        item.addEventListener('click', () => {
            activeStateId = state.id;
            input.value   = state.name;
            list.style.display = 'none';
            refreshStateIndicator();
        });
        list.appendChild(item);
    });

    const createItem = document.createElement('div');
    createItem.className   = 'dropdown-item create-new';
    createItem.textContent = 'Create New State...';
    createItem.addEventListener('click', () => {
        list.style.display = 'none';
        addState();
    });
    list.appendChild(createItem);
}

function addState() {
    const id   = `State_${currentConfig.nextId}`;
    const name = `State ${currentConfig.nextId}`;
    currentConfig.nextId++;
    currentConfig.layStates.push({ id, name });
    activeStateId = id;
    saveConfig();
    const input = document.getElementById('stateNameInput');
    if (input) input.value = name;
    refreshStateIndicator();
}

// refreshStateIndicator is async — asks JSX whether the state file exists
function refreshStateIndicator() {
    const btn = document.getElementById('captureStateBtn');
    if (!btn) return;

    if (!currentProjPath || currentProjPath === 'UNSAVED' || !currentCompId || !activeStateId) {
        _applyStateBtnState(btn, false);
        return;
    }

    // Snapshot at call time — guard callback against stale comp or state switches
    var _snapCompId  = currentCompId;
    var _snapStateId = activeStateId;

    csInterface.evalScript(
        `hlm_fileExists(${_jsxPath(currentProjPath, _snapCompId, _snapStateId)})`,
        result => {
            // Discard if comp or active state changed while this evalScript round-trip was in flight
            if (_snapCompId !== currentCompId || _snapStateId !== activeStateId) return;
            _applyStateBtnState(btn, result === 'true');
        }
    );
}

function _applyStateBtnState(btn, hasData) {
    btn.classList.toggle('cap-active', hasData);
    if (activeStateId) {
        const color = getBankColor(activeStateId);
        if (hasData) {
            btn.style.backgroundColor = 'transparent';
            btn.style.borderColor     = color;
            btn.style.color           = color;
        } else {
            btn.style.backgroundColor = '';
            btn.style.borderColor     = '';
            btn.style.color           = '';
        }
    }
}

function captureStateData() {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');
    if (!activeStateId)
        return alert('No active state selected.');

    const timestamp  = Date.now();
    const projPath   = currentProjPath;
    const compId     = currentCompId;
    const stateId    = activeStateId;

    csInterface.evalScript(`captureLayerStates("${stateId}", ${timestamp})`, aeDataStr => {
        if (aeDataStr.indexOf('ERROR') !== -1) return alert(aeDataStr);
        // Capture writes DNA tags to every layer's comment → cache is stale
        HLMCache.invalidate();
        // Escape the JSON payload for embedding in an evalScript string
        const safeData = aeDataStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        csInterface.evalScript(
            `hlm_writeFile(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${stateId}"), "${safeData}")`,
            result => {
                if (result && result.indexOf('ERROR') === 0) console.error('[HLM] captureStateData write error:', result);
                refreshStateIndicator();
            }
        );
    });
}

function applyStateData() {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');
    if (!activeStateId)
        return alert('No active state selected.');

    const projPath = currentProjPath;
    const compId   = currentCompId;
    const stateId  = activeStateId;

    csInterface.evalScript(
        `hlm_fileExists(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${stateId}"))`,
        existsResult => {
            if (existsResult !== 'true') return alert('This state is empty — capture it first.');
            const state      = currentConfig.layStates.find(s => s.id === stateId);
            const stateName  = state ? state.name : stateId;
            const safeStateName = stateName.replace(/"/g, '\\"');
            csInterface.evalScript(
                `applyLayerStates(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${stateId}"), "${safeStateName}")`,
                result => {
                    if (result && result.indexOf('ERROR') !== -1) alert(result);
                    // State apply mutates enabled/shy/solo/locked on every matched layer
                    HLMCache.invalidate();
                }
            );
        }
    );
}
// #endregion

// ─────────────────────────────────────────────────────
// #region CONTEXT / EVENT-DRIVEN UPDATE
// No polling. AE fires a CSXSEvent when project or active comp changes;
// we sync once on boot, then react to those events only.
// ─────────────────────────────────────────────────────
let _lastKnownProjPath = null;
let _lastKnownCompId   = null;

function _applyContext(ctx) {
    if (!ctx) return;
    console.log('[HLM Trace] 🔵 _applyContext received:', ctx.projPath, 'comp:', ctx.compId);

    const projChanged = ctx.projPath && ctx.projPath !== 'UNSAVED' && ctx.projPath !== _lastKnownProjPath;
    const compChanged = ctx.compId !== _lastKnownCompId;

    if (!projChanged && !compChanged) return; // nothing to do

    // Update comp globals first so loadConfig callbacks can reference them
    if (compChanged) {
        _lastKnownCompId = ctx.compId;
        currentCompId    = ctx.compId;
        currentCompName  = ctx.compName;
        updateCompLabel(ctx.compName);
        // Invalidate and rebuild metadata cache whenever the active comp changes
        HLMCache.build(ctx.compId);
    }

    if (projChanged) {
        _lastKnownProjPath = ctx.projPath;
        currentProjPath    = ctx.projPath;
    }

    // Reload config whenever the project OR comp changes (config is now per-comp)
    if ((projChanged || compChanged) && currentProjPath && currentProjPath !== 'UNSAVED') {
        const _snapProjPath = currentProjPath;
        const _snapCompId   = currentCompId;
        console.log('[HLM Trace] Loading config for comp:', _snapCompId);
        loadConfig(_snapProjPath, _snapCompId, cfg => {
            if (_snapProjPath !== currentProjPath || _snapCompId !== currentCompId) {
                console.log('[HLM Trace] loadConfig discarded — context changed during load.');
                return;
            }
            currentConfig = cfg;
            activeStateId = cfg.layStates && cfg.layStates.length > 0 ? cfg.layStates[0].id : null;
            // selectaActivated is now per-comp via per-comp config — no map lookup needed
            renderAll();
        });
    } else if (projChanged && (!ctx.projPath || ctx.projPath === 'UNSAVED')) {
        if (!_lastKnownProjPath) {
            _lastKnownProjPath = 'UNSAVED';
            renderAll();
        }
    } else if (compChanged && (!currentProjPath || currentProjPath === 'UNSAVED')) {
        // Comp switched but project unsaved — just re-render defaults
        renderAll();
    }
}

function startContextListener() {
    function _fetchContext() {
        csInterface.evalScript('getProjectAndCompContext()', raw => {
            let ctx;
            try { ctx = JSON.parse(raw); } catch(e) { ctx = { projPath: 'UNSAVED', compId: null, compName: null }; }
            _applyContext(ctx);
            // If we got UNSAVED on boot, retry after 2s in case AE wasn't ready
            if (!ctx.projPath || ctx.projPath === 'UNSAVED') {
                setTimeout(_fetchContext, 2000);
            }
        });
    }
    _fetchContext();

    // CSXSEvent from AE — debounced 200ms to let activeItem settle
    var _compSwitchDebounce = null;
    csInterface.addEventListener('com.hlm.contextChanged', function() {
        clearTimeout(_compSwitchDebounce);
        _compSwitchDebounce = setTimeout(_fetchContext, 200);
    });

    // Re-check on panel focus (mouse entering panel)
    var _mouseDebounce = null;
    document.addEventListener('mouseenter', function() {
        clearTimeout(_mouseDebounce);
        _mouseDebounce = setTimeout(_fetchContext, 300);
    }, true);
}
// #endregion

// ─────────────────────────────────────────────────────
// #region METADATA CACHE
// One-pass layer snapshot per comp activation.
// Replaces per-search iterations in search, hunt, states,
// isolation, and pattern functions.
//
// Cache shape (per layer keyed by layer id as string):
//   { name, comment, shy, solo, locked, enabled, parentId, label }
// Plus:
//   _numLayers: comp.numLayers at cache time (staleness check)
//   _compId:    comp id at cache time
//
// Invalidation: rebuilt whenever _applyContext fires a comp/proj
// change, OR when a search finds the current numLayers differs
// from the cached count (staleness guard via hlm_buildLayerMetadataJSON).
// ─────────────────────────────────────────────────────
var HLMCache = (function () {
    var _data     = null;   // { [layerId]: { name, comment, ... } }
    var _compId   = null;
    var _numLayers = 0;

    // Called by _applyContext on every context change.
    // Fires evalScript to build the snapshot; callback stores result.
    function build(compId) {
        _data      = null;
        _compId    = null;
        _numLayers = 0;

        if (!compId) return;

        csInterface.evalScript('hlm_buildLayerMetadataJSON()', function (raw) {
            try {
                if (!raw || raw.indexOf('ERROR') === 0) {
                    console.warn('[HLM] Cache build failed:', raw);
                    return;
                }
                var parsed = JSON.parse(raw);
                if (!parsed) return;
                _data      = parsed.layers  || {};
                _compId    = parsed.compId  || null;
                _numLayers = parsed.numLayers || 0;
                console.log('[HLM] Cache built —', _numLayers, 'layers');
            } catch (e) {
                console.error('[HLM] Cache parse error:', e);
            }
        });
    }

    // Synchronous staleness check: if cache is available but numLayers
    // has changed, rebuild. Returns false if cache is stale/unavailable.
    function isValid(liveNumLayers) {
        if (!_data || !_compId) return false;
        if (typeof liveNumLayers === 'number' && liveNumLayers !== _numLayers) return false;
        return true;
    }

    // Get a single layer record by id (string or number).
    function get(layerId) {
        if (!_data) return null;
        return _data[String(layerId)] || null;
    }

    // Search by name/comment/effect: returns array of layer records whose
    // name/comment contains term (case-insensitive).
    function search(term) {
        if (!_data) return null; // null = cache not ready (caller must fall back)
        var lower  = term.toLowerCase();
        var result = [];
        for (var id in _data) {
            var rec = _data[id];
            if (!rec) continue;
            if ((rec.name    && rec.name.toLowerCase().indexOf(lower)    !== -1) ||
                (rec.comment && rec.comment.toLowerCase().indexOf(lower) !== -1)) {
                result.push(rec);
            }
        }
        return result;
    }

    // Predicate search: caller supplies a function (rec) => boolean.
    // Returns an array of matching layer ids (strings).
    // Returns null if cache is not ready — caller must fall back to a JSX pass.
    function searchPredicate(fn) {
        if (!_data) return null;
        var ids = [];
        for (var id in _data) {
            var rec = _data[id];
            if (!rec) continue;
            try {
                if (fn(rec)) ids.push(String(rec.id));
            } catch (e) { /* predicate errors skip the record */ }
        }
        return ids;
    }

    // Cache-first selection helper. Runs the predicate against cached metadata
    // and fires a single `hlm_selectByIds` round trip with the resulting ID list.
    // Returns true if the cache-first path was taken, false if the cache was
    // unavailable (caller should fall back to a legacy JSX path).
    //
    // Opts:
    //   undoName:  string shown in AE undo stack (default 'HLM: Select')
    //   additive:  if true, keeps existing selection; default false (replace)
    //   cb:        optional callback(resultStr) invoked when JSX returns
    function selectByPredicate(fn, opts) {
        if (!_data) return false;
        var ids = searchPredicate(fn);
        if (ids === null) return false;
        opts = opts || {};
        var payload = {
            ids: ids,
            undoName: opts.undoName || 'HLM: Select',
            additive: !!opts.additive
        };
        var json = JSON.stringify(payload);
        var b64  = btoa(unescape(encodeURIComponent(json)));
        csInterface.evalScript('hlm_selectByIds("' + b64 + '")', function (raw) {
            if (typeof opts.cb === 'function') {
                try { opts.cb(raw); } catch (e) { console.error('[HLM] selectByPredicate cb:', e); }
            }
            if (raw && raw.indexOf('ERROR') === 0) {
                console.warn('[HLM] hlm_selectByIds:', raw);
            }
        });
        return true;
    }

    // Invalidate (e.g., after a capture/state operation that writes comments).
    // Also auto-rebuilds against the current comp so the next query is warm.
    // Call this from every mutation path: capture/apply, rename, DNA write,
    // isolation (shy/solo/locked), comp switch, undo/redo-visible ops.
    function invalidate() {
        var compIdForRebuild = _compId || (typeof currentCompId !== 'undefined' ? currentCompId : null);
        _data      = null;
        _compId    = null;
        _numLayers = 0;
        if (compIdForRebuild) build(compIdForRebuild);
    }

    return {
        build: build,
        isValid: isValid,
        get: get,
        search: search,
        searchPredicate: searchPredicate,
        selectByPredicate: selectByPredicate,
        invalidate: invalidate
    };
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region CAPTURE / SELECT
// ─────────────────────────────────────────────────────
function captureData(type, bankId) {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');

    const projPath = currentProjPath;
    const compId   = currentCompId;
    const timestamp  = Date.now();
    // Lazily compute label index for banks created before this session stored one
    if (type === 'kf') {
        if (!currentConfig.bankLabelIndices) currentConfig.bankLabelIndices = {};
        if (!currentConfig.bankLabelIndices[bankId] && _aeLabels && _aeLabels.length) {
            currentConfig.bankLabelIndices[bankId] = _nearestLabelIndex(getBankColor(bankId));
        }
    }
    const labelIdx = (type === 'kf' && currentConfig.bankLabelIndices)
        ? (currentConfig.bankLabelIndices[bankId] || 0) : 0;
    const scriptCall = type === 'lay'
        ? `captureLayers("${bankId}", ${timestamp})`
        : `captureKeyframes("${bankId}", ${timestamp}, "${labelIdx}")`;

    csInterface.evalScript(scriptCall, aeDataStr => {
        if (aeDataStr.indexOf('ERROR') !== -1) return alert(aeDataStr);
        // Bank capture writes DNA tags to selected layers' comments → cache stale
        HLMCache.invalidate();
        const safeData = aeDataStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        csInterface.evalScript(
            `hlm_writeFile(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${bankId}"), "${safeData}")`,
            result => {
                if (result && result.indexOf('ERROR') === 0) console.error('[HLM] captureData write error:', result);
                refreshBankIndicators();
            }
        );
    });
}

function selectData(type, bankId, labelId) {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');

    const projPath = currentProjPath;
    const compId   = currentCompId;

    csInterface.evalScript(
        `hlm_fileExists(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${bankId}"))`,
        existsResult => {
            if (existsResult !== 'true') return alert('This memory bank is currently empty.');
            const bankName      = document.getElementById(labelId).value;
            const safeBankName  = bankName.replace(/"/g, '\\"');
            const strict        = currentConfig.kfStrictMatch ? 'true' : 'false';
            const scriptCall    = type === 'lay'
                ? `selectLayersFromFile(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${bankId}"), "${safeBankName}")`
                : `selectKeyframesFromFile(hlm_getSavePath("${_esc(projPath)}", "${compId}", "${bankId}"), "${safeBankName}", "${strict}")`;
            csInterface.evalScript(scriptCall, result => {
                try {
                    if (result && result.indexOf('ERROR') !== -1) { alert(result); return; }
                    if (type === 'kf' && result && result.charAt(0) === '{') {
                        const r = JSON.parse(result);
                        _showKfRecallToast(r, bankName, bankId);
                    }
                } catch (e) { console.error('[HLM] selectData result parse error:', e, result); }
            });
        }
    );
}

// Surface a non-blocking recall summary below the KF Memory section header.
function _showKfRecallToast(r, bankName, bankId) {
    if (!r || r.status !== 'SUCCESS') return;
    const host = document.getElementById('kfBody');
    if (!host) return;
    let toast = document.getElementById('kfRecallToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'kfRecallToast';
        toast.className = 'kf-recall-toast';
        host.insertBefore(toast, host.firstChild);
    }
    const hit = r.exact + r.shifted;
    let kind = 'ok', msg;
    if (r.labelWarning) {
        kind = 'warn';
        msg = `${bankName}: keyframe color labels not found — falling back to fuzzy. Labels may have been manually cleared.`;
    } else if (r.mode === 'label') {
        if (hit === 0) {
            kind = 'err';
            msg = `${bankName}: no keyframes found`;
        } else {
            msg = `${bankName}: ${hit}/${r.total} recalled by color`;
        }
    } else if (hit === 0) {
        kind = 'err';
        msg = `${bankName}: no match (${r.total} banked${r.ambiguous ? `, ${r.ambiguous} ambiguous` : ''})`;
    } else if (r.skipped === 0 && r.shifted === 0) {
        msg = `${bankName}: ${r.exact}/${r.total} exact`;
    } else {
        kind = r.skipped ? 'warn' : 'ok';
        const parts = [];
        if (r.exact) parts.push(`${r.exact} exact`);
        if (r.shifted) parts.push(`${r.shifted} shifted`);
        if (r.skipped) parts.push(`${r.skipped} skipped`);
        if (r.ambiguous) parts.push(`${r.ambiguous} ambiguous`);
        msg = `${bankName}: ${hit}/${r.total} recalled · ${parts.join(', ')}`;
    }
    toast.className = 'kf-recall-toast kf-recall-toast--' + kind;
    toast.textContent = msg;
    toast.style.borderColor = getBankColor(bankId);
    clearTimeout(_showKfRecallToast._t);
    _showKfRecallToast._t = setTimeout(() => { if (toast) toast.remove(); }, 4200);
}
// #endregion

// ─────────────────────────────────────────────────────
// #region ADVANCED RENAME (tab)
// ─────────────────────────────────────────────────────
(function () {
    let renameMode = 'search';

    const modeBtns = {
        search: document.getElementById('renameModeSearch'),
        prefix: document.getElementById('renameModePrefix'),
        suffix: document.getElementById('renameModeSuffix'),
    };
    const input1    = document.getElementById('renameInput1');
    const input2    = document.getElementById('renameInput2');
    const scopeSel  = document.getElementById('renameScopeSelect');
    const caseCheck = document.getElementById('renameCaseSensitive');
    const numCheck  = document.getElementById('renamePreserveNumbers');
    const exclCheck = document.getElementById('renameExcludeEnabled');
    const exclRow   = document.getElementById('renameExcludeRow');
    const exclInput = document.getElementById('renameExcludeInput');

    function setMode(mode) {
        renameMode = mode;
        Object.keys(modeBtns).forEach(k => {
            modeBtns[k].classList.toggle('rename-mode-active', k === mode);
        });
        if (mode === 'search') {
            input1.placeholder = 'Search\u2026';
            input2.style.display = '';
        } else if (mode === 'prefix') {
            input1.placeholder = 'Prefix text\u2026';
            input2.style.display = 'none';
        } else {
            input1.placeholder = 'Suffix text\u2026';
            input2.style.display = 'none';
        }
    }

    exclCheck.addEventListener('change', () => {
        exclRow.style.display = exclCheck.checked ? '' : 'none';
        exclInput.disabled = !exclCheck.checked;
    });

    modeBtns.search.addEventListener('click', () => setMode('search'));
    modeBtns.prefix.addEventListener('click', () => setMode('prefix'));
    modeBtns.suffix.addEventListener('click', () => setMode('suffix'));

    document.getElementById('renameFireBtn').addEventListener('click', () => {
        const t1 = input1.value;
        const t2 = renameMode === 'search' ? input2.value : '';
        if (!t1 && renameMode !== 'search') return alert('Please enter some text.');
        if (renameMode === 'search' && !t1) return alert('Please enter a search term.');

        const scope         = scopeSel.value;
        const caseSensitive = caseCheck.checked;
        const preserveNums  = numCheck.checked;
        const excludeStr    = exclCheck.checked ? exclInput.value : '';

        const b64t1 = btoa(unescape(encodeURIComponent(t1)));
        const b64t2 = btoa(unescape(encodeURIComponent(t2)));
        const b64ex = btoa(unescape(encodeURIComponent(excludeStr)));

        const opts = JSON.stringify({
            scope: scope,
            caseSensitive: caseSensitive,
            preserveNumbers: preserveNums,
            exclude: excludeStr
        }).replace(/"/g, '\\"');

        csInterface.evalScript(
            `renameAdvanced("${renameMode}", "${b64t1}", "${b64t2}", '${opts}')`,
            result => {
                if (result && result.indexOf('ERROR') !== -1) alert(result);
                // Rename mutates layer.name (cached) → invalidate
                HLMCache.invalidate();
            }
        );
    });
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region HUNT TAB
// ─────────────────────────────────────────────────────
(function () {
    const huntFireBtn   = document.getElementById('huntFireBtn');
    const huntInput     = document.getElementById('huntInput');
    const huntInvertBtn = document.getElementById('huntInvertBtn');
    const huntDimBtn    = document.getElementById('huntDimBtn');
    const huntWithinSel = document.getElementById('huntWithinSelected');
    const huntProjWide  = document.getElementById('huntProjectWide');
    const huntExcludeEn = document.getElementById('huntExcludeEnabled');
    const huntExcludeIn = document.getElementById('huntExcludeInput');
    const huntDimName   = document.getElementById('huntDimName');
    const huntDimLabel  = document.getElementById('huntDimLabel');
    const huntLabelSel  = document.getElementById('huntLabelSelect');
    const huntDimParent = document.getElementById('huntDimParent');
    const huntParentIn  = document.getElementById('huntParentInput');
    const huntPickParentBtn   = document.getElementById('hlmPickParentBtn');
    const huntDimChild  = document.getElementById('huntDimChildren');
    const huntChildIn   = document.getElementById('huntChildrenInput');
    const huntPickChildBtn    = document.getElementById('hlmPickChildrenBtn');
    const huntDimMatte  = document.getElementById('huntDimTrackMatte');
    const huntMatteIn   = document.getElementById('huntMatteInput');
    const huntPickMatteBtn    = document.getElementById('hlmPickMatteBtn');
    const huntDimEffect = document.getElementById('huntDimEffectRef');
    const huntDimCmnt   = document.getElementById('huntDimComment');
    const huntPatternMinus = document.getElementById('huntPatternMinus');
    const huntPatternPlus  = document.getElementById('huntPatternPlus');
    const huntPatternCount = document.getElementById('huntPatternCount');
    const huntPatternChips = document.getElementById('huntPatternChips');
    let invertOn = false;
    let dimOn    = false;
    let patternMinLayers = 2;
    let detectedPatterns  = [];

    huntInvertBtn.addEventListener('click', () => {
        invertOn = !invertOn;
        huntInvertBtn.classList.toggle('hunt-btn-active', invertOn);
    });

    huntDimBtn.addEventListener('click', () => {
        dimOn = !dimOn;
        huntDimBtn.classList.toggle('hunt-btn-active', dimOn);
    });

    huntExcludeEn.addEventListener('change', () => {
        huntExcludeIn.style.display = huntExcludeEn.checked ? '' : 'none';
        huntExcludeIn.disabled = !huntExcludeEn.checked;
    });

    // Enable/disable sub-inputs when dimension checkboxes toggle
    // pickBtn: optional pick-click trigger button to enable/disable alongside the input
    function wireDimToggle(checkEl, inputEl, pickBtn) {
        if (!checkEl || !inputEl) return;
        checkEl.addEventListener('change', () => {
            inputEl.disabled = !checkEl.checked;
            if (pickBtn) pickBtn.disabled = !checkEl.checked;
            if (checkEl.checked) inputEl.focus();
        });
    }
    wireDimToggle(huntDimLabel,  huntLabelSel);
    wireDimToggle(huntDimParent, huntParentIn,  huntPickParentBtn);
    wireDimToggle(huntDimChild,  huntChildIn,   huntPickChildBtn);
    wireDimToggle(huntDimMatte,  huntMatteIn,   huntPickMatteBtn);

    // ─── PickClick trigger handlers ───────────────────
    // Each handler arms pick-click with the appropriate intent.
    // On resolve, the returned layerName is written into the corresponding text input.
    function _armHuntPickClick(intent, targetInput, triggerBtn) {
        if (!(Holy && Holy.LayerMaster && Holy.LayerMaster.PickClick)) {
            console.warn('[HLM] PickClick module not loaded');
            return;
        }
        Holy.LayerMaster.PickClick.arm({
            intent:    intent,
            btnId:     triggerBtn ? triggerBtn.id : null,
            onResolve: function (payload) {
                try {
                    if (payload && payload.layerName) {
                        targetInput.value = payload.layerName;
                    }
                } catch (e) { console.error('[HLM] PickClick resolve error:', e); }
            },
            onCancel: function (payload) {
                console.log('[HLM] PickClick cancelled', payload && payload.reason);
            }
        });
    }

    if (huntPickParentBtn) {
        huntPickParentBtn.addEventListener('click', function () {
            _armHuntPickClick('parent', huntParentIn, huntPickParentBtn);
        });
    }
    if (huntPickChildBtn) {
        huntPickChildBtn.addEventListener('click', function () {
            _armHuntPickClick('children', huntChildIn, huntPickChildBtn);
        });
    }
    if (huntPickMatteBtn) {
        huntPickMatteBtn.addEventListener('click', function () {
            _armHuntPickClick('trackMatte', huntMatteIn, huntPickMatteBtn);
        });
    }

    function getDimensions() {
        return {
            name:        huntDimName.checked,
            label:       huntDimLabel.checked,
            labelValue:  huntDimLabel.checked ? huntLabelSel.value : '',
            parent:      huntDimParent.checked,
            parentName:  huntDimParent.checked ? huntParentIn.value.trim() : '',
            children:    huntDimChild.checked,
            childName:   huntDimChild.checked ? huntChildIn.value.trim() : '',
            trackMatte:  huntDimMatte.checked,
            matteName:   huntDimMatte.checked ? huntMatteIn.value.trim() : '',
            effectRef:   huntDimEffect.checked,
            comment:     huntDimCmnt.checked,
        };
    }

    function buildHuntPayload() {
        return {
            search:      huntInput.value.trim(),
            invert:      invertOn,
            dimNonMatch: dimOn,
            withinSel:   huntWithinSel.checked,
            projectWide: huntProjWide.checked,
            exclude:     huntExcludeEn.checked ? huntExcludeIn.value : '',
            dims:        getDimensions(),
        };
    }

    huntFireBtn.addEventListener('click', () => {
        const payload = buildHuntPayload();
        if (!payload.search && !payload.dims.label && !payload.dims.parent &&
            !payload.dims.children && !payload.dims.trackMatte &&
            !payload.dims.effectRef && !payload.dims.comment && !payload.dims.name) {
            return alert('Enter a search term or enable at least one dimension.');
        }

        // ✅ MIGRATED fast-path — Hunt simple-mode uses HLMCache when the
        // search is a plain name/comment match with no cross-comp / effect /
        // parent-tree / mutation concerns (Phase 2, Item 4).
        // Conditions: single-comp, no invert, no within-sel, no dim-non-match,
        // no exclude, no label/parent/child/matte/effectRef dims. Term required.
        var d = payload.dims;
        var simpleFast =
            payload.search && payload.search.length > 0 &&
            !payload.invert && !payload.dimNonMatch &&
            !payload.withinSel && !payload.projectWide &&
            !(payload.exclude && payload.exclude.length) &&
            !d.label && !d.parent && !d.children && !d.trackMatte && !d.effectRef &&
            (d.name || d.comment || (!d.name && !d.comment));
        if (simpleFast) {
            var termLower = payload.search.toLowerCase();
            var wantName    = d.name || (!d.name && !d.comment); // default = name
            var wantComment = !!d.comment;
            var took = HLMCache.selectByPredicate(
                function (rec) {
                    if (wantName && rec.name && rec.name.toLowerCase().indexOf(termLower) !== -1) return true;
                    if (wantComment && rec.comment && rec.comment.toLowerCase().indexOf(termLower) !== -1) return true;
                    return false;
                },
                { undoName: 'Hunt Layers' }
            );
            if (took) return; // cache-first path fulfilled the request
            // else fall through to full JSX hunt
        }

        const safe = JSON.stringify(payload).replace(/"/g, '\\"');
        csInterface.evalScript(`huntLayers('${safe}')`, result => {
            if (result && result.indexOf('ERROR') !== -1) {
                alert(result);
                return;
            }
            try {
                const data = JSON.parse(result);
                if (data.patterns && data.patterns.length > 0) {
                    detectedPatterns = data.patterns;
                    renderPatternChips();
                }
            } catch(e) {}
        });
    });

    huntInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            huntFireBtn.click();
        }
    });

    // Pattern controls
    huntPatternMinus.addEventListener('click', () => {
        if (patternMinLayers > 1) {
            patternMinLayers--;
            huntPatternCount.textContent = patternMinLayers;
            refreshPatternDisplay();
        }
    });

    huntPatternPlus.addEventListener('click', () => {
        patternMinLayers++;
        huntPatternCount.textContent = patternMinLayers;
        refreshPatternDisplay();
    });

    function renderPatternChips() {
        if (!huntPatternChips) return;
        huntPatternChips.innerHTML = '';
        detectedPatterns.forEach(p => {
            const chip = document.createElement('span');
            chip.className = 'hunt-pattern-chip';
            chip.textContent = p.label;
            chip.title = 'Click to search for: ' + p.pattern;
            chip.addEventListener('click', () => {
                huntInput.value = p.pattern;
                huntFireBtn.click();
            });
            huntPatternChips.appendChild(chip);
        });
        if (detectedPatterns.length === 0) {
            huntPatternChips.innerHTML = '<span style="font-size:7px;color:var(--text-faint);padding:2px 0;">No patterns detected</span>';
        }
    }

    function refreshPatternDisplay() {
        const filtered = detectedPatterns.filter(p => p.count >= patternMinLayers);
        if (!huntPatternChips) return;
        huntPatternChips.innerHTML = '';
        filtered.forEach(p => {
            const chip = document.createElement('span');
            chip.className = 'hunt-pattern-chip';
            chip.textContent = p.label + ' \xd7' + p.count;
            chip.title = 'Click to search for: ' + p.pattern;
            chip.addEventListener('click', () => {
                huntInput.value = p.pattern;
                huntFireBtn.click();
            });
            huntPatternChips.appendChild(chip);
        });
        if (filtered.length === 0) {
            huntPatternChips.innerHTML = '<span style="font-size:7px;color:var(--text-faint);padding:2px 0;">No patterns found</span>';
        }
    }

    // Token autocomplete for exclude field
    const TOKEN_LIST = ['[null]', '[camera]', '[audio]', '[light]'];
    var _tokenSuggestion = null;

    function showTokenSuggestion(el) {
        hideTokenSuggestion();
        if (!el.value.endsWith('[')) return;
        _tokenSuggestion = document.createElement('span');
        _tokenSuggestion.className = 'hunt-token-suggestion';
        _tokenSuggestion.textContent = TOKEN_LIST.join('  ');
        var rect = el.getBoundingClientRect();
        _tokenSuggestion.style.left = rect.left + 'px';
        _tokenSuggestion.style.top  = (rect.bottom + 2) + 'px';
        document.body.appendChild(_tokenSuggestion);
    }

    function hideTokenSuggestion() {
        if (_tokenSuggestion) {
            _tokenSuggestion.remove();
            _tokenSuggestion = null;
        }
    }

    huntExcludeIn.addEventListener('input', function() {
        if (this.value.endsWith('[')) {
            showTokenSuggestion(this);
        } else {
            hideTokenSuggestion();
        }
    });

    huntExcludeIn.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && _tokenSuggestion) {
            e.preventDefault();
            var first = TOKEN_LIST[0];
            this.value = this.value.replace(/\[$/, '') + first;
            hideTokenSuggestion();
        }
        if (e.key === 'Escape') {
            hideTokenSuggestion();
        }
    });

    huntExcludeIn.addEventListener('blur', () => {
        setTimeout(hideTokenSuggestion, 100);
    });
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK CONTEXT MENU
// Right-click sel or cap button → dropdown: Colours | Capture | Icon | Clear ×
// ─────────────────────────────────────────────────────
(function () {
    const menu        = document.getElementById('bankContextMenu');
    const itmRename   = document.getElementById('bankCtxRename');
    const itmColours  = document.getElementById('bankCtxColours');
    const itmCapture  = document.getElementById('bankCtxCapture');
    const itmIcon     = document.getElementById('bankCtxIcon');
    const itmClear    = document.getElementById('bankCtxClear');
    let _activeBankId = null;
    let _activeBankType = null;
    let _activeCapBtn = null;

    function showMenu(x, y, bankId, bankType, capBtn) {
        _activeBankId   = bankId;
        _activeBankType = bankType;
        _activeCapBtn   = capBtn;
        // Clamp so menu never extends off the right/bottom edge of the panel
        const pw = document.documentElement.clientWidth;
        const ph = document.documentElement.clientHeight;
        const mw = 90, mh = 80;
        menu.style.left    = Math.min(x, pw - mw) + 'px';
        menu.style.top     = Math.min(y, ph - mh) + 'px';
        menu.style.display = 'block';
    }

    function hideMenu() {
        menu.style.display = 'none';
        _activeBankId   = null;
        _activeBankType = null;
        _activeCapBtn   = null;
    }

    // Attach right-click to a bank's sel + cap buttons
    function attachBankContextMenu(bankId, bankType, capBtn, selBtn) {
        function onCtx(e) {
            e.preventDefault();
            e.stopPropagation();
            showMenu(e.clientX, e.clientY, bankId, bankType, capBtn);
        }
        capBtn.addEventListener('contextmenu', onCtx);
        selBtn.addEventListener('contextmenu', onCtx);
    }

    itmColours.addEventListener('click', () => {
        const bankId = _activeBankId;
        const anchor = _activeCapBtn;
        hideMenu();
        if (bankId && anchor) openColorPicker(bankId, anchor);
    });

    itmRename.addEventListener('click', () => {
        const bankId = _activeBankId;
        hideMenu();
        if (!bankId) return;

        // Lean mode: show overlay input over the bank cell
        if (document.body.classList.contains('bank-lean') && document.body.classList.contains('bank-wide')) {
            const cell = document.querySelector('.bank-cell[data-bank-id="' + bankId + '"]');
            if (!cell) return;
            const bank = [...currentConfig.kfBanks, ...currentConfig.layBanks].find(b => b.id === bankId);
            if (!bank) return;

            const overlay = document.createElement('input');
            overlay.type = 'text';
            overlay.value = bank.name;
            overlay.className = 'bank-rename-overlay';
            const rect = cell.getBoundingClientRect();
            var ow = Math.max(rect.width, 120);
            var ol = rect.left + (rect.width - ow) / 2;
            if (ol + ow > document.documentElement.clientWidth) ol = document.documentElement.clientWidth - ow;
            if (ol < 0) ol = 0;
            overlay.style.position = 'fixed';
            overlay.style.left = ol + 'px';
            overlay.style.top = (rect.bottom - 18) + 'px';
            overlay.style.width = ow + 'px';
            overlay.style.zIndex = '1500';
            overlay.style.boxSizing = 'border-box';
            document.body.appendChild(overlay);
            overlay.focus();
            overlay.select();

            function _finish() {
                overlay.remove();
            }
            overlay.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    bank.name = overlay.value;
                    const leanName = cell.querySelector('.bank-lean-name');
                    if (leanName) leanName.textContent = overlay.value;
                    const nameInput = document.getElementById('name_' + bankId);
                    if (nameInput) { nameInput.value = overlay.value; nameInput.title = overlay.value; }
                    saveConfig();
                    _finish();
                } else if (e.key === 'Escape') {
                    _finish();
                }
            });
            overlay.addEventListener('blur', () => {
                // Save on blur too
                bank.name = overlay.value;
                const leanName = cell.querySelector('.bank-lean-name');
                if (leanName) leanName.textContent = overlay.value;
                const nameInput = document.getElementById('name_' + bankId);
                if (nameInput) { nameInput.value = overlay.value; nameInput.title = overlay.value; }
                saveConfig();
                _finish();
            });
            return;
        }

        // Verbose mode: focus the existing name input
        const nameInput = document.getElementById('name_' + bankId);
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    });

    itmCapture.addEventListener('click', () => {
        const bankId   = _activeBankId;
        const bankType = _activeBankType;
        hideMenu();
        if (bankId && bankType) captureData(bankType, bankId);
    });

    itmIcon.addEventListener('click', () => {
        const bankId = _activeBankId;
        hideMenu();
        if (bankId) BankIconPicker.open(bankId);
    });

    itmClear.addEventListener('click', () => {
        if (!_activeBankId || !currentProjPath || !currentCompId) { hideMenu(); return; }
        const bankId = _activeBankId;
        hideMenu();
        csInterface.evalScript(
            `hlm_deleteFile(${_jsxPath(currentProjPath, currentCompId, bankId)})`,
            () => { try { refreshBankIndicators(); } catch(e) { console.error('[HLM] clear cb:', e); } }
        );
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#bankContextMenu')) hideMenu();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideMenu();
    });

    // Expose so renderBankCell can wire up buttons after DOM build
    // Signature updated: bankType is now passed so Capture works correctly
    window._attachBankContextMenu = attachBankContextMenu;
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK ICON PICKER OVERLAY
// Opens a full-panel overlay grid. Stars persist to localStorage (cross-project).
// Bank iconIdx + config save happen on click.
// ─────────────────────────────────────────────────────
const BankIconPicker = (function () {
    const LS_KEY = 'hlm_starredIcons';
    let _overlay  = null;
    let _targetBankId = null;

    function _getStarred() {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e) { return []; }
    }
    function _setStarred(arr) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch(e) {}
    }

    function _build() {
        const overlay = document.createElement('div');
        overlay.id        = 'bankIconOverlay';
        overlay.className = 'bank-icon-overlay';
        overlay.innerHTML =
            '<div class="bio-header">' +
                '<span class="bio-title">CHOOSE ICON</span>' +
                '<button class="bio-close" id="bioCloseBtn">' +
                    '<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8">' +
                        '<line x1="10.5" y1=".5" x2=".5" y2="10.5"/><line x1=".5" y1=".5" x2="10.5" y2="10.5"/>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<div class="bio-grid" id="bioGrid"></div>';
        document.body.appendChild(overlay);

        overlay.querySelector('#bioCloseBtn').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', _onKey);
        return overlay;
    }

    function _onKey(e) { if (e.key === 'Escape') close(); }

    function _render() {
        const grid    = _overlay.querySelector('#bioGrid');
        const starred = _getStarred();
        grid.innerHTML = '';

        const allIndices = BANK_ICONS.map((_, i) => i);
        // Pinned first, then the rest in natural order
        const orderedIndices = [
            ...starred.filter(i => i < BANK_ICONS.length),
            ...allIndices.filter(i => !starred.includes(i))
        ];

        orderedIndices.forEach(idx => {
            const cell = document.createElement('div');
            cell.className = 'bio-cell' + (starred.includes(idx) ? ' bio-starred' : '');
            cell.dataset.idx = idx;

            const iconDiv = document.createElement('div');
            iconDiv.className = 'bio-icon';
            iconDiv.innerHTML = BANK_ICONS[idx];

            const starBtn = document.createElement('button');
            starBtn.className = 'bio-star-btn';
            starBtn.title     = starred.includes(idx) ? 'Unpin' : 'Pin to top';
            starBtn.innerHTML = '<svg viewBox="0 0 11 11" fill="' + (starred.includes(idx) ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="5.5,.5 6.57,4.43 10.5,5.5 6.57,6.57 5.5,10.5 4.43,6.57 .5,5.5 4.43,4.43"/></svg>';

            starBtn.addEventListener('click', e => {
                e.stopPropagation();
                const s = _getStarred();
                const si = s.indexOf(idx);
                if (si === -1) s.push(idx); else s.splice(si, 1);
                _setStarred(s);
                _render();
            });

            iconDiv.addEventListener('click', () => _applyIcon(idx));
            cell.addEventListener('click', () => _applyIcon(idx));
            cell.appendChild(iconDiv);
            cell.appendChild(starBtn);
            grid.appendChild(cell);
        });
    }

    function _applyIcon(idx) {
        if (_targetBankId === null) return;
        const bank = [...currentConfig.kfBanks, ...currentConfig.layBanks].find(b => b.id === _targetBankId);
        if (bank) {
            bank.iconIdx = idx;
            saveConfig();
            renderAll();
        }
        close();
    }

    function open(bankId) {
        _targetBankId = bankId;
        if (!_overlay) _overlay = _build();
        _render();
        _overlay.style.display = 'flex';
    }

    function close() {
        if (_overlay) _overlay.style.display = 'none';
        _targetBankId = null;
        document.removeEventListener('keydown', _onKey);
    }

    return { open, close };
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region EVENT LISTENERS
// ─────────────────────────────────────────────────────
document.getElementById('addKfBank').addEventListener('click',    () => addBank('kf'));
document.getElementById('removeKfBank').addEventListener('click', () => removeBank('kf'));
document.getElementById('addLayBank').addEventListener('click',    () => addBank('lay'));
document.getElementById('removeLayBank').addEventListener('click', () => removeBank('lay'));

document.getElementById('reloadBtn').addEventListener('click', () => location.reload());
// Isolation buttons mutate shy/solo/locked on layers → invalidate cache on callback
document.getElementById('soloBtn').addEventListener('click', () => csInterface.evalScript('isolateSolo()',     () => HLMCache.invalidate()));
document.getElementById('shyBtn').addEventListener('click',  () => csInterface.evalScript('isolateShyFocus()', () => HLMCache.invalidate()));
document.getElementById('lockBtn').addEventListener('click', () => csInterface.evalScript('isolateLock()',     () => HLMCache.invalidate()));
document.getElementById('invertBtn').addEventListener('click', () => {
    // ✅ MIGRATED — uses HLMCache to compute unlocked complement locally, then
    // hlm_selectByIds round-trip (Phase 2, Item 4). The JSX isolateInvert()
    // reads the live AE selection state and flips it against all unlocked
    // layers; we approximate by reading cache.locked and cache-held layer ids,
    // combined with a tiny live-selection fetch.
    csInterface.evalScript('(function(){var c=app.project.activeItem;if(!c||!(c instanceof CompItem))return "";var s=c.selectedLayers;var ids=[];for(var i=0;i<s.length;i++)ids.push(s[i].id);return ids.join(",");})()', function(selRaw) {
        var selected = {};
        if (selRaw) {
            var parts = String(selRaw).split(',');
            for (var i = 0; i < parts.length; i++) {
                if (parts[i].length) selected[parts[i]] = true;
            }
        }
        var took = HLMCache.selectByPredicate(
            function (rec) {
                if (rec.locked) return false;
                return !selected[String(rec.id)];
            },
            { undoName: 'Isolation Mode', additive: false, cb: function() {
                // Mirror JSX convention: reveal first selected in timeline after invert
                csInterface.evalScript('app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"))');
            }}
        );
        if (!took) {
            // Cache cold fallback: original full-JSX implementation
            csInterface.evalScript('isolateInvert()');
        }
    });
});

document.getElementById('hlm-settings-cog-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    if (typeof csInterface !== 'undefined' && csInterface) {
        try { csInterface.requestOpenExtension('com.holy.layer.master.settings', ''); } catch (err) {}
    }
});

if (typeof csInterface !== 'undefined' && csInterface) {
    csInterface.addEventListener('holy.layermaster.color.change', function (e) {
        try {
            var data = (typeof e.data === 'string') ? JSON.parse(e.data || '{}') : e.data;
            if (data && typeof data.hex === 'string') {
                setAccentColor(data.hex);
            }
        } catch (err) {}
    });
}

// States
document.getElementById('captureStateBtn').addEventListener('click', captureStateData);
document.getElementById('captureStateBtn').addEventListener('contextmenu', e => {
    e.preventDefault();
    if (activeStateId) openColorPicker(activeStateId, e.currentTarget);
});
document.getElementById('applyStateBtn').addEventListener('click', applyStateData);

// Clear active state data
document.getElementById('clearStateBtn').addEventListener('click', () => {
    if (!currentProjPath || !currentCompId || !activeStateId) return;
    csInterface.evalScript(
        `hlm_deleteFile(${_jsxPath(currentProjPath, currentCompId, activeStateId)})`,
        () => refreshStateIndicator()
    );
});

document.getElementById('stateNameInput').addEventListener('input', () => {
    if (!activeStateId) return;
    const state = currentConfig.layStates.find(s => s.id === activeStateId);
    if (state) {
        state.name = document.getElementById('stateNameInput').value;
        saveConfig();
    }
});

document.getElementById('stateDropdownBtn').addEventListener('click', () => {
    const list   = document.getElementById('stateDropdownList');
    const isOpen = list.style.display === 'block';
    if (isOpen) {
        list.style.display = 'none';
    } else {
        renderStatesDropdown();
        list.style.display = 'block';
    }
});

// Close state dropdown when clicking outside (picker close is handled by the module)
document.addEventListener('click', e => {
    const list = document.getElementById('stateDropdownList');
    if (list && !e.target.closest('.state-combo-wrap')) {
        list.style.display = 'none';
    }
});

// ─────────────────────────────────────────────────────
// #region SELECTA
// ─────────────────────────────────────────────────────
document.getElementById('selectChildrenBtn').addEventListener('click', function() {
    csInterface.evalScript('hlm_selectChildren()', function(result) {
        try {
            if (result && result.indexOf('ERROR') === 0) console.error('[HLM] selectChildren:', result);
        } catch(e) { console.error('[HLM] selectChildren callback error:', e); }
    });
});
document.getElementById('selectParentBtn').addEventListener('click', function() {
    csInterface.evalScript('hlm_selectParent()', function(result) {
        try {
            if (result && result.indexOf('ERROR') === 0) console.error('[HLM] selectParent:', result);
        } catch(e) { console.error('[HLM] selectParent callback error:', e); }
    });
});
document.getElementById('selectExprLinksBtn').addEventListener('click', function() {
    csInterface.evalScript('hlm_selectExpressionLinks()', function(result) {
        try {
            if (result && result.indexOf('ERROR') === 0) console.error('[HLM] selectExpressionLinks:', result);
        } catch(e) { console.error('[HLM] selectExpressionLinks callback error:', e); }
    });
});
// INV REFS — inverse of EXPR LINKS. Selects every layer whose expressions,
// effect layer-picker params, or track matte point at the current selection.
// Phase 3 / Item 6 — additive selection in the active comp (mirrors EXPR LINKS).
// projectWide is deferred for this iteration (pass '' options → comp-only).
document.getElementById('selectInverseRefsBtn').addEventListener('click', function() {
    csInterface.evalScript("hlm_selectInverseRefs('')", function(result) {
        try {
            if (!result) return;
            if (result.indexOf('ERROR') === 0) { console.error('[HLM] selectInverseRefs:', result); return; }
            var parsed = null;
            try { parsed = JSON.parse(result); } catch (pe) {
                console.error('[HLM] selectInverseRefs: bad JSON', result); return;
            }
            if (!parsed || !parsed.ok) { console.error('[HLM] selectInverseRefs:', parsed); return; }
            var c = parsed.count || 0;
            if (!c) {
                console.log('[HLM] INV REFS: no referrers found for current selection.');
            } else {
                console.log('[HLM] INV REFS: selected ' + c + ' referrer(s).', parsed.selected);
            }
        } catch(e) { console.error('[HLM] selectInverseRefs callback error:', e); }
    });
});

function refreshPatternChips() {
    var container = document.getElementById('selectaPatternChips');
    if (!container) return;

    if (!currentCompId) { container.innerHTML = ''; _syncSelectaQuarantine([]); return; }

    var prefixOnly = currentConfig.selectaPrefixOnly ? 'true' : 'false';
    var showFileTypes = currentConfig.selectaShowFileTypes ? 'true' : 'false';
    csInterface.evalScript('getCompPatterns(' + prefixOnly + ', ' + showFileTypes + ')', function(raw) {
        try {
            if (!raw || raw.indexOf('ERROR') === 0) { container.innerHTML = ''; _syncSelectaQuarantine([]); return; }
            var allPatterns = JSON.parse(raw);
            if (!allPatterns) allPatterns = [];

            var minLayers = (currentConfig.selectaMinLayers || 2);
            var activated = (currentConfig.selectaActivated || []);

            // Filter by min threshold first
            var eligible = allPatterns.filter(function(p) {
                return (p.count || 0) >= minLayers;
            });

            // Auto-activate top 5 patterns on first comp load (no prior activation state)
            if (currentConfig.selectaActivatedInitialised !== true && eligible.length > 0) {
                var toActivate = eligible.slice().sort(function(a, b) {
                    return (b.count || 0) - (a.count || 0);
                }).slice(0, 5);
                activated = toActivate.map(function(p) { return p.pattern; });
                currentConfig.selectaActivated = activated.slice();
                currentConfig.selectaActivatedInitialised = true;
                if (currentCompId) {
                    if (!currentConfig.selectaActivatedMap) currentConfig.selectaActivatedMap = {};
                    currentConfig.selectaActivatedMap[currentCompId] = activated.slice();
                }
                saveConfig();
            }

            // Active = explicitly activated by user (dragged out of quarantine)
            var active = eligible.filter(function(p) {
                return activated.indexOf(p.pattern) !== -1;
            });

            container.innerHTML = '';
            active.forEach(function(p) {
                var label = p.label || p.pattern;

                var btn = document.createElement('button');
                btn.className       = 'selecta-chip selecta-chip--active';
                btn.textContent     = label;
                btn.title           = p.pattern + ' (' + (p.count || 0) + ' layers)';
                btn.draggable       = true;
                btn.dataset.pattern = p.pattern;

                // Apply custom chip color if set
                var chipColor = (currentConfig.selectaPatternColors || {})[p.pattern];
                if (chipColor) {
                    btn.style.backgroundColor = chipColor;
                    btn.style.borderColor = chipColor;
                    btn.style.color = '#0d0d0f';
                }

                btn.addEventListener('click', function() {
                    // ✅ MIGRATED — uses HLMCache predicate + hlm_selectByIds (Phase 2, Item 4)
                    var pat  = p.pattern;
                    var took = HLMCache.selectByPredicate(
                        function (rec) { return rec.name && rec.name.indexOf(pat) !== -1; },
                        { undoName: 'SELECTA: Select by pattern' }
                    );
                    if (!took) {
                        // Cache cold: fall back to legacy JSX pass
                        var safe = pat.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                        csInterface.evalScript('selectLayersByName("' + safe + '")', function(result) {
                            try {
                                if (result && result.indexOf('ERROR') === 0) console.error('[HLM] selectLayersByName:', result);
                            } catch(e) { console.error('[HLM] selectLayersByName callback error:', e); }
                        });
                    }
                });

                // Drag: deactivates pattern (drag down to quarantine)
                btn.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/hlm-selecta-pattern', p.pattern);
                    e.dataTransfer.effectAllowed = 'move';
                    btn.classList.add('selecta-chip--dragging');
                });
                btn.addEventListener('dragend', function() {
                    btn.classList.remove('selecta-chip--dragging');
                });

                // Right-click: label color picker (AE label colors)
                btn.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    _showSelectaLabelPopup(p.pattern, e.clientX, e.clientY);
                });

                container.appendChild(btn);
            });

            // Show empty state placeholder if no active patterns
            _updateSelectaEmptyState(active.length, eligible.length);

            _syncSelectaQuarantine(eligible);
        } catch(e) {
            console.error('[HLM] refreshPatternChips error:', e);
        }
    });
}

// Empty state placeholder in main pattern zone
function _updateSelectaEmptyState(activeCount, eligibleCount) {
    var container = document.getElementById('selectaPatternChips');
    if (!container) return;

    var existing = container.querySelector('.selecta-empty-msg');
    if (existing) existing.remove();
    if (activeCount > 0) return;

    var msg = document.createElement('span');
    msg.className = 'selecta-empty-msg';

    var quarantined = (currentConfig.selectaActivated || []);
    var hasQuarantineItems = eligibleCount > quarantined.length;
    var prefixOnly = currentConfig.selectaPrefixOnly !== false;

    if (hasQuarantineItems) {
        msg.textContent = 'Drag your main patterns here';
    } else if (prefixOnly) {
        msg.textContent = 'Prefix patterns appear here. "B_CIRC-1" would appear from layers called "B_CIRC-1_ Shape Layer 2". Only a space will mark the divide.';
    } else {
        msg.textContent = 'Common patterns in layernames appear here';
    }

    container.appendChild(msg);
}

// Render the SELECTA quarantine section — shows all non-activated patterns
function _syncSelectaQuarantine(eligiblePatterns) {
    try {
        var wrap = document.getElementById('selectaQuarantineWrap');
        var list = document.getElementById('selectaQuarantineList');
        if (!wrap || !list) return;

        var activated = (currentConfig.selectaActivated || []);

        // Quarantined = eligible patterns NOT in activated list
        var quarantined = eligiblePatterns.filter(function(p) {
            return activated.indexOf(p.pattern) === -1;
        });

        // Prune stale entries from activated (patterns that no longer exist)
        var pruned = activated.filter(function(pat) {
            return eligiblePatterns.some(function(p) { return p.pattern === pat; });
        });
        if (pruned.length !== activated.length) {
            currentConfig.selectaActivated = pruned;
            if (currentCompId) {
                if (!currentConfig.selectaActivatedMap) currentConfig.selectaActivatedMap = {};
                currentConfig.selectaActivatedMap[currentCompId] = pruned.slice();
            }
            saveConfig();
        }

        wrap.classList.toggle('selecta-q--has-items', quarantined.length > 0);
        list.innerHTML = '';

        quarantined.forEach(function(p) {
            var chip = document.createElement('button');
            chip.className   = 'selecta-chip selecta-chip--quarantined';
            chip.draggable   = true;
            var maxChars = 18;
            var label = p.label || p.pattern;
            chip.textContent = label.length > maxChars ? label.slice(0, maxChars) + '\u2026' : label;
            chip.title       = 'Click to select · Drag up to activate: ' + p.pattern;

            chip.addEventListener('click', function() {
                // ✅ MIGRATED — uses HLMCache predicate + hlm_selectByIds (Phase 2, Item 4)
                // Select layers matching this pattern (don't move to main zone — drag only)
                var pat  = p.pattern;
                var took = HLMCache.selectByPredicate(
                    function (rec) { return rec.name && rec.name.indexOf(pat) !== -1; },
                    { undoName: 'SELECTA: Select by pattern' }
                );
                if (!took) {
                    var safe = pat.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    csInterface.evalScript('selectLayersByName("' + safe + '")', function(result) {
                        try {
                            if (result && result.indexOf('ERROR') === 0) console.error('[HLM] selectLayersByName:', result);
                        } catch(e) { console.error('[HLM] selectLayersByName callback error:', e); }
                    });
                }
            });
            chip.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/hlm-selecta-pattern', p.pattern);
                e.dataTransfer.effectAllowed = 'move';
                chip.classList.add('selecta-chip--dragging');
            });
            chip.addEventListener('dragend', function() {
                chip.classList.remove('selecta-chip--dragging');
            });
            list.appendChild(chip);
        });
    } catch(e) { console.error('[HLM] _syncSelectaQuarantine error:', e); }
}

// Show AE label color popup anchored at (x,y) for the given pattern
function _showSelectaLabelPopup(pattern, x, y) {
    // Remove any existing popup
    var existing = document.getElementById('selectaLabelPopup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.id = 'selectaLabelPopup';
    popup.className = 'selecta-label-popup';
    popup.style.left = Math.min(x, document.documentElement.clientWidth - 200) + 'px';
    popup.style.top  = Math.min(y, document.documentElement.clientHeight - 60) + 'px';

    // Temporary placeholder while labels load
    popup.textContent = 'Loading\u2026';
    document.body.appendChild(popup);

    fetchAELabels(function(labels) {
        popup.innerHTML = '';

        // Default swatch — resets to panel accent color
        var accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        var defSw = document.createElement('div');
        defSw.className = 'selecta-label-swatch selecta-label-swatch--default';
        defSw.style.backgroundColor = accentHex || '#ff7c44';
        defSw.title = 'Default';
        defSw.textContent = 'D';
        defSw.addEventListener('click', function() {
            delete currentConfig.selectaPatternColors[pattern];
            saveConfig();
            refreshPatternChips();
            popup.remove();
        });
        popup.appendChild(defSw);

        if (!labels || !labels.length) return;

        labels.forEach(function(lb) {
            if (!lb.hex) return; // skip empty labels
            var sw = document.createElement('div');
            sw.className = 'selecta-label-swatch';
            sw.style.backgroundColor = lb.hex;
            sw.title = lb.name;
            sw.addEventListener('click', function() {
                if (!currentConfig.selectaPatternColors) currentConfig.selectaPatternColors = {};
                currentConfig.selectaPatternColors[pattern] = lb.hex;
                saveConfig();
                refreshPatternChips();
                popup.remove();
            });
            popup.appendChild(sw);
        });
    });

    // Close on outside click
    setTimeout(function() {
        document.addEventListener('click', function closeLabelPopup(e) {
            if (!e.target.closest('#selectaLabelPopup')) {
                popup.remove();
                document.removeEventListener('click', closeLabelPopup);
            }
        });
    }, 0);
}
// #endregion

// ─────────────────────────────────────────────────────
// #region SELECTA PATTERN DRAG-DROP + MIN-LAYERS CONTROLS
// Chips drag to quarantine drop-zone. Min-layers counter persists in config.
// ─────────────────────────────────────────────────────
(function () {
    // ── Min-layers counter ───────────────────────────
    var minusBtn = document.getElementById('selectaPatternMinus');
    var plusBtn  = document.getElementById('selectaPatternPlus');
    var countEl  = document.getElementById('selectaPatternCount');

    function _syncCountDisplay() {
        if (countEl) countEl.textContent = (currentConfig.selectaMinLayers || 2);
    }

    if (minusBtn) minusBtn.addEventListener('click', function() {
        if ((currentConfig.selectaMinLayers || 2) > 1) {
            currentConfig.selectaMinLayers = (currentConfig.selectaMinLayers || 2) - 1;
            _syncCountDisplay();
            saveConfig();
            refreshPatternChips();
        }
    });
    if (plusBtn) plusBtn.addEventListener('click', function() {
        currentConfig.selectaMinLayers = (currentConfig.selectaMinLayers || 2) + 1;
        _syncCountDisplay();
        saveConfig();
        refreshPatternChips();
    });

    // ── Prefix-only checkbox ──────────────────────────
    var prefixCb = document.getElementById('selectaPrefixOnly');
    if (prefixCb) {
        prefixCb.checked = currentConfig.selectaPrefixOnly !== false;
        prefixCb.addEventListener('change', function() {
            currentConfig.selectaPrefixOnly = prefixCb.checked;
            saveConfig();
            refreshPatternChips();
        });
    }

    // ── File types checkbox ───────────────────────────
    var ftCb = document.getElementById('selectaShowFileTypes');
    if (ftCb) {
        ftCb.checked = !!currentConfig.selectaShowFileTypes;
        ftCb.addEventListener('change', function() {
            currentConfig.selectaShowFileTypes = ftCb.checked;
            saveConfig();
            refreshPatternChips();
        });
    }

    // ── Quarantine drop zone: drop here to DEACTIVATE ──
    var dropZone = document.getElementById('selectaQuarantineWrap');
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            dropZone.classList.add('selecta-q--dragover');
        });
        dropZone.addEventListener('dragleave', function() {
            dropZone.classList.remove('selecta-q--dragover');
        });
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropZone.classList.remove('selecta-q--dragover');
            var pat = e.dataTransfer.getData('text/hlm-selecta-pattern');
            if (!pat) return;
            // Deactivate: remove from activated list
            var idx = currentConfig.selectaActivated.indexOf(pat);
            if (idx !== -1) {
                currentConfig.selectaActivated.splice(idx, 1);
                if (currentCompId) {
                    if (!currentConfig.selectaActivatedMap) currentConfig.selectaActivatedMap = {};
                    currentConfig.selectaActivatedMap[currentCompId] = currentConfig.selectaActivated.slice();
                }
                saveConfig();
                refreshPatternChips();
            }
        });
    }

    // ── Active-chip area: drop here to ACTIVATE ──────
    var chipWrap = document.getElementById('selectaPatternChips');
    if (chipWrap) {
        chipWrap.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        chipWrap.addEventListener('drop', function(e) {
            e.preventDefault();
            var pat = e.dataTransfer.getData('text/hlm-selecta-pattern');
            if (!pat) return;
            // Activate: add to activated list if not already there
            if (currentConfig.selectaActivated.indexOf(pat) === -1) {
                currentConfig.selectaActivated.push(pat);
                if (currentCompId) {
                    if (!currentConfig.selectaActivatedMap) currentConfig.selectaActivatedMap = {};
                    currentConfig.selectaActivatedMap[currentCompId] = currentConfig.selectaActivated.slice();
                }
                saveConfig();
                refreshPatternChips();
            }
        });
    }
}());
// #endregion

// ─────────────────────────────────────────────────────
// Section collapse — click star to toggle section-body
// ─────────────────────────────────────────────────────
document.querySelectorAll('.section-star').forEach(star => {
    star.addEventListener('click', e => {
        const header = e.currentTarget.closest('.section-header');
        if (!header) return;
        const bodyId = header.dataset.bodyId;
        if (!bodyId) return;
        const body = document.getElementById(bodyId);
        if (!body) return;
        const isNowCollapsed = body.classList.toggle('section-collapsed');
        e.currentTarget.classList.toggle('star-collapsed', isNowCollapsed);
    });
});
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK LEAN MODE TOGGLE
// ─────────────────────────────────────────────────────
(function () {
    var LEAN_KEY = 'hlm_bankLean';
    function applyLean(lean) {
        document.body.classList.toggle('bank-lean', lean);
        var btn = document.getElementById('bankLeanToggle');
        if (btn) btn.classList.toggle('bank-lean-toggle--active', lean);
    }
    // Restore persisted state
    applyLean(localStorage.getItem(LEAN_KEY) === '1');

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('#bankLeanToggle');
        if (!btn) return;
        var isLean = !document.body.classList.contains('bank-lean');
        localStorage.setItem(LEAN_KEY, isLean ? '1' : '0');
        applyLean(isLean);
    });
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region KF STRICT MATCH TOGGLE
// Toggles currentConfig.kfStrictMatch — when on, recall requires ≥95 confidence
// (essentially exact match); off uses fuzzy scoring (≥55 threshold).
// ─────────────────────────────────────────────────────
(function () {
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('#kfStrictToggle');
        if (!btn) return;
        currentConfig.kfStrictMatch = !currentConfig.kfStrictMatch;
        btn.classList.toggle('kf-strict-toggle--active', currentConfig.kfStrictMatch);
        saveConfig();
    });
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region SELECTA QUARANTINE COLLAPSE
// ─────────────────────────────────────────────────────
(function () {
    document.addEventListener('click', function(e) {
        var header = e.target.closest('.selecta-q-header');
        if (!header) return;
        var list = document.getElementById('selectaQuarantineList');
        if (!list) return;
        var isCollapsed = list.classList.toggle('section-collapsed');
        var star = header.querySelector('.selecta-q-star');
        if (star) star.classList.toggle('star-collapsed', isCollapsed);
    });
}());
// #endregion
// ─────────────────────────────────────────────────────
var HLM_DEFAULT_ACCENT = '#ff7c44';

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function rgbToHsl_accent(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function setAccentColor(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return;

    var root = document.documentElement;
    root.style.setProperty('--accent', hex);

    var dimR = Math.max(0, Math.round(rgb.r * 0.8));
    var dimG = Math.max(0, Math.round(rgb.g * 0.8));
    var dimB = Math.max(0, Math.round(rgb.b * 0.8));
    root.style.setProperty('--accent-dim', 'rgba(' + dimR + ',' + dimG + ',' + dimB + ',0.18)');
    root.style.setProperty('--accent-dark', rgbToHex(Math.max(0, Math.round(rgb.r * 0.5)), Math.max(0, Math.round(rgb.g * 0.5)), Math.max(0, Math.round(rgb.b * 0.5))));
    root.style.setProperty('--border-accent', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.28)');

    var hsl = rgbToHsl_accent(rgb.r, rgb.g, rgb.b);
    root.style.setProperty('--ACCENT-RGB', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
    root.style.setProperty('--ACCENT-H', hsl.h);
    root.style.setProperty('--ACCENT-S', hsl.s + '%');
    root.style.setProperty('--ACCENT-L', hsl.l + '%');

    try { localStorage.setItem('hlm_accentColor', hex); } catch (e) {}
}

function loadSavedAccentColor() {
    try {
        var saved = localStorage.getItem('hlm_accentColor');
        if (saved && /^#[0-9A-F]{6}$/i.test(saved)) {
            setAccentColor(saved);
            return;
        }
    } catch (e) {}
    setAccentColor(HLM_DEFAULT_ACCENT);
}

function getCurrentAccentColor() {
    var computed = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return computed || HLM_DEFAULT_ACCENT;
}
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK GRID DRAG-DROP
// Drag-reorder bank cells within kf or lay containers.
// Drop zones:
//   Left half of cell   → insert BEFORE target
//   Right half of cell  → insert AFTER target
//   Bottom 28% of cell  → insert AFTER target + add row-break after target
// Row breaks are stored as bank IDs in kfRowBreaks / layRowBreaks (break inserted after that bank).
// ─────────────────────────────────────────────────────
function initBankGridDrag(type) {
    var containerId = type === 'kf' ? 'kfBanksContainer' : 'layBanksContainer';
    var container   = document.getElementById(containerId);
    if (!container) return;

    var dragSrcId   = null;
    var _indicator  = null; // active drop indicator element

    function _clearIndicator() {
        container.querySelectorAll('.bank-drop-before, .bank-drop-after').forEach(function(el) {
            el.classList.remove('bank-drop-before', 'bank-drop-after');
        });
        if (_indicator && _indicator.parentNode) _indicator.parentNode.removeChild(_indicator);
        _indicator = null;
    }

    function _showBreakBar(targetCell) {
        _clearIndicator();
        var bar = document.createElement('div');
        bar.className = 'bank-drop-break-bar';
        targetCell.parentNode.insertBefore(bar, targetCell.nextSibling);
        _indicator = bar;
    }

    container.addEventListener('dragstart', function(e) {
        var cell = e.target.closest('.bank-cell');
        if (!cell) return;
        dragSrcId = cell.dataset.bankId;
        cell.classList.add('bank-cell-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragSrcId);
    });

    container.addEventListener('dragend', function() {
        _clearIndicator();
        container.querySelectorAll('.bank-cell-dragging').forEach(function(el) {
            el.classList.remove('bank-cell-dragging');
        });
        dragSrcId = null;
    });

    container.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var cell = e.target.closest('.bank-cell');
        if (!cell || cell.dataset.bankId === dragSrcId) { _clearIndicator(); return; }

        var rect    = cell.getBoundingClientRect();
        var relY    = e.clientY - rect.top;
        var relX    = e.clientX - rect.left;
        var inBottom = relY > rect.height * 0.72;

        if (inBottom) {
            _showBreakBar(cell);
        } else {
            if (_indicator) { _indicator.parentNode && _indicator.parentNode.removeChild(_indicator); _indicator = null; }
            _clearIndicator();
            if (relX < rect.width * 0.5) {
                cell.classList.add('bank-drop-before');
            } else {
                cell.classList.add('bank-drop-after');
            }
        }
    });

    container.addEventListener('dragleave', function(e) {
        if (!container.contains(e.relatedTarget)) _clearIndicator();
    });

    container.addEventListener('drop', function(e) {
        e.preventDefault();
        var cell = e.target.closest('.bank-cell');
        _clearIndicator();
        if (!dragSrcId || !cell || cell.dataset.bankId === dragSrcId) return;

        var banks    = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
        var breaks   = type === 'kf' ? currentConfig.kfRowBreaks : currentConfig.layRowBreaks;
        var srcIdx   = banks.findIndex(function(b) { return b.id === dragSrcId; });
        var tgtIdx   = banks.findIndex(function(b) { return b.id === cell.dataset.bankId; });
        if (srcIdx === -1 || tgtIdx === -1) return;

        var rect     = cell.getBoundingClientRect();
        var relY     = e.clientY - rect.top;
        var relX     = e.clientX - rect.left;
        var inBottom = relY > rect.height * 0.72;
        var insertAfter = inBottom || (relX >= rect.width * 0.5);

        // Splice src out
        var srcBank = banks.splice(srcIdx, 1)[0];
        // Remove src from breaks (row-break after src is removed — position changes)
        var bIdx = breaks.indexOf(dragSrcId);
        if (bIdx !== -1) breaks.splice(bIdx, 1);

        // Recalculate tgt index after splice
        tgtIdx = banks.findIndex(function(b) { return b.id === cell.dataset.bankId; });

        var insertAt = insertAfter ? tgtIdx + 1 : tgtIdx;
        banks.splice(insertAt, 0, srcBank);

        if (inBottom) {
            // Force row break AFTER the target cell (so dragged item starts a new row)
            var tgtId = cell.dataset.bankId;
            if (breaks.indexOf(tgtId) === -1) breaks.push(tgtId);
        }

        saveConfig();
        renderAll();
    });
}
// #endregion

// ─────────────────────────────────────────────────────
// #region NARROW LAYOUT (ResizeObserver)
// ─────────────────────────────────────────────────────
(function () {
    if (typeof ResizeObserver === 'undefined') return;
    const NARROW_BP   = 80;
    const WIDE_BP     = 180;
    new ResizeObserver(function(entries) {
        var w = entries[0].contentRect.width;
        document.body.classList.toggle('narrow',    w < NARROW_BP);
        document.body.classList.toggle('bank-wide', w >= WIDE_BP);
    }).observe(document.body);
}());
// #endregion

// ─────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────
try {
    HLMColorPicker.init({
        fetchSwatches: function (cb) { fetchAELabels(cb); },
        onApply: function (targetId, hex) {
            currentConfig.bankColors[targetId] = hex;
            // Compute nearest AE label index for KF banks and check for collisions
            const isKfBank = currentConfig.kfBanks.some(b => b.id === targetId);
            if (isKfBank) {
                if (!currentConfig.bankLabelIndices) currentConfig.bankLabelIndices = {};
                const labelIdx = _nearestLabelIndex(hex);
                currentConfig.bankLabelIndices[targetId] = labelIdx;
                const collision = labelIdx > 0 && currentConfig.kfBanks.some(b =>
                    b.id !== targetId && (currentConfig.bankLabelIndices[b.id] || 0) === labelIdx
                );
                if (collision) {
                    const labelName = (_aeLabels && _aeLabels[labelIdx - 1]) ? (_aeLabels[labelIdx - 1].name || 'this color') : 'this color';
                    const host = document.getElementById('kfBody');
                    if (host) {
                        let wt = document.getElementById('kfRecallToast');
                        if (!wt) { wt = document.createElement('div'); wt.id = 'kfRecallToast'; wt.className = 'kf-recall-toast'; host.insertBefore(wt, host.firstChild); }
                        wt.className = 'kf-recall-toast kf-recall-toast--warn';
                        wt.textContent = `Two banks share the "${labelName}" keyframe color. If both tag the same property on the same layer, fuzzy matching will be used — results are less certain if keyframes have been moved.`;
                        clearTimeout(_showKfRecallToast._t);
                        _showKfRecallToast._t = setTimeout(() => { if (wt) wt.remove(); }, 7000);
                    }
                }
            }
            saveConfig();
            refreshBankIndicators();
        },
        onReset: function (targetId) {
            delete currentConfig.bankColors[targetId];
            const allBanks = [...currentConfig.kfBanks, ...currentConfig.layBanks];
            const idx = allBanks.findIndex(b => b.id === targetId);
            if (idx >= 0) currentConfig.bankColors[targetId] = BANK_PALETTE[idx % BANK_PALETTE.length];
            saveConfig();
            refreshBankIndicators();
        },
        onPreview: function (targetId, hex) {
            // Preview handled via refreshBankIndicators on apply
        }
    });
} catch(e) { console.error('[HLM] HLMColorPicker.init error:', e); }

try { loadSavedAccentColor(); } catch(e) { console.error('[HLM] loadSavedAccentColor error:', e); }

// Pre-warm AE label cache so bankLabelIndices can be computed before first capture
try { fetchAELabels(function() {}); } catch(e) {}

try { renderAll(); } catch(e) { console.error('[HLM] Boot renderAll error:', e); }

try { initTabs(); } catch(e) { console.error('[HLM] Boot initTabs error:', e); }

try {
    HLMDragDrop.init({
        sectionsContainerId : 'sectionsContainer',
        sectionIdAttr       : 'data-section-id',
        getOrder            : () => currentConfig.sectionOrder,
        onSectionDrop       : function (newOrder) {
            currentConfig.sectionOrder = newOrder;
            saveConfig();
        },
        // rowContainers / onRowDrop removed — bank cell drag handled by initBankGridDrag()
    });
    HLMDragDrop.applyOrder(currentConfig.sectionOrder);
} catch(e) { console.error('[HLM] HLMDragDrop.init error:', e); }

// Bank cell drag-drop — bind once at boot to the persistent container elements.
// Must run after boot renderAll() has created the containers.
try { initBankGridDrag('kf');  } catch(e) { console.error('[HLM] initBankGridDrag kf error:', e); }
try { initBankGridDrag('lay'); } catch(e) { console.error('[HLM] initBankGridDrag lay error:', e); }

(function() {
    try {
        var extPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        var jsxPath = extPath.replace(/\\/g, '/') + '/jsx/hostscript.jsx';
        csInterface.evalScript('$.evalFile("' + jsxPath + '")', function(res) {
            try {
                if (res && res !== 'EvalScript error.') console.log('[HLM] hostscript.jsx reloaded');
                else console.error('[HLM] hostscript.jsx reload failed:', res);
            } catch(e) { console.error('[HLM] JSX reload callback error:', e); }
        });
    } catch(e) { console.error('[HLM] JSX reload error:', e); }

    // Load PickClick host module (appended after hostscript.jsx so globals exist)
    try {
        var extPath2 = csInterface.getSystemPath(SystemPath.EXTENSION);
        var pcJsxPath = extPath2.replace(/\\/g, '/') + '/jsx/Modules/host_PICKCLICK.jsx';
        csInterface.evalScript('$.evalFile("' + pcJsxPath + '")', function(res) {
            try {
                if (res && res !== 'EvalScript error.') console.log('[HLM] host_PICKCLICK.jsx loaded');
                else console.error('[HLM] host_PICKCLICK.jsx load failed:', res);
            } catch(e) { console.error('[HLM] host_PICKCLICK.jsx load callback error:', e); }
        });
    } catch(e) { console.error('[HLM] host_PICKCLICK.jsx load error:', e); }
}());
startContextListener();
