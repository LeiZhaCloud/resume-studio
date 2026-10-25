import { expect, it } from "vitest";
import { completeResume } from "../test/resumeFixtures";
import { sortExperience } from "./resumeLayout";
import { renderResumeLatex } from "./resumeLatex";

it("orders current roles first, then end and start dates descending, across work and research", () => {
  const dates = ["Jul. 2001 -- Jul. 2017", "Jul. 2021 -- Sep. 2023", "Oct. 2023 -- Present", "2019 – 2023", "2022-01 -- 2023-09", "", "2018 — 2020"];
  const entries = dates.map((dates, index) => ({ ...completeResume.experience[index % 2], dates, organization: String(index) }));
  const sorted = sortExperience(entries);
  expect(sorted.map(entry => entry.organization)).toEqual(["2", "3", "4", "1", "6", "0", "5"]);
  expect(entries.map(entry => entry.dates)).toEqual(dates);
});

it("sorts saved and manually edited resumes at rendering time, keeps unknown dates stable, and renders Education last", () => {
  const entries = ["unknown A", "2001 -- 2017", "2023 -- Present", "unknown B"].map(dates => ({ ...completeResume.experience[0], dates, organization: dates }));
  const tex = renderResumeLatex({ ...completeResume, experience: entries });
  expect(tex.indexOf("2023 -- Present")).toBeLessThan(tex.indexOf("2001 -- 2017"));
  expect(tex.indexOf("unknown A")).toBeLessThan(tex.indexOf("unknown B"));
  expect(tex.indexOf("\\section{Education}")).toBeGreaterThan(tex.indexOf("\\section{Technical Skills}"));
});
