export function SanitizeSlug(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // only lowercase alphanumeric and dashes
    .replace(/-+/g, "-")          // collapse repeated dashes
    .replace(/^-/, "");          // prevent leading dash
}

