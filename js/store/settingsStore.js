const state = {
  settings: null,
};

export function setSettingsState(settings) {
  state.settings = settings;
}

export function getSettingsState() {
  return state.settings;
}

export function mergeSettingsState(patch) {
  state.settings = {
    ...(state.settings || {}),
    ...(patch || {}),
  };
  return state.settings;
}

export function getWaSettingsState() {
  return state.settings;
}

export function setWaSettingsState(settings) {
  state.settings = settings;
}
