import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { uploadMedia } from "../services/media.service";
import { getOnlineWorkers } from "../services/user.service";

import {
  getJobById,
  assignJob,
  acceptJob,
  declineJob,
  markJobChecking,
  submitJobEstimate,
  approveJobEstimate,
  completeJob,
  verifyJob,
  requestJobRework,
  resumeJobAfterRework,
} from "../services/job.service";

import "../css/JobDetails.css";

const MAX_EVIDENCE_FILES = 6;
const MAX_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024;

const WORKFLOW_STAGES = [
  { key: "Created", label: "Job created" },
  { key: "Assigned", label: "Worker assigned" },
  { key: "WorkerAccepted", label: "Worker accepted" },
  { key: "Checking", label: "On-site checking" },
  { key: "WaitingCustomerApproval", label: "Customer decision" },
  { key: "TemporaryFixApproved", label: "Temporary fix approved" },
  { key: "InProgress", label: "Work in progress" },
  { key: "WorkCompleted", label: "Work completed" },
  { key: "Verified", label: "Verified / completed" },
];

const STATUS_LABELS = {
  Created: "Created",
  Assigned: "Assigned",
  WorkerAccepted: "Worker accepted",
  Checking: "Checking",
  EstimateSubmitted: "Estimate submitted",
  WaitingCustomerApproval: "Waiting for customer approval",
  TemporaryFixApproved: "Temporary fix approved",
  InProgress: "In progress",
  WorkCompleted: "Work completed",
  VerificationPending: "Waiting for verification",
  Verified: "Verified",
  ReworkRequired: "Rework required",
  Reject: "Rejected / closed",
  Rejected: "Rejected / closed",
  Cancelled: "Cancelled",
};

function createRequestKey() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.randomUUID
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `mf-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function getId(value) {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(
    value._id ||
      value.id ||
      value.workerid ||
      value.userId ||
      ""
  );
}

function displayName(value, fallback = "Not available") {
  if (value == null || String(value).trim() === "") {
    return fallback;
  }

  return String(value);
}

function getResponseMessage(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;
  const serverError = error?.response?.data?.error;

  if (status === 400) {
    return serverMessage || "The submitted information is invalid.";
  }

  if (status === 401) {
    return "Your session has expired. Sign in again.";
  }

  if (status === 403) {
    return (
      serverMessage ||
      "Your account is not allowed to perform this action."
    );
  }

  if (status === 404) {
    return serverMessage || "This job could not be found.";
  }

  if (status === 409) {
    return (
      serverMessage ||
      "The job changed on the server. Its latest state is being loaded."
    );
  }

  if (status === 413) {
    return "The evidence upload is too large. Choose smaller files.";
  }

  if (status === 415) {
    return "The server does not accept this file type.";
  }

  if (status === 422) {
    return serverMessage || "Some submitted information is invalid.";
  }

  if (status === 429) {
    return "Too many requests. Wait a moment before trying again.";
  }

  if (error?.request && !error?.response) {
    return (
      "No response was received. The operation may have reached " +
      "the server. Refresh the job before retrying it."
    );
  }

  if (error?.message && !error?.response) {
    return error.message;
  }

  return (
    serverMessage ||
    serverError ||
    "The request failed. Please try again."
  );
}

function getMediaUrl(media) {
  if (typeof media === "string") return media;

  return (
    media?.url ||
    media?.secure_url ||
    media?.path ||
    ""
  );
}

function getMediaLabel(media, index, prefix) {
  if (media && typeof media === "object") {
    return (
      media.originalName ||
      media.filename ||
      `${prefix} ${index + 1}`
    );
  }

  return `${prefix} ${index + 1}`;
}

function readOnlineWorkerList(response) {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.workers)) return data.workers;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function EvidenceGallery({
  title,
  media,
  emptyText,
  prefix,
}) {
  return (
    <section className="job-detail-section">
      <h2>{title}</h2>

      {!media.length ? (
        <p className="job-detail-muted">{emptyText}</p>
      ) : (
        <div className="job-detail-media-grid">
          {media.map((item, index) => {
            const url = getMediaUrl(item);
            const label = getMediaLabel(item, index, prefix);
            const key = getId(item) || `${prefix}-${index}`;

            return (
              <figure key={key}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${label}`}
                  >
                    <img
                      src={url}
                      alt={label}
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="job-detail-media-missing">
                    Preview unavailable
                  </div>
                )}

                <figcaption>{label}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}

