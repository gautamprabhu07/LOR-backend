import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { TargetUniversity } from "../../lib/studentApi";
import "./StudentTargetsPage.css";

interface FormState {
  university: string;
  program: string;
  deadline: string;
  purpose: string;
}

export const StudentTargetsPage: React.FC = () => {
  const [targets, setTargets] = useState<TargetUniversity[]>([]);
  const [form, setForm] = useState<FormState>({
    university: "",
    program: "",
    deadline: "",
    purpose: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await studentApi.getTargets();
        if (mounted) setTargets(data);
      } catch (err: unknown) {
        if (mounted) {
          const message =
            err && typeof err === "object" && "message" in err && 
            typeof (err as { message?: unknown }).message === "string"
              ? (err as { message: string }).message
              : "Failed to load targets.";
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> =
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setError(null);
    };

  const handleAdd: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (targets.length >= 5) {
      setError("Maximum 5 target universities allowed.");
      return;
    }

    setIsSaving(true);
    try {
      const added = await studentApi.addTarget({
        university: form.university,
        program: form.program,
        deadline: form.deadline,
        purpose: form.purpose,
      });
      setTargets((prev) => [...prev, added]);
      setForm({
        university: "",
        program: "",
        deadline: "",
        purpose: "",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && 
        typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to add target university.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await studentApi.deleteTarget(id);
      setTargets((prev) => prev.filter((t) => t._id !== id));
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && 
        typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to delete target.";
      setError(message);
    }
  };

  return (
    <div className="targets-root">
      <h1 className="targets-title">Target universities</h1>
      <p className="targets-subtitle">
        Add up to five target universities with program, deadline, and purpose.
      </p>

      {error && <p className="targets-error">{error}</p>}
      {loading && <p className="targets-info">Loading target universities…</p>}

      {!loading && (
        <>
          <form className="targets-form" onSubmit={handleAdd}>
            <div className="targets-grid">
              <div className="targets-field">
                <label className="targets-label" htmlFor="university">
                  University
                </label>
                <input
                  id="university"
                  name="university"
                  type="text"
                  className="targets-input"
                  value={form.university}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="targets-field">
                <label className="targets-label" htmlFor="program">
                  Program
                </label>
                <input
                  id="program"
                  name="program"
                  type="text"
                  className="targets-input"
                  value={form.program}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="targets-field">
                <label className="targets-label" htmlFor="deadline">
                  Deadline for LoR
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  className="targets-input"
                  value={form.deadline}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="targets-field">
              <label className="targets-label" htmlFor="purpose">
                Purpose / comments
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows={3}
                className="targets-textarea"
                value={form.purpose}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="targets-add-button"
              disabled={isSaving}
            >
              {isSaving ? "Adding…" : "Add target"}
            </button>
          </form>

          <div className="targets-list-wrapper">
            {targets.length === 0 ? (
              <p className="targets-info">No target universities added yet.</p>
            ) : (
              <ul className="targets-list">
                {targets.map((t) => (
                  <li key={t._id} className="targets-item">
                    <div className="targets-item-main">
                      <span className="targets-item-title">
                        {t.university} — {t.program}
                      </span>
                      <span className="targets-item-deadline">
                        Deadline:{" "}
                        {new Date(t.deadline).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="targets-item-purpose">{t.purpose}</span>
                    </div>
                    <button
                      type="button"
                      className="targets-delete-button"
                      onClick={() => handleDelete(t._id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};
