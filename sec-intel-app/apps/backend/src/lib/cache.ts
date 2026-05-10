export class TtlCache<K, V> {
  private readonly store = new Map<K, { expiresAt: number; value: V }>();

  constructor(private readonly ttlMs: number) {}

  get(key: K): V | null {
    const cached = this.store.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return cached.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }
}

