import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Company, CompanyUpdate } from "../types";

export function CompanyModal({ company, onClose, onSave, onDelete }: {
  company: Company;
  onClose: () => void;
  onSave: (data: CompanyUpdate) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<CompanyUpdate>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setForm({
    name: company.name,
    category: company.category,
    notes: company.notes,
    link: company.link,
    main_locations: company.main_locations,
  }), [company]);

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={async event => {
      event.preventDefault(); setSaving(true);
      try { await onSave(form); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Save failed"); } finally { setSaving(false); }
    }}>
      <div className="modal-head"><div><span className="eyebrow">Company tracker</span><h2>Edit {company.name}</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={20} /></button></div>
      <div className="form-grid">
        <label>Company name<input required value={form.name || ""} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
        <label>Industry / category<input value={form.category || ""} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /></label>
        <label>Locations<input value={form.main_locations || ""} onChange={event => setForm(current => ({ ...current, main_locations: event.target.value }))} placeholder="Toronto, Vancouver, Remote" /></label>
        <label className="full">Useful link<input type="url" value={form.link || ""} onChange={event => setForm(current => ({ ...current, link: event.target.value }))} placeholder="https://..." /></label>
        <label className="full">Notes<textarea rows={6} value={form.notes || ""} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></label>
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="button ghost" disabled={saving} onClick={async () => { if (!confirm(`Delete ${company.name}, all its applications and resume versions? This cannot be undone.`)) return; setSaving(true); try { await onDelete(); onClose(); } catch (reason) { setError(String(reason)); } finally { setSaving(false); } }}>Delete company</button><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
    </form>
  </div>;
}
