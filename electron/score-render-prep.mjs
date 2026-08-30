import * as alphaTab from '@coderline/alphatab';

function createEmptyBar(previousBar, voiceCount) {
  const bar = new alphaTab.model.Bar();
  if (previousBar) {
    bar.clef = previousBar.clef;
    bar.clefOttava = previousBar.clefOttava;
    bar.keySignature = previousBar.keySignature;
    bar.keySignatureType = previousBar.keySignatureType;
  }
  for (let i = 0; i < voiceCount; i += 1) {
    const voice = new alphaTab.model.Voice();
    bar.addVoice(voice);
    const emptyBeat = new alphaTab.model.Beat();
    emptyBeat.isEmpty = true;
    voice.addBeat(emptyBeat);
  }
  return bar;
}

function ensureCompleteBars(score) {
  const masterCount = score.masterBars?.length || 0;
  for (const track of score.tracks || []) {
    for (const staff of track.staves || []) {
      const existing = (staff.bars || []).find(Boolean);
      const voiceCount = Math.max(1, existing?.voices?.length || 1);
      const bars = [];
      for (let i = 0; i < masterCount; i += 1) {
        const bar = staff.bars?.[i] || createEmptyBar(bars[i - 1] || existing || null, voiceCount);
        bar.staff = staff;
        bar.index = i;
        bar.previousBar = bars[i - 1] || null;
        if (bars[i - 1]) bars[i - 1].nextBar = bar;
        bars.push(bar);
      }
      if (bars.length) bars[bars.length - 1].nextBar = null;
      staff.bars = bars;
    }
  }
}

function staffHasTablature(staff) {
  return Boolean(!staff.isPercussion && staff.tuning?.length);
}

function applyStaveProfileVisibility(score, staveProfile) {
  const profile = String(staveProfile || 'tab').toLowerCase();
  const forceTab = profile === 'tab' || profile === 'tabmixed' || profile === 'scoretab';
  const forceScore = profile === 'score' || profile === 'scoretab';
  for (const track of score.tracks || []) {
    for (const staff of track.staves || []) {
      if (forceTab && staffHasTablature(staff)) staff.showTablature = true;
      if (forceScore) staff.showStandardNotation = true;
    }
  }
}

function resolveStaveProfile(score, trackIndexes, staveProfile) {
  const profile = String(staveProfile || 'tab').toLowerCase();
  if (profile !== 'tab' && profile !== 'tabmixed') return profile;
  const hasTab = trackIndexes.some(index => {
    const track = score.tracks?.[index];
    return track?.staves?.some(staffHasTablature);
  });
  return hasTab ? profile : 'score';
}

function getNoteBarIndex(note) {
  return note?.beat?.voice?.bar?.index;
}

function isOutsideChunk(note, firstIndex, lastIndex) {
  const index = getNoteBarIndex(note);
  return index == null || index < firstIndex || index > lastIndex;
}

function forEachBeat(score, callback) {
  for (const track of score.tracks || []) {
    for (const staff of track.staves || []) {
      for (const bar of staff.bars || []) {
        if (!bar) continue;
        for (const voice of bar.voices || []) {
          if (!voice) continue;
          for (const beat of voice.beats || []) {
            if (beat) callback(beat);
          }
        }
      }
    }
  }
}

function forEachNote(score, callback) {
  forEachBeat(score, beat => {
    for (const note of beat.notes || []) {
      if (note) callback(note);
    }
  });
}

function previousNoteOnSameString(note) {
  let current = note.beat?.previousBeat;
  while (current) {
    const found = (current.notes || []).find(other => other && other.string === note.string);
    if (found) return found;
    current = current.previousBeat;
  }
  return null;
}

function followNoteChain(note, getNext) {
  let current = note;
  const seen = new Set();
  while (current) {
    const next = getNext(current);
    if (!next || next === current || seen.has(next)) break;
    seen.add(current);
    current = next;
  }
  return current;
}

function lastLetRingNote(note) {
  const lastOnLetRing = followNoteChain(note, current => {
    const destination = current.letRingDestination;
    return destination && destination !== current ? destination : null;
  });
  return followNoteChain(lastOnLetRing, current => current.tieDestination);
}

function applyLetRingAsParentheses(score) {
  const lastNotes = new Set();
  forEachNote(score, note => {
    if (!note.isLetRing) return;
    const previous = previousNoteOnSameString(note);
    if (previous?.isLetRing) return;
    const last = lastLetRingNote(note);
    if (last !== note) lastNotes.add(last);
  });

  forEachNote(score, note => {
    if (!note.isLetRing) return;
    note.isLetRing = false;
    note.letRingDestination = null;
  });

  forEachBeat(score, beat => {
    beat.isLetRing = false;
  });

  for (const note of lastNotes) {
    note.isGhost = true;
    if (note.isTieDestination) {
      note.isTieDestination = false;
      note.tieOrigin = null;
    }
  }
}

export function prepareScoreForRender(score, options, trackIndexes) {
  ensureCompleteBars(score);
  score.finish(new alphaTab.Settings());
  applyLetRingAsParentheses(score);
  options.staveProfile = resolveStaveProfile(score, trackIndexes, options.staveProfile);
  applyStaveProfileVisibility(score, options.staveProfile);
}

export function disconnectIncomingNoteLinks(score, startBar, endBar) {
  const firstIndex = startBar - 1;
  const lastIndex = endBar - 1;
  for (const track of score.tracks || []) {
    for (const staff of track.staves || []) {
      for (let i = firstIndex; i <= lastIndex; i += 1) {
        const bar = staff.bars?.[i];
        if (!bar) continue;
        for (const voice of bar.voices || []) {
          if (!voice) continue;
          for (const beat of voice.beats || []) {
            if (!beat) continue;
            if (beat.effectSlurOrigin) {
              const originIndex = beat.effectSlurOrigin.voice?.bar?.index;
              if (originIndex == null || originIndex < firstIndex || originIndex > lastIndex) {
                beat.effectSlurOrigin = null;
              }
            }
            for (const note of beat.notes || []) {
              if (!note) continue;
              if (note.tieOrigin && isOutsideChunk(note.tieOrigin, firstIndex, lastIndex)) {
                note.isTieDestination = false;
                note.tieOrigin = null;
              }
              if (note.slurOrigin && isOutsideChunk(note.slurOrigin, firstIndex, lastIndex)) {
                note.isSlurDestination = false;
                note.slurOrigin = null;
              }
              if (note.hammerPullOrigin && isOutsideChunk(note.hammerPullOrigin, firstIndex, lastIndex)) {
                note.hammerPullOrigin = null;
              }
              if (note.effectSlurOrigin && isOutsideChunk(note.effectSlurOrigin, firstIndex, lastIndex)) {
                note.effectSlurOrigin = null;
              }
              if (note.slideOrigin && isOutsideChunk(note.slideOrigin, firstIndex, lastIndex)) {
                note.slideOrigin = null;
              }
            }
          }
        }
      }
    }
  }
}
