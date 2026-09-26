export function ParseServiceTypes(raw, category) {
  const allowed = CATEGORY_SERVICES_MAP[category] || [];
  const parsed = parseJsonField(raw, []);
  if (!Array.isArray(parsed)) return { value: [] };
  // Keep only non-empty strings, or restrict strictly to allowed list if desired
  const cleaned = parsed
    .filter((s) => typeof s === "string" && s.trim())
    .map((s) => s.trim());
  return { value: cleaned };
}