import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { StudentSubmission } from "../../lib/studentApi";
import "./StudentRequestsPage.css";

const statusLabelMap: Record<string, string> = {
  submitted: "Submitted",
  resubmission: "Needs resubmission",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export const StudentRequestsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await studentApi.listMySubmissions();
        if (isMounted) {
          setSubmissions(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
              ? (err as { message: string }).message
              : "Failed to load requests.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewDetails = (submissionId: string) => {
    // You can navigate to /student/requests/:id once you add a detail page
    alert(`Detail view for submission ${submissionId} not implemented yet.`);
  };

  return (
    <div className="requests-root">
      <h1 className="requests-title">My requests</h1>
      <p className="requests-subtitle">
        View the status of your recommendation submissions. Faculty names will
        appear once exposed by the backend.
      </p>

      {isLoading && <p className="requests-info">Loading your requests…</p>}
      {error && <p className="requests-error">{error}</p>}

      {!isLoading && !error && submissions.length === 0 && (
        <p className="requests-info">
          You do not have any active submissions yet.
        </p>
      )}

      {!isLoading && !error && submissions.length > 0 && (
        <div className="requests-table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>University</th>
                <th>Purpose</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.universityName || "—"}</td>
                  <td>{s.purpose || "—"}</td>
                  <td>
                    {new Date(s.deadline).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td>
                    <span
                      className={`requests-status requests-status-${s.status}`}
                    >
                      {statusLabelMap[s.status] ?? s.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="requests-view-button"
                      onClick={() => handleViewDetails(s.id)}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
