// Plain JS so it can be shared by the Node scraper script and the app.
export const NAME_ALIASES = {};

// Community sheets append the engraving level to names, e.g. "Beryl (E1)"
export const stripEngraving = (name) =>
  String(name)
    .replace(/\s*\(E\d+\)/gi, "")
    .trim();

export const normalizeName = (name) => {
  const n = stripEngraving(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return NAME_ALIASES[n] ?? n;
};