function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const currentUserId = getId(user?._id || user?.id);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isActing, setIsActing] = useState(false);

  const [workerId, setWorkerId] = useState("");
  const [onlineWorkers, setOnlineWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workersError, setWorkersError] = useState("");

  const [estimateBudget, setEstimateBudget] = useState("");
  const [actualProblem, setActualProblem] = useState("");

  const [afterFiles, setAfterFiles] = useState([]);
  const [reworkFiles, setReworkFiles] = useState([]);

  // A ref prevents a second click before React updates the state.
  const actingRef = useRef(false);

  // Reuse keys when the same logical mutation is retried after an error.
  const actionKeys = useRef(new Map());

  // Avoid uploading the same File object again during the current page session.
  const uploadedMedia = useRef(new WeakMap());
  const uploadKeys = useRef(new WeakMap());
  const uncertainUpload = useRef(false);

  const canAdminAssign = Boolean(
    job &&
      ["admin", "operator"].includes(role) &&
      job.status === "Created"
  );

  const loadJob = useCallback(
    async ({ signal, silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      setPageError("");

      try {
        const response = await getJobById(
          id,
          signal ? { signal } : {}
        );

        const record = response?.data?.data;

        if (!record?._id) {
          throw new Error(
            "The job API returned an unexpected response. " +
              "Check the get-job endpoint response shape."
          );
        }

        setJob(record);

        return record;
      } catch (error) {
        if (
          signal?.aborted ||
          error?.code === "ERR_CANCELED"
        ) {
          return null;
        }

        setPageError(getResponseMessage(error));

        return null;
      } finally {
        if (!silent && !signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  const loadOnlineWorkers = useCallback(async () => {
    setWorkersLoading(true);
    setWorkersError("");

    try {
      const response = await getOnlineWorkers();

      const workers = readOnlineWorkerList(response).filter(
        (worker) => getId(worker)
      );

      setOnlineWorkers(workers);
    } catch (error) {
      setWorkersError(
        error?.response?.data?.message ||
          "Online workers could not be loaded. " +
            "You can enter a worker ID manually."
      );

      setOnlineWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadJob({ signal: controller.signal });

    return () => controller.abort();
  }, [loadJob]);

  useEffect(() => {
    if (!canAdminAssign) return;

    void loadOnlineWorkers();
  }, [canAdminAssign, loadOnlineWorkers]);

  function requestKeyFor(scope) {
    if (!actionKeys.current.has(scope)) {
      actionKeys.current.set(scope, createRequestKey());
    }

    return actionKeys.current.get(scope);
  }

  async function performAction(action, successText) {
    if (actingRef.current) return;

    actingRef.current = true;
    setIsActing(true);
    setActionError("");
    setSuccessMessage("");

    const scopesUsed = new Set();

    const keyFor = (scope) => {
      scopesUsed.add(scope);

      return requestKeyFor(scope);
    };

    try {
      await action(keyFor);

      // The mutation succeeded, so a future independent action gets a new key.
      scopesUsed.forEach((scope) => {
        actionKeys.current.delete(scope);
      });

      const refreshedJob = await loadJob({ silent: true });

      if (refreshedJob) {
        setSuccessMessage(successText);
      } else {
        setSuccessMessage(
          `${successText} The action may have succeeded, but ` +
            "the latest job state could not be refreshed. " +
            "Use Refresh before starting another action."
        );
      }
    } catch (error) {
      setActionError(getResponseMessage(error));

      // A timeout or conflict may mean the server already changed the job.
      // Refresh the state instead of automatically replaying the mutation.
      if (
        error?.response?.status === 409 ||
        (error?.request && !error?.response)
      ) {
        await loadJob({ silent: true });
      }
    } finally {
      actingRef.current = false;
      setIsActing(false);
    }
  }

  async function uploadEvidence(files) {
    if (uncertainUpload.current) {
      throw new Error(
        "A previous upload timed out with an unknown outcome. " +
          "Reload this page before uploading again to avoid " +
          "accidental duplicate uploads."
      );
    }

    const ids = [];

    for (const file of files) {
      const cachedId = uploadedMedia.current.get(file);

      if (cachedId) {
        ids.push(cachedId);
        continue;
      }

      let key = uploadKeys.current.get(file);

      if (!key) {
        key = createRequestKey();
        uploadKeys.current.set(file, key);
      }

      let response;

      try {
        response = await uploadMedia(file, key);
      } catch (error) {
        if (error?.request && !error?.response) {
          uncertainUpload.current = true;
        }

        throw error;
      }

      const media = response?.data?.data;

      if (!media?._id) {
        throw new Error(
          "The media API did not return a Media ID. " +
            "Check POST /api/v1/Media/capture."
        );
      }

      const mediaId = String(media._id);

      uploadedMedia.current.set(file, mediaId);
      ids.push(mediaId);
    }

    return ids;
  }

  function handleEvidenceChange(event, setter) {
    const files = Array.from(event.target.files || []);

    // Allow a user to choose the same file again after removing it.
    event.target.value = "";

    if (files.length > MAX_EVIDENCE_FILES) {
      setActionError(
        `Choose at most ${MAX_EVIDENCE_FILES} photos at a time.`
      );

      return;
    }

    const invalidFile = files.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > MAX_EVIDENCE_FILE_BYTES
    );

    if (invalidFile) {
      setActionError(
        "Choose image files no larger than 10 MB each."
      );

      return;
    }

    setter(files);
    setActionError("");
    setSuccessMessage("");
  }

  async function handleEstimateSubmit(event) {
    event.preventDefault();

    const budget = Number(estimateBudget);

    if (!Number.isFinite(budget) || budget <= 0) {
      setActionError("Enter an estimate greater than zero.");
      return;
    }

    if (!actualProblem.trim()) {
      setActionError(
        "Describe the diagnosed problem before submitting the estimate."
      );

      return;
    }

    if (actualProblem.trim().length < 3) {
      setActionError(
        "The diagnosis must contain at least three characters."
      );

      return;
    }

    await performAction(
      (keyFor) =>
        submitJobEstimate(
          id,
          {
            budget,
            actualProblem: actualProblem.trim(),
          },
          keyFor(
            `estimate:${id}:${budget}:${actualProblem.trim()}`
          )
        ),
      "Estimate submitted."
    );
  }

  if (loading) {
    return (
      <main className="job-detail-page">
        <div
          className="job-detail-state"
          role="status"
          aria-live="polite"
        >
          Loading job details…
        </div>
      </main>
    );
  }

  if (pageError && !job) {
    return (
      <main className="job-detail-page">
        <div className="job-detail-state job-detail-error">
          <h1>Unable to load job</h1>

          <p role="alert">{pageError}</p>

          <div className="job-detail-state-actions">
            <button
              type="button"
              onClick={() => void loadJob()}
            >
              Retry
            </button>

            <Link to="/jobs">Back to jobs</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!job) return null;

  const status = String(job.status || "Unknown");

  const customerId = getId(
    job.customer?.userid ||
      job.customer?.userId ||
      job.customer?._id
  );

  const assignedWorkerId = getId(
    job.worker?.workerid ||
      job.worker?.workerId ||
      job.worker?._id
  );

  const isAssignedWorker =
    role === "worker" &&
    assignedWorkerId === currentUserId;

  const isCustomer =
    role === "customer" &&
    (!customerId || customerId === currentUserId);

  const beforeMedia = Array.isArray(
    job.visualProofs?.beforeMedia
  )
    ? job.visualProofs.beforeMedia
    : [];

  const afterMedia = Array.isArray(
    job.visualProofs?.afterMedia
  )
    ? job.visualProofs.afterMedia
    : [];

  const reworkMedia = Array.isArray(job.rework?.proofMedia)
    ? job.rework.proofMedia
    : [];

  const allowAccept =
    isAssignedWorker && status === "Assigned";

  const allowChecking =
    isAssignedWorker && status === "WorkerAccepted";

  const allowEstimate =
    isAssignedWorker && status === "Checking";

  const allowComplete =
    isAssignedWorker && status === "InProgress";

  const allowResume =
    isAssignedWorker && status === "ReworkRequired";

  const allowApprove =
    isCustomer && status === "WaitingCustomerApproval";

  const allowContinueAfterTemporaryFix =
    isCustomer && status === "TemporaryFixApproved";

  const allowVerify =
    isCustomer && status === "WorkCompleted";

  const allowRework =
    isCustomer && status === "WorkCompleted";

  const currentStageIndex = WORKFLOW_STAGES.findIndex(
    (stage) => stage.key === status
  );

  const estimate =
    job.EstimateSubmitted ||
    job.estimate ||
    job.estimateDetails ||
    null;

  const locationRows = [
    ["House number", job.address?.houseNo],
    ["Street", job.address?.street],
    ["Locality", job.address?.colony],
    ["Landmark", job.address?.landMark],
    ["Contact number", job.address?.newMobile],
  ];

  return (
    <main className="job-detail-page">
      <div className="job-detail-shell">
        <header className="job-detail-header">
          <Link to="/jobs" className="job-detail-back">
            <span aria-hidden="true">←</span> Back to jobs
          </Link>

          <button
            className="job-detail-refresh"
            type="button"
            disabled={isActing}
            onClick={() => void loadJob()}
          >
            Refresh latest state
          </button>
        </header>

        {pageError && (
          <div className="job-detail-alert" role="alert">
            <span>{pageError}</span>

            <button
              type="button"
              onClick={() => void loadJob({ silent: true })}
            >
              Retry refresh
            </button>
          </div>
        )}

        {actionError && (
          <div className="job-detail-alert" role="alert">
            <span>{actionError}</span>

            {uncertainUpload.current && (
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Reload page before retrying upload
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div
            className="job-detail-success"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        <section className="job-detail-card">
          <div className="job-detail-title-row">
            <div>
              <p className="job-detail-eyebrow">
                MAHAAFIX / JOB DETAILS
              </p>

              <h1>{displayName(job.title, "Untitled job")}</h1>

              {job._id && (
                <p className="job-detail-id">Job ID: {job._id}</p>
              )}
            </div>

            <span
              className={`job-detail-status status-${status.toLowerCase()}`}
            >
              {STATUS_LABELS[status] || status}
            </span>
          </div>

          <p className="job-detail-description">
            {displayName(
              job.description,
              "No description was provided."
            )}
          </p>

          {job.previewOnly && (
            <div className="job-detail-notice" role="note">
              This is a limited preview. Customer contact and exact
              location details are hidden until the job is assigned
              to you.
            </div>
          )}

          <div className="job-detail-facts">
            <div>
              <span>Category</span>
              <strong>{displayName(job.category)}</strong>
            </div>

            <div>
              <span>Subcategory</span>
              <strong>{displayName(job.subCategory)}</strong>
            </div>

            <div>
              <span>City</span>
              <strong>{displayName(job.address?.city)}</strong>
            </div>

            <div>
              <span>Initial budget</span>
              <strong>
                {job.payments?.budget != null &&
                Number.isFinite(Number(job.payments.budget))
                  ? `₹${Number(
                      job.payments.budget
                    ).toLocaleString("en-IN")}`
                  : "Not available"}
              </strong>
            </div>

            <div>
              <span>Created</span>
              <strong>{formatDate(job.createdAt)}</strong>
            </div>

            <div>
              <span>Last updated</span>
              <strong>{formatDate(job.updatedAt)}</strong>
            </div>
          </div>

          {!job.previewOnly && (
            <section className="job-detail-section">
              <h2>Service location and people</h2>

              <dl className="job-detail-location">
                {locationRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{displayName(value, "Not provided")}</dd>
                  </div>
                ))}
              </dl>

              <div className="job-detail-parties">
                <div>
                  <h3>Customer</h3>
                  <p>{displayName(job.customer?.name)}</p>
                  <p>
                    {displayName(job.customer?.mobileNumber)}
                  </p>
                </div>

                <div>
                  <h3>Assigned worker</h3>
                  <p>
                    {displayName(job.worker?.name, "Not assigned")}
                  </p>
                  <p>
                    {displayName(job.worker?.mobileNumber)}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="job-detail-section">
            <h2>Workflow</h2>

            <p className="job-detail-muted">
              Current server state: <strong>{status}</strong>. This
              guide shows the primary lifecycle. The backend remains
              responsible for validating every transition.
            </p>

            <ol className="job-workflow-list">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isCurrent = stage.key === status;

                const isEarlier =
                  currentStageIndex >= 0 &&
                  index < currentStageIndex;

                return (
                  <li
                    key={stage.key}
                    className={[
                      isCurrent ? "is-current" : "",
                      isEarlier ? "is-earlier" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={
                      isCurrent ? "step" : undefined
                    }
                  >
                    <span
                      className="job-workflow-marker"
                      aria-hidden="true"
                    >
                      {isCurrent
                        ? "●"
                        : isEarlier
                          ? "✓"
                          : "○"}
                    </span>

                    <span>{stage.label}</span>
                  </li>
                );
              })}
            </ol>

            {status === "ReworkRequired" && (
              <div className="job-detail-notice" role="note">
                The customer requested rework. The assigned worker
                must resume rework, complete the work again and
                provide updated evidence.
              </div>
            )}

            {["Reject", "Rejected", "Cancelled"].includes(status) && (
              <div className="job-detail-notice" role="note">
                This job is in a closed state. If this is unexpected,
                check the backend workflow rules and job history.
              </div>
            )}
          </section>

          <EvidenceGallery
            title="Before-work evidence"
            media={beforeMedia}
            prefix="Before-work photo"
            emptyText="No before-work evidence is attached."
          />

          {afterMedia.length > 0 && (
            <EvidenceGallery
              title="After-work evidence"
              media={afterMedia}
              prefix="After-work photo"
              emptyText="No after-work evidence is attached."
            />
          )}

          {estimate && (
            <section className="job-detail-section">
              <h2>Worker estimate</h2>

              <div className="job-detail-facts">
                <div>
                  <span>Estimated amount</span>
                  <strong>
                    {estimate.budget != null
                      ? `₹${Number(
                          estimate.budget
                        ).toLocaleString("en-IN")}`
                      : "Not provided"}
                  </strong>
                </div>

                <div className="job-detail-fact-wide">
                  <span>Diagnosis / actual problem</span>
                  <strong>
                    {displayName(estimate.actualProblem)}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {reworkMedia.length > 0 && (
            <EvidenceGallery
              title="Rework evidence"
              media={reworkMedia}
              prefix="Rework photo"
              emptyText="No rework evidence is attached."
            />
          )}

          <section className="job-detail-section job-detail-actions">
            <h2>Available actions</h2>

            <p className="job-detail-muted">
              Actions depend on your role and the current job status.
              The backend must independently enforce authorization
              and valid state transitions.
            </p>

            {/* ADMIN / OPERATOR: assign a job */}

            {canAdminAssign && (
              <form
                className="job-action-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  const selectedWorkerId = workerId.trim();

                  if (!selectedWorkerId) {
                    setActionError(
                      "Select an online worker or enter a worker ID."
                    );
                    return;
                  }

                  void performAction(
                    (keyFor) =>
                      assignJob(
                        id,
                        selectedWorkerId,
                        keyFor(
                          `assign:${id}:${selectedWorkerId}`
                        )
                      ),
                    "Job assigned."
                  );
                }}
              >
                <label htmlFor="assign-worker-select">
                  Online workers
                </label>

                <div className="job-detail-inline-control">
                  <select
                    id="assign-worker-select"
                    value={workerId}
                    onChange={(event) =>
                      setWorkerId(event.target.value)
                    }
                    disabled={workersLoading || isActing}
                  >
                    <option value="">
                      {workersLoading
                        ? "Loading online workers…"
                        : "Choose an online worker"}
                    </option>

                    {onlineWorkers.map((worker) => {
                      const value = getId(worker);

                      return (
                        <option key={value} value={value}>
                          {displayName(worker.name, "Worker")} —{" "}
                          {value}
                          {worker.lastHeartbeat
                            ? ` · heartbeat ${formatDate(
                                worker.lastHeartbeat
                              )}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    className="job-action-secondary"
                    onClick={() => void loadOnlineWorkers()}
                    disabled={workersLoading || isActing}
                  >
                    Refresh workers
                  </button>
                </div>

                {workersError && (
                  <p
                    className="job-detail-inline-error"
                    role="status"
                  >
                    {workersError}
                  </p>
                )}

                <details className="job-detail-manual-worker">
                  <summary>Enter a worker ID manually</summary>

                  <label htmlFor="assign-worker-id">
                    Worker user ID
                  </label>

                  <input
                    id="assign-worker-id"
                    value={workerId}
                    onChange={(event) =>
                      setWorkerId(event.target.value)
                    }
                    placeholder="Paste the worker's MongoDB user ID"
                    autoComplete="off"
                  />
                </details>

                <p className="job-detail-muted">
                  Online presence is a convenience for choosing a
                  worker. The backend must validate the assignment.
                </p>

                <button
                  type="submit"
                  disabled={isActing || !workerId.trim()}
                >
                  {isActing ? "Assigning…" : "Assign job"}
                </button>
              </form>
            )}

            {/* WORKER: accept or decline */}

            {allowAccept && (
              <div className="job-action-buttons">
                <button
                  type="button"
                  disabled={isActing}
                  onClick={() =>
                    void performAction(
                      (keyFor) =>
                        acceptJob(
                          id,
                          keyFor(`accept:${id}`)
                        ),
                      "Job accepted."
                    )
                  }
                >
                  Accept job
                </button>

                <button
                  type="button"
                  className="job-action-secondary"
                  disabled={isActing}
                  onClick={() =>
                    void performAction(
                      (keyFor) =>
                        declineJob(
                          id,
                          keyFor(`decline:${id}`)
                        ),
                      "Assignment declined."
                    )
                  }
                >
                  Decline assignment
                </button>
              </div>
            )}

            {/* WORKER: mark arrival / begin checking */}

            {allowChecking && (
              <button
                type="button"
                disabled={isActing}
                onClick={() =>
                  void performAction(
                    (keyFor) =>
                      markJobChecking(
                        id,
                        keyFor(`checking:${id}`)
                      ),
                    "Job marked as Checking."
                  )
                }
              >
                {isActing
                  ? "Updating…"
                  : "Mark arrival / start checking"}
              </button>
            )}

            {/* WORKER: submit estimate */}

            {allowEstimate && (
              <form
                className="job-action-form"
                onSubmit={handleEstimateSubmit}
              >
                <label htmlFor="estimate-budget">
                  Estimated cost (₹)
                </label>

                <input
                  id="estimate-budget"
                  type="number"
                  min="0.01"
                  max="100000000"
                  step="0.01"
                  inputMode="decimal"
                  value={estimateBudget}
                  onChange={(event) =>
                    setEstimateBudget(event.target.value)
                  }
                  required
                />

                <label htmlFor="actual-problem">
                  Diagnosis / actual problem
                </label>

                <textarea
                  id="actual-problem"
                  rows={4}
                  minLength={3}
                  maxLength={2000}
                  value={actualProblem}
                  onChange={(event) =>
                    setActualProblem(event.target.value)
                  }
                  placeholder="Explain what you found during checking…"
                  required
                />

                <button type="submit" disabled={isActing}>
                  {isActing
                    ? "Submitting estimate…"
                    : "Submit estimate"}
                </button>
              </form>
            )}

            {/* CUSTOMER: approve, temporary fix or reject estimate */}

            {allowApprove && (
              <div className="job-action-stack">
                <div className="job-action-buttons">
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() =>
                      void performAction(
                        (keyFor) =>
                          approveJobEstimate(
                            id,
                            "InProgress",
                            keyFor(
                              `approval:${id}:InProgress`
                            )
                          ),
                        "Estimate approved. Work can begin."
                      )
                    }
                  >
                    Approve estimate
                  </button>

                  <button
                    type="button"
                    className="job-action-secondary"
                    disabled={isActing}
                    onClick={() =>
                      void performAction(
                        (keyFor) =>
                          approveJobEstimate(
                            id,
                            "TemporaryFixApproved",
                            keyFor(
                              `approval:${id}:TemporaryFixApproved`
                            )
                          ),
                        "Temporary fix approved."
                      )
                    }
                  >
                    Approve temporary fix
                  </button>

                  <button
                    type="button"
                    className="job-action-danger"
                    disabled={isActing}
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Reject this estimate and close the job?"
                      );

                      if (!confirmed) return;

                      void performAction(
                        (keyFor) =>
                          approveJobEstimate(
                            id,
                            "Reject",
                            keyFor(`approval:${id}:Reject`)
                          ),
                        "Estimate rejected."
                      );
                    }}
                  >
                    Reject estimate
                  </button>
                </div>
              </div>
            )}

            {/* CUSTOMER: continue after an approved temporary fix */}

            {allowContinueAfterTemporaryFix && (
              <button
                type="button"
                disabled={isActing}
                onClick={() =>
                  void performAction(
                    (keyFor) =>
                      approveJobEstimate(
                        id,
                        "InProgress",
                        keyFor(
                          `approval:${id}:InProgress`
                        )
                      ),
                    "Job moved to In Progress."
                  )
                }
              >
                Continue with full work
              </button>
            )}

            {/* WORKER: complete work with evidence */}

            {allowComplete && (
              <div className="job-action-form">
                <label htmlFor="after-work-files">
                  After-work photos (required)
                </label>

                <input
                  id="after-work-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) =>
                    handleEvidenceChange(
                      event,
                      setAfterFiles
                    )
                  }
                />

                <p className="job-detail-muted">
                  {afterFiles.length} photo(s) selected. Choose up
                  to {MAX_EVIDENCE_FILES} photos, with a maximum
                  of 10 MB per photo.
                </p>

                {afterFiles.length > 0 && (
                  <ul className="job-detail-selected-files">
                    {afterFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${file.lastModified}-${index}`}
                      >
                        {file.name} ·{" "}
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  disabled={
                    isActing || afterFiles.length === 0
                  }
                  onClick={() =>
                    void performAction(
                      async (keyFor) => {
                        const mediaIds =
                          await uploadEvidence(afterFiles);

                        if (!mediaIds.length) {
                          throw new Error(
                            "Add at least one after-work photo."
                          );
                        }

                        return completeJob(
                          id,
                          mediaIds,
                          keyFor(
                            `complete:${id}:${mediaIds.join(",")}`
                          )
                        );
                      },
                      "Work marked complete."
                    )
                  }
                >
                  {isActing
                    ? "Uploading / completing…"
                    : "Complete work"}
                </button>
              </div>
            )}

            {/* CUSTOMER: verify or request rework */}

            {allowVerify && (
              <div className="job-action-stack">
                <button
                  type="button"
                  disabled={isActing}
                  onClick={() =>
                    void performAction(
                      (keyFor) =>
                        verifyJob(
                          id,
                          keyFor(`verify:${id}`)
                        ),
                      "Job verified successfully."
                    )
                  }
                >
                  Verify completed work
                </button>

                {allowRework && (
                  <div className="job-action-form">
                    <label htmlFor="rework-files">
                      Evidence for rework (required)
                    </label>

                    <input
                      id="rework-files"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        handleEvidenceChange(
                          event,
                          setReworkFiles
                        )
                      }
                    />

                    <p className="job-detail-muted">
                      {reworkFiles.length} photo(s) selected.
                    </p>

                    {reworkFiles.length > 0 && (
                      <ul className="job-detail-selected-files">
                        {reworkFiles.map((file, index) => (
                          <li
                            key={`${file.name}-${file.lastModified}-${index}`}
                          >
                            {file.name} ·{" "}
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      type="button"
                      className="job-action-secondary"
                      disabled={
                        isActing || reworkFiles.length === 0
                      }
                      onClick={() =>
                        void performAction(
                          async (keyFor) => {
                            const mediaIds =
                              await uploadEvidence(reworkFiles);

                            if (!mediaIds.length) {
                              throw new Error(
                                "Add at least one photo that shows the issue."
                              );
                            }

                            return requestJobRework(
                              id,
                              mediaIds,
                              keyFor(
                                `rework:${id}:${mediaIds.join(",")}`
                              )
                            );
                          },
                          "Rework requested."
                        )
                      }
                    >
                      Request rework
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* WORKER: resume rework */}

            {allowResume && (
              <button
                type="button"
                disabled={isActing}
                onClick={() =>
                  void performAction(
                    (keyFor) =>
                      resumeJobAfterRework(
                        id,
                        keyFor(`resume-rework:${id}`)
                      ),
                    "Job returned to In Progress."
                  )
                }
              >
                Resume rework
              </button>
            )}

            {!canAdminAssign &&
              !allowAccept &&
              !allowChecking &&
              !allowEstimate &&
              !allowApprove &&
              !allowContinueAfterTemporaryFix &&
              !allowComplete &&
              !allowVerify &&
              !allowResume && (
                <p className="job-detail-muted">
                  There are no workflow actions available for your
                  account and this job's current state.
                </p>
              )}
          </section>
        </section>
      </div>
    </main>
  );
}

export default JobDetails;