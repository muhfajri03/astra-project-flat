import { Preferences } from "@capacitor/preferences";
import { initialState } from "./progress.js";

const KEY = "astra_state_v1";

export async function loadState() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return initialState();
    const saved = JSON.parse(value);
    const base = initialState();
    return {
      ...base,
      ...saved,
      settings: { ...base.settings, ...(saved.settings || {}) },
      toneStats: { ...base.toneStats, ...(saved.toneStats || {}) },
    };
  } catch {
    return initialState();
  }
}

export async function saveState(state) {
  try {
    const { newBadges, challengeJustDone, ...clean } = state;
    await Preferences.set({ key: KEY, value: JSON.stringify(clean) });
  } catch {
    /* penyimpanan best-effort */
  }
}

export async function resetState() {
  try {
    await Preferences.remove({ key: KEY });
  } catch {
    /* diabaikan */
  }
  return initialState();
}
