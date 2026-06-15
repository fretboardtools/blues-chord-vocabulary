import { useState } from "react";

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEMES = {
  dark: {
    bg:"#0a0c10", surface:"#111318", surface2:"#0a0c10",
    border:"#1a1f2a", borderHi:"#252c3a",
    text:"#dde3ed", textHi:"#f0f4ff", textMid:"#b0bcc8",
    textLo:"#6b7280", textMute:"#4a5568", textDead:"#252c3a",
    badge:"#451a03", scrollBg:"#111318", scrollTh:"#1a1f2a",
  },
  light: {
    bg:"#f4f5f7", surface:"#ffffff", surface2:"#eef0f4",
    border:"#dde1e9", borderHi:"#c8cdd8",
    text:"#1a2030", textHi:"#0a0c12", textMid:"#2d3748",
    textLo:"#4a5568", textMute:"#6b7280", textDead:"#c8cdd8",
    badge:"#fef3c7", scrollBg:"#eef0f4", scrollTh:"#c8cdd8",
  },
};

// ─── Music Theory ─────────────────────────────────────────────────────────────

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLAT_DISPLAY = {"C#":"C#/Db","D#":"D#/Eb","F#":"F#/Gb","G#":"G#/Ab","A#":"A#/Bb"};
const displayNote = n => FLAT_DISPLAY[n] || n;
const addSemi = (note, n) => NOTES[(NOTES.indexOf(note) + n + 120) % 12];
const TUNING = ["E","A","D","G","B","E"]; // low→high, matches [E2,A2,D3,G3,B3,E4]
const TONE_SEMI = { R:0, b9:1, "9":2, b3:3, "#9":3, "3":4, "4":5, "11":5, b5:6, "5":7, "6":9, "13":9, b7:10 };

// ─── Chord Voicing Library ────────────────────────────────────────────────────
// frets: [E2, A2, D3, G3, B3, E4] — null = muted
// Moveable shapes use fret 1 as placeholder; getBarreFret() shifts them to root

