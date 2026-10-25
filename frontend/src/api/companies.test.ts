import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { api } from "./client";
import { makeZip, readStoreZip } from "../lib/resumeFiles";

afterEach(() => new Promise<void>((resolve, reject) => {
  const request = indexedDB.deleteDatabase("personal-resume-studio");
  request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
}));

describe("personal company workspace", () => {
  it("starts empty, saves arbitrary companies and JDs, and edits company metadata", async () => {
    expect(await api.companies()).toEqual([]);
    const company = await api.createCompany({ name: "  My Target Company  ", job_title: "Engineer", job_description: "Build reliable services", category: "Technology", link: "https://example.com/jobs" });
    expect(company.name).toBe("My Target Company");
    expect(company.application_count).toBe(1);
    expect((await api.applications(company.id))[0].job_description).toBe("Build reliable services");
    await api.updateCompany(company.id, { name: "Renamed Company", notes: "Referral", main_locations: "Toronto" });
    expect(await api.company(company.id)).toMatchObject({ name: "Renamed Company", notes: "Referral", main_locations: "Toronto" });
    await api.createApplication({ company_id: company.id, job_title: "Second role", job_description: "Another JD", notes: "" });
    expect((await api.company(company.id)).application_count).toBe(2);
  });

  it("restores custom company IDs without the upstream catalog aliases and excludes keys", async () => {
    for (let i = 1; i <= 26; i++) await api.createCompany({ name: `Target ${i}` });
    await api.createApplication({ company_id: 25, job_title: "Role", job_description: "My JD", notes: "" });
    await api.saveAiSettings({ provider: "openai", model: "gpt-5.6-luna", api_key: "must-not-be-exported" });
    const backup = await api.exportBackup();
    const files = await readStoreZip(backup);
    expect(await files["data.json"].text()).not.toContain("must-not-be-exported");
    await api.deleteCompany(25);
    expect(await api.applications(25)).toHaveLength(0);
    await api.importBackup(new File([backup], "backup.zip"));
    expect((await api.company(25)).name).toBe("Target 25");
    expect((await api.applications(25))[0].job_description).toBe("My JD");
    expect((await api.company(26)).name).toBe("Target 26");
  });

  it("rejects broken imports before replacing current data", async () => {
    await api.createCompany({ name: "Keep me" });
    const backup = await makeZip({ "data.json": JSON.stringify({ format: "personal-resume-studio", companies: [], applications: [{ company_id: 999 }] }) });
    await expect(api.importBackup(new File([backup], "broken.zip"))).rejects.toThrow("missing company");
    expect((await api.companies())[0].name).toBe("Keep me");
    await expect(api.createCompany({ name: " " })).rejects.toThrow("company name");
    await expect(api.createCompany({ name: "Unsafe", link: "javascript:alert(1)" })).rejects.toThrow("https://");
    await expect(api.createApplication({ company_id: 999, job_title: "", job_description: "", notes: "" })).rejects.toThrow("not found");
  });
});
