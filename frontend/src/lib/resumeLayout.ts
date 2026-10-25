import type { StructuredResume } from "../types";

// Parse only explicit years/months; never invent dates or rely on locale Date.parse.
function dateRank(text: string, end: boolean): number {
  const year = text.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
  if (!year) return -1;
  const numeric = text.match(/\b(?:19|20|21)\d{2}[-/.](0?[1-9]|1[0-2])(?:\b|[-/.])/);
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const namedMonth = text.toLowerCase().match(/\b(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\b/);
  const month = numeric ? Number(numeric[1]) : namedMonth ? monthNames.indexOf(namedMonth[1].slice(0, 3)) + 1 : end ? 12 : 1;
  return Number(year[1]) * 12 + month;
}

export function sortExperience<T extends { dates: string }>(entries: T[]): T[] {
  const key = (dates: string) => {
    const parts = dates.split(/\s+(?:--?|to)\s+|\s*[–—]\s*/i);
    const current = /\b(present|current|ongoing|now)\b|至今/i.test(dates);
    const start = dateRank(parts[0], false);
    const end = current ? Number.MAX_SAFE_INTEGER : dateRank(parts.at(-1) || "", true);
    return [end, start];
  };
  return entries.map((entry, index) => ({ entry, index, key: key(entry.dates) }))
    .sort((a, b) => b.key[0] - a.key[0] || b.key[1] - a.key[1] || a.index - b.index)
    .map(item => item.entry);
}

export function applyResumeLayout(resume: StructuredResume): StructuredResume {
  return { ...resume, experience: sortExperience(resume.experience) };
}