const CHORD_SHAPES = {
  // ── I chord (dominant 7th family) ────────────────────────────────────────
  I: [
    {
      id: "dom7", name: "{R}7", label: "Dominant 7th",
      flavor: "The bread and butter of blues. That b7 is what gives blues its swagger — it shouldn't work over a major chord but it does, every time.",
      tones: "R · 3 · 5 · b7",
      voicings: {
        E_open:      { frets:[0,2,0,1,0,null],  fingers:"Open E7 — full and resonant", barre:null },
        A_open:      { frets:[null,0,2,0,2,0],   fingers:"Open A7 — bright and snappy", barre:null },
        D_open:      { frets:[null,null,0,2,1,2], fingers:"Open D7 — sweet and cutting", barre:null },
        G_open:      { frets:[3,2,0,0,0,1],      fingers:"Open G7 — warm, open sound", barre:null },
        moveable_E:  { frets:[1,3,1,2,1,1],      fingers:"Barre E7 shape — moveable to any root", barre:1 },
        moveable_A:  { frets:[null,1,3,1,3,1],   fingers:"Barre A7 shape — moveable", barre:1 },
        mid_E:       { frets:[null,null,3,4,3,null], fingers:"Mid-neck shell — R · b7 · 3 (7th pos area)", barre:null },
        jazz_shell:  { frets:[null,null,null,2,2,1], fingers:"Jazz shell voicing — 3rd string down", barre:null },
      },
    },
    {
      id: "dom9", name: "{R}9", label: "Dominant 9th",
      flavor: "Funkier and richer than a plain 7th. The 9th adds colour without losing the dominant punch. Hendrix lived here.",
      tones: "R · 3 · 5 · b7 · 9",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,2],       fingers:"E9 open — the classic Hendrix shape", barre:null },
        A_open:     { frets:[null,0,2,4,2,3],     fingers:"A9 open — fat funk sound", barre:null },
        moveable_E: { frets:[1,3,1,2,1,3],        fingers:"Barre E9 shape — full moveable voicing", barre:1 },
        moveable_A: { frets:[null,1,0,1,1,1],     fingers:"Barre A9 shape — moveable", barre:null },
        top4_9th:   { frets:[null,null,1,2,1,2],  fingers:"Compact 9th — top 4 strings, slides anywhere", barre:null },
        mid_9th:    { frets:[null,null,3,2,3,2],  fingers:"Mid-neck 9th cluster — great at 5th pos", barre:null },
        jazz_9th:   { frets:[null,null,null,3,3,4], fingers:"Jazz 9th shell — upper register", barre:null },
      },
    },
    {
      id: "dom7b9", name: "{R}7b9", label: "Dominant 7b9",
      flavor: "Darker, more tense than a plain 7th. The b9 adds menace. Great for turnarounds, endings, and moments of real drama.",
      tones: "R · 3 · 5 · b7 · b9",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,1],        fingers:"E7b9 open — dark and tense", barre:null },
        A_open:     { frets:[null,0,2,3,2,3],      fingers:"A7b9 open — very bluesy", barre:null },
        moveable_E: { frets:[1,3,1,2,1,2],         fingers:"Barre E7b9 — moveable", barre:1 },
        moveable_A: { frets:[null,1,0,1,0,1],      fingers:"Barre A7b9 — moveable", barre:null },
        dim_shape:  { frets:[null,null,1,2,1,2],   fingers:"Diminished-based 7b9 — top 4 strings", barre:null },
        jazz_7b9:   { frets:[null,null,null,2,1,2], fingers:"Jazz 7b9 shell — very compact", barre:null },
        high_7b9:   { frets:[null,null,3,4,3,4],   fingers:"High-neck 7b9 — 7th position area", barre:null },
      },
    },
    {
      id: "dom13", name: "{R}13", label: "Dominant 13th",
      flavor: "Big band, soulful blues. The 13th adds brightness and sophistication over the dominant foundation. SRV and BB King territory.",
      tones: "R · 3 · b7 · 13",
      voicings: {
        E_open:     { frets:[0,2,0,1,2,2],         fingers:"E13 open — rich and full", barre:null },
        A_open:     { frets:[null,0,2,0,2,2],       fingers:"A13 open — Stevie Ray's favourite territory", barre:null },
        moveable_E: { frets:[1,3,1,2,3,1],          fingers:"Barre E13 — moveable", barre:1 },
        moveable_A: { frets:[null,1,3,1,3,3],       fingers:"Barre A13 — moveable", barre:null },
        top4_13:    { frets:[null,null,1,2,2,2],    fingers:"Compact 13th — top 4 strings", barre:null },
        mid_13:     { frets:[null,null,3,4,4,4],    fingers:"Mid-neck 13th — 7th position area", barre:null },
        jazz_13:    { frets:[null,null,null,2,2,4], fingers:"Jazz 13th shell — 3 notes, maximum efficiency", barre:null },
      },
    },
    {
      id: "dom7_sharp9", name: "{R}7#9", label: "Dominant 7#9 (Hendrix chord)",
      flavor: "The Jimi Hendrix chord. That #9 clashes with the major 3rd for maximum tension. Purple Haze, Foxey Lady — the sound of controlled chaos.",
      tones: "R · 3 · b7 · #9",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,3],          fingers:"E7#9 open — classic Hendrix", barre:null },
        moveable_E: { frets:[1,3,1,2,1,4],        fingers:"Barre E7#9 — any key", barre:1 },
        moveable_A: { frets:[null,1,0,1,2,null],     fingers:"A7#9 moveable shape", barre:null },
        compact:    { frets:[null,null,1,2,2,3],     fingers:"Compact 7#9 — top 4 strings", barre:null },
        mid_sharp9: { frets:[null,null,3,4,4,5],    fingers:"Mid-neck 7#9 — 7th position area", barre:null },
        jazz_sharp9:{ frets:[null,null,null,2,3,3], fingers:"Jazz 7#9 shell — 3 notes", barre:null },
      },
    },
  ],

  // ── IV chord ─────────────────────────────────────────────────────────────
  IV: [
    {
      id: "dom7", name: "{R}7", label: "Dominant 7th",
      flavor: "The IV7 move is what gives 12-bar blues its fundamental 'lift'. That shift from I to IV is the engine of the whole form.",
      tones: "R · 3 · 5 · b7",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,null],       fingers:"Open E7", barre:null },
        A_open:     { frets:[null,0,2,0,2,0],        fingers:"Open A7", barre:null },
        D_open:     { frets:[null,null,0,2,1,2],     fingers:"Open D7", barre:null },
        moveable_E: { frets:[1,3,1,2,1,1],           fingers:"Barre E7 shape", barre:1 },
        moveable_A: { frets:[null,1,3,1,3,1],        fingers:"Barre A7 shape", barre:1 },
        mid_7:      { frets:[null,null,3,4,3,null],  fingers:"Mid-neck shell — clean and clear", barre:null },
        high_7:     { frets:[null,null,null,2,2,1],  fingers:"High-neck jazz shell", barre:null },
      },
    },
    {
      id: "dom9", name: "{R}9", label: "Dominant 9th",
      flavor: "Moving to IV9 instead of plain IV7 keeps the harmony interesting. The 9th adds soul without changing the function.",
      tones: "R · 3 · 5 · b7 · 9",
      voicings: {
        A_open:     { frets:[null,0,2,4,2,3],        fingers:"A9 open", barre:null },
        D_open:     { frets:[null,null,0,2,1,0],     fingers:"D9 open voicing", barre:null },
        moveable_E: { frets:[1,3,1,2,1,3],           fingers:"Barre E9 shape", barre:1 },
        moveable_A: { frets:[null,1,0,1,1,1],        fingers:"A9 barre shape", barre:null },
        top4_9th:   { frets:[null,null,1,2,1,2],     fingers:"Compact 9th — top 4 strings", barre:null },
        mid_9th:    { frets:[null,null,3,2,3,2],     fingers:"Mid-neck 9th cluster", barre:null },
      },
    },
    {
      id: "dom7sus4", name: "{R}7sus4", label: "Dominant 7sus4",
      flavor: "The 4th replaces the 3rd — suspended, unresolved. Great on the IV going back to I. Creates a moment of breathing before the resolution.",
      tones: "R · 4 · 5 · b7",
      voicings: {
        A_open:     { frets:[null,0,2,2,3,0],        fingers:"A7sus4 open — classic rock/blues", barre:null },
        E_open:     { frets:[0,2,0,2,0,0],           fingers:"E7sus4 — wide open sound", barre:null },
        D_open:     { frets:[null,null,0,2,3,3],     fingers:"D7sus4 open", barre:null },
        moveable_A: { frets:[null,1,3,3,4,1],        fingers:"A7sus4 barre shape", barre:1 },
        moveable_E: { frets:[1,3,1,3,1,1],           fingers:"E7sus4 barre shape", barre:1 },
        mid_sus4:   { frets:[null,null,3,4,4,null],  fingers:"Mid-neck sus4 — floaty", barre:null },
      },
    },
    {
      id: "dom11", name: "{R}11", label: "Dominant 11th",
      flavor: "Even more suspended than sus4 — the 11th gives the IV chord an ethereal, almost modal quality before returning to I.",
      tones: "R · b7 · 9 · 11",
      voicings: {
        A_open:     { frets:[null,0,2,0,3,0],        fingers:"A11 — open, modal sound", barre:null },
        D_open:     { frets:[null,null,0,2,3,3],     fingers:"D11 — spacious and open", barre:null },
        moveable_A: { frets:[null,1,3,1,4,1],        fingers:"A11 moveable", barre:1 },
        compact:    { frets:[null,null,1,0,1,1],     fingers:"Compact 11th voicing", barre:null },
        mid_11:     { frets:[null,null,3,0,4,3],     fingers:"Mid-neck 11th — very open", barre:null },
      },
    },
    {
      id: "dom6", name: "{R}6", label: "Dominant 6th",
      flavor: "The 6th chord has a warm, slightly nostalgic blues quality — common in slow blues, turnarounds, and endings. Deceptively simple, sounds beautiful.",
      tones: "R · 3 · 5 · 6",
      voicings: {
        A_open:     { frets:[null,0,2,2,2,2],        fingers:"A6 open — warm and inviting", barre:null },
        E_open:     { frets:[0,2,2,1,2,0],           fingers:"E6 open", barre:null },
        D_open:     { frets:[null,null,0,2,0,2],     fingers:"D6 — sweet and clear", barre:null },
        moveable_A: { frets:[null,1,3,3,3,3],        fingers:"A6 barre shape", barre:null },
        moveable_E: { frets:[1,3,3,2,3,1],           fingers:"E6 barre shape", barre:1 },
        mid_6:      { frets:[null,null,3,4,2,null],  fingers:"Mid-neck 6th — clean jazz sound", barre:null },
      },
    },
  ],

  // ── V chord ───────────────────────────────────────────────────────────────
  V: [
    {
      id: "dom7", name: "{R}7", label: "Dominant 7th",
      flavor: "The V7 is the most tense chord in the blues. That pull back to the I is the engine of blues harmony — everything builds to and releases from the V.",
      tones: "R · 3 · 5 · b7",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,null],        fingers:"Open E7", barre:null },
        A_open:     { frets:[null,0,2,0,2,0],        fingers:"Open A7", barre:null },
        B_open:     { frets:[null,2,4,2,4,2],        fingers:"B7 open — all over blues in E", barre:2 },
        moveable_E: { frets:[1,3,1,2,1,1],           fingers:"Barre E7 shape", barre:1 },
        moveable_A: { frets:[null,1,3,1,3,1],        fingers:"Barre A7 shape", barre:1 },
        mid_7:      { frets:[null,null,3,4,3,null],  fingers:"Mid-neck V7 shell — crisp turnaround shape", barre:null },
        high_7:     { frets:[null,null,null,2,2,1],  fingers:"High-neck V7 shell — jazz style", barre:null },
      },
    },
    {
      id: "dom7b9", name: "{R}7b9", label: "Dominant 7b9",
      flavor: "The V7b9 demands resolution. More tense than plain V7 — the b9 adds an edge that makes the pull back to I feel almost physical.",
      tones: "R · 3 · 5 · b7 · b9",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,1],           fingers:"E7b9 open", barre:null },
        B_shape:    { frets:[null,2,1,2,1,2],        fingers:"B7b9 barre shape", barre:null },
        moveable_E: { frets:[1,3,1,2,1,2],           fingers:"E7b9 barre — moveable", barre:1 },
        moveable_A: { frets:[null,1,0,1,0,1],        fingers:"A7b9 barre — moveable", barre:null },
        dim_based:  { frets:[null,null,1,2,1,2],     fingers:"Diminished-based 7b9 — top 4 strings", barre:null },
        high_7b9:   { frets:[null,null,3,4,3,4],     fingers:"High-neck 7b9 — nasty tension", barre:null },
      },
    },
    {
      id: "dom9", name: "{R}9", label: "Dominant 9th",
      flavor: "A V9 adds richness to the tension. Still pulls hard to the I but with more colour and sophistication. Very Chicago blues.",
      tones: "R · 3 · 5 · b7 · 9",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,2],           fingers:"E9 open", barre:null },
        B_shape:    { frets:[null,2,1,2,2,2],        fingers:"B9 barre — 2nd position", barre:null },
        moveable_A: { frets:[null,1,0,1,1,1],        fingers:"A9 barre shape", barre:null },
        compact:    { frets:[null,null,1,2,1,2],     fingers:"Compact 9th — top 4 strings", barre:null },
        mid_9th:    { frets:[null,null,3,2,3,2],     fingers:"Mid-neck 9th cluster", barre:null },
        high_9th:   { frets:[null,null,null,3,3,4],  fingers:"High-neck 9th shell", barre:null },
      },
    },
    {
      id: "dom13", name: "{R}13", label: "Dominant 13th",
      flavor: "The V13 creates maximum harmonic tension before resolving back to I. Big, bright, and demanding — very jazz-blues and soul-blues.",
      tones: "R · 3 · b7 · 13",
      voicings: {
        E_open:     { frets:[0,2,0,1,2,2],           fingers:"E13 open", barre:null },
        B_shape:    { frets:[null,2,4,2,4,4],        fingers:"B13 barre — 2nd position", barre:null },
        moveable_A: { frets:[null,1,3,1,3,3],        fingers:"A13 barre", barre:null },
        compact:    { frets:[null,null,1,2,2,2],     fingers:"Compact V13 — top 4 strings", barre:null },
        jazz_13:    { frets:[null,null,null,2,2,4],  fingers:"Jazz 13th shell — 3 notes", barre:null },
        high_13:    { frets:[null,null,3,4,4,4],     fingers:"High-neck 13th — 7th position", barre:null },
      },
    },
    {
      id: "dom7_sharp9", name: "{R}7#9", label: "Dominant 7#9",
      flavor: "The Hendrix chord as a V — devastating tension before the I resolution. The most dramatic turnaround sound possible.",
      tones: "R · 3 · b7 · #9",
      voicings: {
        E_open:     { frets:[0,2,0,1,0,3],           fingers:"E7#9 open", barre:null },
        B_shape:    { frets:[null,2,1,2,3,null],     fingers:"B7#9 barre — 2nd position", barre:null },
        moveable_E: { frets:[1,3,1,2,1,4],        fingers:"Moveable E7#9 barre", barre:1 },
        moveable_A: { frets:[null,1,0,1,2,null],     fingers:"A7#9 moveable", barre:null },
        compact:    { frets:[null,null,1,2,2,3],     fingers:"Compact 7#9 — top 4 strings", barre:null },
        high_s9:    { frets:[null,null,3,4,4,5],     fingers:"High-neck 7#9 — intense", barre:null },
      },
    },
  ],

  // ── Minor i chord ─────────────────────────────────────────────────────────
  im: [
    {
      id: "min7", name: "{R}m7", label: "Minor 7th",
      flavor: "The foundation of minor blues. Cool, dark, and melancholy — think Thrill Is Gone, The Sky Is Crying. That b3 against the b7 is the sound of the blues at its most emotional.",
      tones: "R · b3 · 5 · b7",
      voicings: {
        Am_open:    { frets:[null,0,2,0,1,0],        fingers:"Am7 open — essential minor blues chord", barre:null },
        Em_open:    { frets:[0,2,2,0,3,0],           fingers:"Em7 open — dark and resonant", barre:null },
        Dm_open:    { frets:[null,null,0,2,1,1],     fingers:"Dm7 open", barre:null },
        moveable_E: { frets:[1,3,1,1,1,null],        fingers:"Barre Em7 shape — moveable", barre:1 },
        moveable_A: { frets:[null,1,3,1,2,1],        fingers:"Barre Am7 shape — moveable", barre:1 },
        mid_m7:     { frets:[null,null,3,4,3,null],  fingers:"Mid-neck minor shell — 7th position", barre:null },
        jazz_m7:    { frets:[null,null,null,3,2,1],  fingers:"Jazz minor shell — top 3 strings", barre:null },
      },
    },
    {
      id: "min9", name: "{R}m9", label: "Minor 9th",
      flavor: "Lush and soulful — the 9th opens up the minor chord. Very common in slow minor blues and neo-soul. The 9th adds an airy quality that the plain m7 lacks.",
      tones: "R · b3 · 5 · b7 · 9",
      voicings: {
        Am_open:    { frets:[null,0,2,4,1,3],        fingers:"Am9 open — neo-soul minor blues", barre:null },
        Em_open:    { frets:[0,2,0,0,0,2],           fingers:"Em9 open — beautiful and spacious", barre:null },
        moveable_E: { frets:[1,3,1,1,1,3],           fingers:"Moveable Em9 shape", barre:1 },
        compact:    { frets:[null,null,1,2,1,2],     fingers:"Compact m9 — top 4 strings", barre:null },
        mid_m9:     { frets:[null,null,3,4,3,5],     fingers:"Mid-neck m9 — 7th position area", barre:null },
      },
    },
    {
      id: "min7b5", name: "{R}m7b5", label: "Half-Diminished (m7b5)",
      flavor: "Extremely dark and tense. Used as the i chord in more advanced minor blues and jazz-blues. That b5 adds a dissonance that plain m7 doesn't have.",
      tones: "R · b3 · b5 · b7",
      voicings: {
        Am_shape:   { frets:[null,0,1,0,1,null],        fingers:"Am7b5 open — haunting", barre:null },
        Em_shape:   { frets:[0,1,2,0,3,0],           fingers:"Em7b5 open", barre:null },
        moveable_A: { frets:[null,1,2,3,2,null],     fingers:"Moveable m7b5", barre:null },
        moveable_E: { frets:[1,2,1,1,null,null],        fingers:"E shape m7b5 moveable", barre:null },
        mid_hd:     { frets:[null,null,3,4,2,null],  fingers:"Mid-neck half-dim — compact", barre:null },
        high_hd:    { frets:[null,null,null,3,2,3],  fingers:"High-neck half-dim shell", barre:null },
      },
    },
    {
      id: "min11", name: "{R}m11", label: "Minor 11th",
      flavor: "Modal and spacious — the 11th (perfect 4th) floats above the minor 7th. Creates atmosphere in slow, dark minor blues. Very Dorian.",
      tones: "R · b3 · b7 · 9 · 11",
      voicings: {
        Am_open:    { frets:[null,0,2,0,3,0],        fingers:"Am11 — Dorian flavour, very open", barre:null },
        Em_open:    { frets:[0,2,0,2,0,0],           fingers:"Em11 — very open, all strings ring", barre:null },
        Dm_open:    { frets:[null,null,0,2,1,3],     fingers:"Dm11 — rich minor sound", barre:null },
        mid_m11:    { frets:[null,null,3,0,3,3],     fingers:"Mid-neck m11 — open-string trick", barre:null },
      },
    },
    {
      id: "min6", name: "{R}m6", label: "Minor 6th",
      flavor: "The minor 6th has a bittersweet, slightly eerie quality — classic in jazz-blues and slow blues endings. That natural 6th over a minor chord is unexpectedly beautiful.",
      tones: "R · b3 · 5 · 6",
      voicings: {
        Am_open:    { frets:[null,0,2,2,1,2],        fingers:"Am6 — bittersweet and distinctive", barre:null },
        Em_open:    { frets:[0,2,2,0,2,0],           fingers:"Em6 open", barre:null },
        Dm_open:    { frets:[null,null,0,2,0,1],     fingers:"Dm6 — sweet and dark", barre:null },
        moveable_A: { frets:[null,1,3,3,2,3],        fingers:"Moveable m6 barre", barre:1 },
        moveable_E: { frets:[1,3,3,1,3,1],        fingers:"E shape m6 — moveable", barre:1 },
        high_m6:    { frets:[null,null,3,4,2,3],     fingers:"High-neck m6 — jazz flavour", barre:null },
      },
    },
  ],

  // ── IVm chord ─────────────────────────────────────────────────────────────
  IVm: [
    {
      id: "min7", name: "{R}m7", label: "Minor 7th",
      flavor: "The heart of minor blues harmony. Moving from im7 to IVm7 is one of the most soulful movements in all of music — pure emotional release.",
      tones: "R · b3 · 5 · b7",
      voicings: {
        Am_open:    { frets:[null,0,2,0,1,0],        fingers:"Am7 open shape", barre:null },
        Dm_open:    { frets:[null,null,0,2,1,1],     fingers:"Dm7 open", barre:null },
        moveable_A: { frets:[null,1,3,1,2,1],        fingers:"Barre Am7 shape", barre:1 },
        moveable_E: { frets:[1,3,1,1,1,null],        fingers:"Barre Em7 shape", barre:1 },
        mid_m7:     { frets:[null,null,3,4,3,null],  fingers:"Mid-neck minor shell", barre:null },
        jazz_m7:    { frets:[null,null,null,3,2,1],  fingers:"Jazz minor shell — top 3 strings", barre:null },
      },
    },
    {
      id: "min9", name: "{R}m9", label: "Minor 9th",
      flavor: "IVm9 is an instant sophistication upgrade — same darkness as m7, more colour. The 9th opens the chord up beautifully.",
      tones: "R · b3 · 5 · b7 · 9",
      voicings: {
        Dm_open:    { frets:[null,null,0,2,1,0],     fingers:"Dm9 open", barre:null },
        Am_open:    { frets:[null,0,2,4,1,3],        fingers:"Am9 open shape", barre:null },
        compact:    { frets:[null,null,1,2,1,2],     fingers:"Compact minor 9th", barre:null },
        mid_m9:     { frets:[null,null,3,4,3,5],     fingers:"Mid-neck m9 — rich", barre:null },
      },
    },
    {
      id: "dom7", name: "{R}7", label: "Dominant 7th (IV as dom7)",
      flavor: "In some minor blues, the IVm becomes a IV dominant 7th — adding tension and drama before returning to the im. Aggressive and effective.",
      tones: "R · 3 · 5 · b7",
      voicings: {
        D_open:     { frets:[null,null,0,2,1,2],     fingers:"D7 open", barre:null },
        A_open:     { frets:[null,0,2,0,2,0],        fingers:"A7 open", barre:null },
        moveable_A: { frets:[null,1,3,1,3,1],        fingers:"A7 barre shape", barre:1 },
        moveable_E: { frets:[1,3,1,2,1,1],           fingers:"E7 barre shape", barre:1 },
        mid_7:      { frets:[null,null,3,4,3,null],  fingers:"Mid-neck shell", barre:null },
        high_7:     { frets:[null,null,null,2,2,1],  fingers:"High-neck jazz shell", barre:null },
      },
    },
    {
      id: "min11", name: "{R}m11", label: "Minor 11th",
      flavor: "The IVm11 creates a suspended, floating quality before resolving back to the im7. The perfect 4th over the minor chord is completely at home here.",
      tones: "R · b3 · b7 · 9 · 11",
      voicings: {
        Dm_open:    { frets:[null,null,0,2,1,3],     fingers:"Dm11 open", barre:null },
        Am_open:    { frets:[null,0,2,0,3,0],        fingers:"Am11 open", barre:null },
        compact:    { frets:[null,null,0,0,1,1],     fingers:"Open m11 cluster", barre:null },
        mid_m11:    { frets:[null,null,3,0,3,3],     fingers:"Mid-neck m11 — open trick", barre:null },
      },
    },
    {
      id: "min6", name: "{R}m6", label: "Minor 6th",
      flavor: "The IVm6 has a haunting quality — very effective in slow, atmospheric minor blues. A natural 6th over a minor chord is unexpectedly eerie.",
      tones: "R · b3 · 5 · 6",
      voicings: {
        Dm_open:    { frets:[null,null,0,2,0,1],     fingers:"Dm6 open — haunting", barre:null },
        Am_open:    { frets:[null,0,2,2,1,2],        fingers:"Am6 open", barre:null },
        moveable_A: { frets:[null,1,3,3,2,3],        fingers:"Moveable m6 barre", barre:1 },
        compact:    { frets:[null,null,1,2,2,0],     fingers:"Compact m6 voicing", barre:null },
        high_m6:    { frets:[null,null,3,4,2,3],     fingers:"High-neck m6 — jazz flavour", barre:null },
      },
    },
  ],
};

