const { CACHE_DURATION } = require("../config/constants");

class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const cached = this.store.get(key);
    if (!cached) return null;

    const ttl = cached.ttl || CACHE_DURATION;
    if (Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Remove expired entry
    this.store.delete(key);
    return null;
  }

  set(key, data, ttl = null) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl,
    });
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

module.exports = new Cache();
