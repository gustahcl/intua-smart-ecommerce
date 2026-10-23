/**
 * Rate limit simples em memória (janela deslizante) para proteger a cota da API
 * do LLM. Em produção, trocar por @upstash/ratelimit (Redis) para funcionar
 * entre várias instâncias.
 */
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

export function rateLimit(
  key: string,
  max = 15,
  windowMs = 60_000,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  if (now - lastSweep > windowMs) {
    for (const [k, list] of hits) {
      if (list.every((t) => now - t > windowMs)) hits.delete(k);
    }
    lastSweep = now;
  }

  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfterSec: 0 };
}
