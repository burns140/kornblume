const SHEET_ID = "1e46cecjsIb1LO3Ybb6urlVUZKUk8R7yrgG9yXZS8-Ho";

// Tabs are addressed by gid because their titles carry version numbers that change every patch.
export const SHEET_GIDS = {
  characterTiers: "1003573348",
  archetypes: "641457633",
};

export const sheetEditUrl = (gid: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${gid}`;

export async function fetchSheetCsv(
  gid: string,
  range?: string,
): Promise<string> {
  const params = `tqx=out:csv&gid=${gid}${range ? `&range=${range}` : ""}`;
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`,
  );
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.text();
}
