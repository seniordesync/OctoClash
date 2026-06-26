function createStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
}

Object.defineProperty(globalThis, 'localStorage', {
  value: createStorage(),
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: createStorage(),
  configurable: true,
});
