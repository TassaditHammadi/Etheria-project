// supprime les champs undefined / "" (et garde 0/false)
export function cleanVars<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined || v === null) continue;
    out[k] = v;
  }
  return out as T;
}
