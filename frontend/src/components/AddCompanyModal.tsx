import { useState } from "react";
import { X } from "lucide-react";
import type { CompanyInput } from "../types";

export function AddCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (data: CompanyInput) => Promise<void> }) {
  const [form, setForm] = useState<CompanyInput>({ name: "", job_title: "", job_description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof CompanyInput, value: string) => setForm(current => ({ ...current, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="add-company-title" onMouseDown={event => event.stopPropagation()} onSubmit={async event => {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSave(form); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save company."); } finally { setSaving(false); }
  }}><div className="modal-head"><div><span className="eyebrow">Your next opportunity</span><h2 id="add-company-title">Add company & JD</h2></div><button type="button" className="icon-button" aria-label="Close" disabled={saving} onClick={onClose}><X size={20} /></button></div>
    <p className="helper-text">Add any company. Paste a job description now, or add multiple roles later from Resume.</p>
    <div className="form-grid">
      <label>Company name *<input autoFocus required maxLength={200} value={form.name} onChange={event => field("name", event.target.value)} placeholder="Company you want to apply to" /></label>
      <label>Industry / category<input value={form.category || ""} onChange={event => field("category", event.target.value)} placeholder="Technology, Healthcare, Finance…" /></label>
      <label>Location<input value={form.main_locations || ""} onChange={event => field("main_locations", event.target.value)} placeholder="Toronto, Remote…" /></label>
      <label>Job or careers link<input type="url" value={form.link || ""} onChange={event => field("link", event.target.value)} placeholder="https://…" /></label>
      <label className="full">Job title<input value={form.job_title} onChange={event => field("job_title", event.target.value)} placeholder="Software Engineer" /></label>
      <label className="full">Job description (JD)<textarea rows={8} value={form.job_description} onChange={event => field("job_description", event.target.value)} placeholder="Paste the full job description here…" /></label>
      <label className="full">Company notes<textarea rows={2} value={form.notes || ""} onChange={event => field("notes", event.target.value)} /></label>
    </div>{error && <p className="inline-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="button ghost" disabled={saving} onClick={onClose}>Cancel</button><button className="button primary" disabled={saving || !form.name.trim()}>{saving ? "Saving…" : "Save & open Resume"}</button></div>
  </form></div>;
}