// ─── Blues Forms ──────────────────────────────────────────────────────────────
// bar label: just the suffix after the role (e.g. "7", "m7") — root gets prepended in render

const BLUES_FORMS = {
  standard_12: {
    name: "Standard 12-Bar",
    description: "The classic. Three dominant 7th chords, 12 bars. The foundation everything else is built on.",
    bars: [
      {bar:1,  role:"I",  suffix:"7"},
      {bar:2,  role:"I",  suffix:"7"},
      {bar:3,  role:"I",  suffix:"7"},
      {bar:4,  role:"I",  suffix:"7"},
      {bar:5,  role:"IV", suffix:"7"},
      {bar:6,  role:"IV", suffix:"7"},
      {bar:7,  role:"I",  suffix:"7"},
      {bar:8,  role:"I",  suffix:"7"},
      {bar:9,  role:"V",  suffix:"7"},
      {bar:10, role:"IV", suffix:"7"},
      {bar:11, role:"I",  suffix:"7"},
      {bar:12, role:"V",  suffix:"7", annotation:"Turnaround"},
    ],
  },
  quick_change_12: {
    name: "Quick-Change 12-Bar",
    description: "The IV chord appears in bar 2 — more movement, more interest. Very common in Chicago blues and jump blues.",
    bars: [
      {bar:1,  role:"I",  suffix:"7"},
      {bar:2,  role:"IV", suffix:"7", annotation:"Quick change"},
      {bar:3,  role:"I",  suffix:"7"},
      {bar:4,  role:"I",  suffix:"7"},
      {bar:5,  role:"IV", suffix:"7"},
      {bar:6,  role:"IV", suffix:"7"},
      {bar:7,  role:"I",  suffix:"7"},
      {bar:8,  role:"I",  suffix:"7"},
      {bar:9,  role:"V",  suffix:"7"},
      {bar:10, role:"IV", suffix:"7"},
      {bar:11, role:"I",  suffix:"7"},
      {bar:12, role:"V",  suffix:"7", annotation:"Turnaround"},
    ],
  },
  minor_12: {
    name: "Minor Blues (12-Bar)",
    description: "Minor i and iv chords throughout, with a dominant V in bars 9 and 12. Darker and more dramatic — Thrill Is Gone, The Sky Is Crying.",
    bars: [
      {bar:1,  role:"im",  suffix:"m7"},
      {bar:2,  role:"im",  suffix:"m7"},
      {bar:3,  role:"im",  suffix:"m7"},
      {bar:4,  role:"im",  suffix:"m7"},
      {bar:5,  role:"IVm", suffix:"m7"},
      {bar:6,  role:"IVm", suffix:"m7"},
      {bar:7,  role:"im",  suffix:"m7"},
      {bar:8,  role:"im",  suffix:"m7"},
      {bar:9,  role:"V",   suffix:"7"},
      {bar:10, role:"IVm", suffix:"m7"},
      {bar:11, role:"im",  suffix:"m7"},
      {bar:12, role:"V",   suffix:"7", annotation:"Turnaround"},
    ],
  },
  eight_bar: {
    name: "8-Bar Blues",
    description: "Shorter and more urgent. The V appears in bar 4 — earlier than usual, which changes the whole feel. Key to the Highway, Worried Life Blues.",
    bars: [
      {bar:1,  role:"I",  suffix:"7"},
      {bar:2,  role:"IV", suffix:"7"},
      {bar:3,  role:"I",  suffix:"7"},
      {bar:4,  role:"V",  suffix:"7", annotation:"Early V"},
      {bar:5,  role:"IV", suffix:"7"},
      {bar:6,  role:"IV", suffix:"7"},
      {bar:7,  role:"I",  suffix:"7"},
      {bar:8,  role:"V",  suffix:"7", annotation:"Turnaround"},
    ],
  },
  slow_blues_12: {
    name: "Slow Blues (12-Bar)",
    description: "Each chord gets two bars instead of one in the first four bars — more space, more time to phrase. The IV in bar 2 (slow change) is the defining feature.",
    bars: [
      {bar:1,  role:"I",  suffix:"7"},
      {bar:2,  role:"I",  suffix:"7"},
      {bar:3,  role:"IV", suffix:"7", annotation:"Slow change"},
      {bar:4,  role:"IV", suffix:"7"},
      {bar:5,  role:"I",  suffix:"7"},
      {bar:6,  role:"I",  suffix:"7"},
      {bar:7,  role:"V",  suffix:"7"},
      {bar:8,  role:"IV", suffix:"7"},
      {bar:9,  role:"I",  suffix:"7"},
      {bar:10, role:"I",  suffix:"7"},
      {bar:11, role:"V",  suffix:"7"},
      {bar:12, role:"V",  suffix:"7", annotation:"Turnaround"},
    ],
  },
  jazz_blues_12: {
    name: "Jazz Blues (12-Bar)",
    description: "Richer chord substitutions — IV7 in bar 2, IVm in bar 6, and a ii–V–I turnaround. Common in bebop and jazz-blues. More movement, more colour.",
    bars: [
      {bar:1,  role:"I",  suffix:"7"},
      {bar:2,  role:"IV", suffix:"7", annotation:"Jazz sub"},
      {bar:3,  role:"I",  suffix:"7"},
      {bar:4,  role:"I",  suffix:"7"},
      {bar:5,  role:"IV", suffix:"7"},
      {bar:6,  role:"IVm",suffix:"m7", annotation:"IVm sub"},
      {bar:7,  role:"I",  suffix:"7"},
      {bar:8,  role:"I",  suffix:"7"},
      {bar:9,  role:"V",  suffix:"7"},
      {bar:10, role:"IV", suffix:"7"},
      {bar:11, role:"I",  suffix:"7"},
      {bar:12, role:"V",  suffix:"7", annotation:"Turnaround"},
    ],
  },
  sixteen_bar: {
    name: "16-Bar Blues",
    description: "A longer form with more time on the I chord before the IV move. Used in Sweet Home Chicago, Rollin' and Tumblin'. Feels more expansive.",
    bars: [
      {bar:1,  role:"I",  suffix:"7"},
      {bar:2,  role:"I",  suffix:"7"},
      {bar:3,  role:"I",  suffix:"7"},
      {bar:4,  role:"I",  suffix:"7"},
      {bar:5,  role:"I",  suffix:"7"},
      {bar:6,  role:"I",  suffix:"7"},
      {bar:7,  role:"I",  suffix:"7"},
      {bar:8,  role:"I",  suffix:"7"},
      {bar:9,  role:"IV", suffix:"7"},
      {bar:10, role:"IV", suffix:"7"},
      {bar:11, role:"I",  suffix:"7"},
      {bar:12, role:"I",  suffix:"7"},
      {bar:13, role:"V",  suffix:"7"},
      {bar:14, role:"IV", suffix:"7"},
      {bar:15, role:"I",  suffix:"7"},
      {bar:16, role:"V",  suffix:"7", annotation:"Turnaround"},
    ],
  },
  minor_8: {
    name: "Minor Blues (8-Bar)",
    description: "Shorter and more tense than 12-bar minor. The V appears in bar 4, which makes the form feel urgent and compressed.",
    bars: [
      {bar:1,  role:"im",  suffix:"m7"},
      {bar:2,  role:"IVm", suffix:"m7"},
      {bar:3,  role:"im",  suffix:"m7"},
      {bar:4,  role:"V",   suffix:"7", annotation:"Early V"},
      {bar:5,  role:"IVm", suffix:"m7"},
      {bar:6,  role:"IVm", suffix:"m7"},
      {bar:7,  role:"im",  suffix:"m7"},
      {bar:8,  role:"V",   suffix:"7", annotation:"Turnaround"},
    ],
  },
};

