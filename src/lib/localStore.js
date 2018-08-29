const KEY_PREFIX = 'zp-explorer-';

// same key can not be in both session and local - session gets the precedence.
const sessionKeys = Object.keys(sessionStorage);
export default {
  get(key) {
    const innerKey = `${KEY_PREFIX}${key}`;
    const storage = sessionKeys.includes(innerKey) ? sessionStorage : localStorage;
    return JSON.parse(storage.getItem(innerKey));
  },
  set(key, value, session = false) {
    const innerKey = `${KEY_PREFIX}${key}`;
    const storage = session ? sessionStorage : localStorage;
    if (session) {
      if (!sessionKeys.includes(innerKey)) {
        sessionKeys.push(innerKey);
      }
    }
    storage.setItem(innerKey, JSON.stringify(value));
  },
  remove(key) {
    const innerKey = `${KEY_PREFIX}${key}`;
    localStorage.removeItem(innerKey);
    sessionStorage.removeItem(innerKey);
    if (!sessionKeys.includes(innerKey)) {
      sessionKeys.splice(sessionKeys.indexOf(innerKey), 1);
    }
  },
  clear() {
    localStorage.clear();
    sessionStorage.clear();
  },
};
