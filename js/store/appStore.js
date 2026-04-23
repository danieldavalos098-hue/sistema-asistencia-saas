const state = {
  currentPage: 'dashboard',
  loadedPages: new Set(),
  user: null,
  branding: null,
};

export function getCurrentPage() {
  return state.currentPage;
}

export function setCurrentPage(page) {
  state.currentPage = page;
}

export function hasLoadedPage(page) {
  return state.loadedPages.has(page);
}

export function markPageLoaded(page) {
  state.loadedPages.add(page);
}

export function setCurrentUser(user) {
  state.user = user;
}

export function getCurrentUserState() {
  return state.user;
}

export function setBranding(branding) {
  state.branding = branding;
}

export function getBranding() {
  return state.branding;
}