// Role colours
const ROLE_COLORS = {
  I:   "#F59E0B",
  IV:  "#06B6D4",
  V:   "#EF4444",
  im:  "#6366F1",
  IVm: "#8B5CF6",
};

const ROLE_LABELS = { I:"I (Tonic)", IV:"IV (Subdominant)", V:"V (Dominant)", im:"i (Minor Tonic)", IVm:"iv (Minor Sub)" };

// ─── Chord Diagram Component ──────────────────────────────────────────────────

function ChordDiagram({ frets, barre, rootFret, accentColor, T, isDark }) {
  const STRINGS = 6;
  const FRET_ROWS = 4;
  const W = 28, H = 26, PAD = 14;
  const totalW = PAD*2 + (STRINGS-1)*W;
  const totalH = PAD*2 + FRET_ROWS*H + 10;

  // Find min/max frets to determine what window to show
  const activeFrets = frets.filter(f => f !== null && f > 0);
  const minFret = barre ? barre : (activeFrets.length ? Math.max(1, Math.min(...activeFrets)) : 1);
  const showNut = minFret <= 1;
  const fretOffset = showNut ? 0 : minFret - 1;

  return (
    <svg width={totalW} height={totalH} style={{ display:"block", overflow:"visible" }}>
      {/* Fret position label if not at nut */}
      {!showNut && (
        <text x={PAD - 8} y={PAD + H/2 + 4} textAnchor="end" fontSize="9" fill={T.textMute} fontFamily="'JetBrains Mono',monospace">{minFret}fr</text>
      )}

      {/* Nut */}
      {showNut && (
        <rect x={PAD} y={PAD - 3} width={(STRINGS-1)*W} height={4} fill={isDark?"#8899aa":"#5a6478"} rx={1}/>
      )}

      {/* Fret lines */}
      {Array.from({length:FRET_ROWS+1},(_,i) => (
        <line key={i} x1={PAD} y1={PAD+i*H} x2={PAD+(STRINGS-1)*W} y2={PAD+i*H} stroke={T.fretBar} strokeWidth={i===0&&showNut?0:1}/>
      ))}

      {/* String lines */}
      {Array.from({length:STRINGS},(_,i) => (
        <line key={i} x1={PAD+i*W} y1={PAD} x2={PAD+i*W} y2={PAD+FRET_ROWS*H} stroke={isDark?"#334155":"#c8cdd8"} strokeWidth={i===0||i===5?1:1.5}/>
      ))}

      {/* Barre */}
      {barre && (
        <rect x={PAD} y={PAD + (barre - fretOffset - 1)*H + H/2 - 8} width={(STRINGS-1)*W} height={16} rx={8} fill={accentColor} opacity={0.85}/>
      )}

      {/* Dots */}
      {frets.map((f, si) => {
        const x = PAD + si * W;
        if (f === null) {
          return <text key={si} x={x} y={PAD - 10} textAnchor="middle" fontSize="11" fill={T.textMute} fontFamily="sans-serif">×</text>;
        }
        if (f === 0 || f === -1) {
          return <circle key={si} cx={x} cy={PAD - 10} r={4} fill="none" stroke={T.textMute} strokeWidth={1.5}/>;
        }
        const row = f - fretOffset;
        if (row < 1 || row > FRET_ROWS) return null;
        const y = PAD + (row - 1)*H + H/2;
        const isRoot = f === rootFret || (barre && f === barre && si === 0);
        return (
          <circle key={si} cx={x} cy={y} r={9} fill={accentColor} opacity={isRoot?1:0.75}/>
        );
      })}
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function BluesChordVocab() {
  const [selectedKey,        setSelectedKey]        = useState("A");
  const [selectedForm,       setSelectedForm]       = useState("standard_12");
  const [selectedBar,        setSelectedBar]        = useState(0);
  const [selectedChord,      setSelectedChord]      = useState(0);
  const [selectedVoicingKey, setSelectedVoicingKey] = useState(null); // null = auto
  const [isDark,             setIsDark]             = useState(false);

  const T = isDark ? THEMES.dark : THEMES.light;

  const form     = BLUES_FORMS[selectedForm];
  const bar      = form.bars[selectedBar];
  const role     = bar.role;
  const variants = CHORD_SHAPES[role] || [];
  const variant  = variants[selectedChord] || variants[0];
  const accentColor = ROLE_COLORS[role];

  // Compute actual root note for this role and key
  const roleRootSemis = { I:0, IV:5, V:7, im:0, IVm:5 };
  const chordRoot = addSemi(selectedKey, roleRootSemis[role]);
  const chordName = (variant?.name || "").replace("{R}", chordRoot);

  // ── Voicing relevance ──────────────────────────────────────────────────────
  // Pitch classes that make up THIS chord at its actual root.
  const targetPCs = (() => {
    const ri = NOTES.indexOf(chordRoot);
    const set = new Set();
    const toks = (variant?.tones || "").split("·").map(s => s.trim());
    toks.forEach(tok => {
      if (tok in TONE_SEMI) set.add((ri + TONE_SEMI[tok] + 120) % 12);
    });
    // a natural perfect 5th is implied in these voicings unless the chord names an altered 5th
    if (!toks.includes("b5")) set.add((ri + 7) % 12);
    return set;
  })();

  // Keep a voicing only if it transposes (a moveable barre shape) or its literal
  // notes actually spell this chord at this root — every note a chord tone, root present.
  const isRelevantVoicing = (shape, data) => {
    if (shape.startsWith("moveable")) return true;
    const ri = NOTES.indexOf(chordRoot);
    let hasRoot = false, allTones = true, played = 0;
    data.frets.forEach((f, i) => {
      if (f === null || f < 0) return;
      played++;
      const pc = (NOTES.indexOf(TUNING[i]) + f + 120) % 12;
      if (pc === ri) hasRoot = true;
      if (!targetPCs.has(pc)) allTones = false;
    });
    return played > 0 && allTones && hasRoot;
  };

  // Auto-pick the best voicing for this root
  const getAutoVoicing = (voicings) => {
    const openShapes = { E_open:["E","F","F#","G#"], A_open:["A","A#","B"], D_open:["D","D#"], G_open:["G","G#"], Am_open:["A","A#","B"], Em_open:["E","F","F#","G#"], Dm_open:["D","D#"], B_open:["B"], B_shape:["B"] };
    for (const [shape, keys] of Object.entries(openShapes)) {
      if (keys.includes(chordRoot) && voicings[shape]) return { key:shape, data:voicings[shape] };
    }
    for (const shape of ["moveable_A","moveable_E","compact"]) {
      if (voicings[shape]) return { key:shape, data:voicings[shape] };
    }
    return { key: Object.keys(voicings)[0], data: Object.values(voicings)[0] };
  };

  const relevantVoicings = variant
    ? Object.entries(variant.voicings).filter(([s, d]) => isRelevantVoicing(s, d))
    : [];
  const autoKey = variant ? getAutoVoicing(variant.voicings).key : null;
  // Never show an empty list; fall back to the auto pick if nothing matched.
  const displayVoicings = relevantVoicings.length
    ? relevantVoicings
    : (autoKey ? [[autoKey, variant.voicings[autoKey]]] : []);
  const defaultKey = displayVoicings.length ? displayVoicings[0][0] : null;

  // Use the manual selection only while it's still relevant; otherwise default.
  const voicingKey = (selectedVoicingKey && displayVoicings.some(([s]) => s === selectedVoicingKey))
    ? selectedVoicingKey
    : defaultKey;
  const voicing = variant && voicingKey
    ? { key: voicingKey, data: variant.voicings[voicingKey] }
    : null;

  // Compute barre fret for moveable shapes — relative to the shape's base string
  const getBarreFret = () => {
    if (!voicing) return null;
    const shape = voicing.key;
    const base = shape === "moveable_E" ? "E" : shape === "moveable_A" ? "A" : null;
    if (base) {
      const b = (NOTES.indexOf(chordRoot) - NOTES.indexOf(base) + 12) % 12;
      return b === 0 ? 12 : b;   // keep it a fretted barre rather than fret 0
    }
    if (shape === "B_shape") return 2;
    return null;
  };

  const computedFrets = () => {
    if (!voicing) return [null,null,null,null,null,null];
    const raw = [...voicing.data.frets];
    const shape = voicing.key;
    if (!shape.startsWith("moveable")) return raw;   // open/fixed shapes render literally
    const barreFret = getBarreFret();
    if (barreFret == null) return raw;
    return raw.map(f => (f === null ? null : f - 1 + barreFret)); // raw barre sits at fret 1
  };

  const finalFrets = computedFrets();
  const barreFret = getBarreFret();

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif", padding:"24px 18px 48px", transition:"background 0.2s,color 0.2s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing:border-box; } button { cursor:pointer; font-family:inherit; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        ::-webkit-scrollbar { height:5px; width:5px; background:${T.scrollBg}; }
        ::-webkit-scrollbar-thumb { background:${T.scrollTh}; border-radius:3px; }
      `}</style>

      <div style={{ maxWidth:"900px", margin:"0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:"22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"baseline", gap:"10px", marginBottom:"4px" }}>
              <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(22px,5vw,34px)", fontWeight:"700", margin:0, color:T.textHi, letterSpacing:"-0.5px" }}>Blues Chord Vocabulary</h1>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"#F59E0B", background:T.badge, padding:"2px 7px", borderRadius:"4px", letterSpacing:"1px" }}>UNLOCK THE GUITAR</span>
            </div>
            <p style={{ color:T.textMute, fontSize:"13px", margin:0 }}>5 chord options for every position across 8 blues forms. Tap a bar, choose a chord, then cycle through every available voicing — open, barre, mid-neck and upper register.</p>
          </div>
          <button onClick={() => setIsDark(d=>!d)} style={{ flexShrink:0, padding:"8px 14px", borderRadius:"20px", border:`1.5px solid ${T.border}`, background:T.surface, color:T.textMid, fontSize:"13px", display:"flex", alignItems:"center", gap:"6px", transition:"all 0.15s", whiteSpace:"nowrap" }}>
            <span style={{ fontSize:"16px" }}>{isDark?"☀️":"🌙"}</span>
            <span style={{ fontSize:"11px", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.5px" }}>{isDark?"Light":"Dark"}</span>
          </button>
        </div>

        {/* ── Key + Form selectors ── */}
        <div style={{ background:T.surface, borderRadius:"14px", padding:"18px", border:`1px solid ${T.border}`, marginBottom:"12px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"20px" }}>

            {/* Key */}
            <div>
              <SL T={T}>KEY</SL>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                {NOTES.map(n => (
                  <button key={n} onClick={() => setSelectedKey(n)} style={{
                    padding:"5px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:"700",
                    fontFamily:"'JetBrains Mono',monospace",
                    border: selectedKey===n ? `2px solid #F59E0B` : `2px solid ${T.border}`,
                    background: selectedKey===n ? (isDark?"#451a03":"#fef3c7") : T.surface2,
                    color: selectedKey===n ? "#F59E0B" : T.textMute,
                    transition:"all 0.1s",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div>
              <SL T={T}>BLUES FORM</SL>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {Object.entries(BLUES_FORMS).map(([id, f]) => (
                  <button key={id} onClick={() => { setSelectedForm(id); setSelectedBar(0); setSelectedChord(0); }} style={{
                    padding:"7px 13px", borderRadius:"8px", fontSize:"12px", fontWeight:"600",
                    border: selectedForm===id ? `1.5px solid #F59E0B` : `1.5px solid ${T.border}`,
                    background: selectedForm===id ? (isDark?"#451a03":"#fef3c7") : T.surface2,
                    color: selectedForm===id ? "#F59E0B" : T.textMute,
                    transition:"all 0.1s",
                  }}>{f.name}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Form description */}
          <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${T.border}`, fontSize:"12px", color:T.textLo, fontStyle:"italic" }}>
            {form.description}
          </div>
        </div>

        {/* ── Bar grid ── */}
        <div style={{ background:T.surface, borderRadius:"14px", padding:"18px", border:`1px solid ${T.border}`, marginBottom:"12px" }}>
          <SL T={T}>TAP A BAR TO EXPLORE CHORD OPTIONS</SL>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
            {form.bars.map((b, i) => {
              const isActive = selectedBar === i;
              const col = ROLE_COLORS[b.role];
              const rootForBar = addSemi(selectedKey, roleRootSemis[b.role]);
              return (
                <button key={i} onClick={() => { setSelectedBar(i); setSelectedChord(0); setSelectedVoicingKey(null); }} style={{
                  padding:"10px 10px 8px",
                  borderRadius:"10px",
                  border: isActive ? `2px solid ${col}` : `1.5px solid ${T.border}`,
                  background: isActive ? `${col}20` : T.surface2,
                  minWidth:"58px",
                  textAlign:"center",
                  transition:"all 0.12s",
                  animation: isActive ? "popIn 0.15s ease" : "none",
                }}>
                  <div style={{ fontSize:"9px", color: isActive ? col : T.textMute, fontFamily:"'JetBrains Mono',monospace", marginBottom:"2px" }}>Bar {b.bar}</div>
                  <div style={{ fontSize:"14px", fontWeight:"700", fontFamily:"'Instrument Serif',serif", fontStyle:"italic", color: isActive ? col : T.textMid, lineHeight:1.2 }}>{rootForBar}{b.suffix}</div>
                  <div style={{ fontSize:"8px", color: isActive ? `${col}cc` : T.textDead, fontFamily:"'JetBrains Mono',monospace", marginTop:"3px", letterSpacing:"0.3px" }}>{b.role}</div>
                  {b.annotation && <div style={{ fontSize:"8px", color:"#F59E0B", fontFamily:"'JetBrains Mono',monospace", marginTop:"2px" }}>{b.annotation}</div>}
                </button>
              );
            })}
          </div>

          {/* Role legend */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${T.border}` }}>
            {Object.entries(ROLE_COLORS).map(([role, col]) => (
              <div key={role} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:col, flexShrink:0 }}/>
                <span style={{ fontSize:"10px", color:T.textMute, fontFamily:"'JetBrains Mono',monospace" }}>{ROLE_LABELS[role]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chord variant selector ── */}
        <div style={{ background:T.surface, borderRadius:"14px", padding:"18px", border:`1px solid ${T.border}`, marginBottom:"12px" }}>
          <SL T={T}>CHORD OPTIONS FOR BAR {bar.bar} ({ROLE_LABELS[role]})</SL>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:variant?"14px":"0" }}>
            {variants.map((v, i) => {
              const isActive = selectedChord === i;
              const name = v.name.replace("{R}", chordRoot);
              return (
                <button key={i} onClick={() => { setSelectedChord(i); setSelectedVoicingKey(null); }} style={{
                  padding:"8px 14px", borderRadius:"9px",
                  border: isActive ? `1.5px solid ${accentColor}` : `1.5px solid ${T.border}`,
                  background: isActive ? `${accentColor}18` : T.surface2,
                  color: isActive ? accentColor : T.textMute,
                  transition:"all 0.1s",
                  textAlign:"left",
                }}>
                  <div style={{ fontSize:"14px", fontWeight:"700", fontFamily:"'Instrument Serif',serif", fontStyle:"italic", color: isActive ? accentColor : T.textMid }}>{name}</div>
                  <div style={{ fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", color: isActive ? `${accentColor}99` : T.textMute, marginTop:"1px" }}>{v.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chord detail card ── */}
        {variant && voicing && (
          <div style={{ background:T.surface, borderRadius:"14px", padding:"20px", border:`1px solid ${accentColor}44`, animation:"fadeUp 0.2s ease" }}>

            {/* Chord name header */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"18px", flexWrap:"wrap" }}>
              <div style={{
                fontFamily:"'Instrument Serif',serif", fontStyle:"italic",
                fontSize:"36px", fontWeight:"400",
                color:accentColor, lineHeight:1,
              }}>{chordName}</div>
              <div>
                <div style={{ fontSize:"13px", fontWeight:"600", color:T.textMid, marginBottom:"2px" }}>{variant.label}</div>
                <div style={{ fontSize:"10px", fontFamily:"'JetBrains Mono',monospace", color:`${accentColor}cc`, background:`${accentColor}15`, padding:"2px 8px", borderRadius:"4px", display:"inline-block" }}>{variant.tones}</div>
              </div>
            </div>

            {/* Diagram + description layout */}
            <div style={{ display:"flex", gap:"20px", flexWrap:"wrap", alignItems:"flex-start" }}>

              {/* Chord diagram */}
              <div style={{ flexShrink:0 }}>
                <div style={{ fontSize:"10px", color:T.textMute, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"1px", marginBottom:"8px" }}>VOICING</div>
                <div style={{ background:T.surface2, borderRadius:"10px", padding:"14px 16px", border:`1px solid ${T.border}`, display:"inline-block" }}>
                  <ChordDiagram frets={finalFrets} barre={barreFret} rootFret={barreFret||Math.max(0,...finalFrets.filter(f=>f!==null&&f>=0))} accentColor={accentColor} T={T} isDark={isDark}/>
                  <div style={{ marginTop:"8px", fontSize:"11px", color:T.textLo, fontFamily:"'JetBrains Mono',monospace", textAlign:"center", maxWidth:"160px" }}>{voicing?.data?.fingers}</div>
                </div>
              </div>

              {/* Description + context */}
              <div style={{ flex:1, minWidth:"200px" }}>
                <div style={{ fontSize:"10px", color:T.textMute, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"1px", marginBottom:"8px" }}>WHY IT WORKS</div>
                <p style={{ fontSize:"14px", lineHeight:"1.75", color:T.textMid, margin:"0 0 14px", fontStyle:"italic" }}>
                  {variant.flavor}
                </p>

                {/* Context — where in progression */}
                <div style={{ padding:"10px 14px", background:T.surface2, borderRadius:"8px", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:"10px", fontFamily:"'JetBrains Mono',monospace", color:T.textMute, letterSpacing:"1px", marginBottom:"6px" }}>IN CONTEXT</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                    {form.bars.map((b, i) => {
                      const rootForBar = addSemi(selectedKey, roleRootSemis[b.role]);
                      const isCurrent = i === selectedBar;
                      const col = ROLE_COLORS[b.role];
                      return (
                        <div key={i} style={{
                          padding:"3px 7px", borderRadius:"5px", fontSize:"10px",
                          fontFamily:"'JetBrains Mono',monospace", fontWeight: isCurrent?"700":"400",
                          background: isCurrent ? `${col}22` : T.surface,
                          color: isCurrent ? col : T.textDead,
                          border: isCurrent ? `1px solid ${col}66` : `1px solid ${T.border}`,
                        }}>{rootForBar}{b.suffix}</div>
                      );
                    })}
                  </div>
                </div>

                {/* Clickable voicing options */}
                <div style={{ marginTop:"12px" }}>
                  <div style={{ fontSize:"10px", fontFamily:"'JetBrains Mono',monospace", color:T.textMute, letterSpacing:"1px", marginBottom:"8px" }}>VOICINGS — tap to switch</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                    {displayVoicings.map(([shape, data]) => {
                      const isCurrent = voicingKey === shape;
                      return (
                        <button
                          key={shape}
                          onClick={() => setSelectedVoicingKey(shape)}
                          style={{
                            padding:"6px 11px", borderRadius:"7px", fontSize:"11px",
                            fontFamily:"'JetBrains Mono',monospace", textAlign:"left",
                            background: isCurrent ? `${accentColor}20` : T.surface2,
                            color: isCurrent ? accentColor : T.textLo,
                            border: isCurrent ? `1.5px solid ${accentColor}` : `1.5px solid ${T.border}`,
                            transition:"all 0.12s",
                            cursor:"pointer",
                          }}
                        >
                          {data.fingers}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:"24px", color:T.border, fontSize:"10px", fontFamily:"'JetBrains Mono',monospace" }}>
          unlocktheguitar.net
        </div>
      </div>
    </div>
  );
}

function SL({ children, style, T }) {
  return <div style={{ fontSize:"10px", color:T.textMute, letterSpacing:"1.5px", marginBottom:"8px", fontFamily:"'JetBrains Mono',monospace", fontWeight:"600", ...style }}>{children}</div>;
}
