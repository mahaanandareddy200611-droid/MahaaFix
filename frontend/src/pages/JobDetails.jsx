
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { uploadMedia } from "../services/media.service";

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

const WORKFLOW_STAGES = [
    "Created",
    "Assigned",
    "WorkerAccepted",
    "Checking",
    "WaitingCustomerApproval",
    "InProgress",
    "WorkCompleted",
    "Verified",
];

function getId(value) {
    if (!value) return "";
    return String(typeof value === "object" ? value._id : value);
}

function displayName(value) {
    return value || "Not available";
}

function getRequestError(error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
        return "Your session has expired. Sign in again.";
    }

    if (status === 403) {
        return "Your account is not permitted to perform this action.";
    }

    if (status === 404) {
        return "This job no longer exists.";
    }

    if (status === 409) {
        return (
            message ||
            "The job state changed. Refreshing the latest server state."
        );
    }

    if (error.request && !error.response) {
        return (
            "No response was received. The operation may have succeeded. " +
            "Refresh the job before attempting the action again."
        );
    }

    return message || "The request failed. Please try again.";
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
    const [estimateBudget, setEstimateBudget] = useState("");
    const [actualProblem, setActualProblem] = useState("");
    const [afterFiles, setAfterFiles] = useState([]);
    const [reworkFiles, setReworkFiles] = useState([]);

    const uploadedMedia = useRef(new WeakMap());
    const uploadKeys = useRef(new WeakMap());
    const uncertainUpload = useRef(false);

    const loadJob = useCallback(async (signal) => {
        setLoading(true);
        setPageError("");

        try {
            const response = await getJobById(
                id,
                signal ? { signal } : {}
            );

            const record = response.data?.data;

            if (!record?._id) {
                throw new Error("The API returned an invalid job.");
            }

            setJob(record);
        } catch (error) {
            if (
                signal?.aborted ||
                error.code === "ERR_CANCELED"
            ) {
                return;
            }

            setPageError(getRequestError(error));
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        const controller = new AbortController();

        void loadJob(controller.signal);

        return () => controller.abort();
    }, [loadJob]);

    async function uploadEvidence(files) {
        if (uncertainUpload.current) {
            throw new Error(
                "A previous upload had an unknown outcome. Verify the upload before trying another one."
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
                key = crypto.randomUUID();
                uploadKeys.current.set(file, key);
            }

            let response;

            try {
                response = await uploadMedia(file, key);
            } catch (error) {
                if (error.request && !error.response) {
                    uncertainUpload.current = true;
                }

                throw error;
            }

            const media = response.data?.data;

            if (!media?._id) {
                throw new Error(
                    "The media API did not return a Media ID."
                );
            }

            const mediaId = String(media._id);

            uploadedMedia.current.set(file, mediaId);
            ids.push(mediaId);
        }

        return ids;
    }

    async function performAction(action, successText) {
        if (isActing) return;

        setIsActing(true);
        setActionError("");
        setSuccessMessage("");

        try {
            await action();

            await loadJob();

            setSuccessMessage(successText);
        } catch (error) {
            setActionError(getRequestError(error));
        } finally {
            setIsActing(false);
        }
    }

    function handleEvidenceChange(event, setter) {
        const files = Array.from(event.target.files || []);

        // Permit selecting the same file again.
        event.target.value = "";

        if (files.length > 6) {
            setActionError("Select no more than six photos.");
            return;
        }

        const invalidFile = files.find(
            (file) =>
                !file.type.startsWith("image/") ||
                file.size > 10 * 1024 * 1024
        );

        if (invalidFile) {
            setActionError(
                "Choose image files no larger than 10 MB each."
            );
            return;
        }

        setter(files);
        setActionError("");
    }

    if (loading) {
        return (
            <main className="job-detail-page">
                <div className="job-detail-state" role="status">
                    Loading job details...
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
                    <button
                        type="button"
                        onClick={() => void loadJob()}
                    >
                        Retry
                    </button>
                    <Link to="/jobs">Back to jobs</Link>
                </div>
            </main>
        );
    }

    if (!job) return null;

    const status = job.status;
    const assignedWorkerId = getId(job.worker?.workerid);

    const isAssignedWorker =
        role === "worker" &&
        assignedWorkerId === currentUserId;

    const canAdminAssign =
        ["admin", "operator"].includes(role) &&
        status === "Created";

    const beforeMedia = job.visualProofs?.beforeMedia || [];
    const afterMedia = job.visualProofs?.afterMedia || [];
    const reworkMedia = job.rework?.proofMedia || [];

    const currentStage = WORKFLOW_STAGES.indexOf(status);

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
        role === "customer" &&
        status === "WaitingCustomerApproval";

    const allowVerify =
        role === "customer" &&
        status === "WorkCompleted";

    async function handleEstimateSubmit(event) {
        event.preventDefault();

        const budget = Number(estimateBudget);

        if (!Number.isFinite(budget) || budget <= 0) {
            setActionError("Enter a budget greater than zero.");
            return;
        }

        if (!actualProblem.trim()) {
            setActionError("Describe the actual problem.");
            return;
        }

        await performAction(
            () =>
                submitJobEstimate(
                    id,
                    {
                        budget,
                        actualProblem: actualProblem.trim(),
                    },
                    crypto.randomUUID()
                ),
            "Estimate submitted."
        );
    }

    const workflowStatus = status === "ReworkRequired"
        ? "Rework requested"
        : status === "TemporaryFixApproved"
            ? "Temporary fix approved"
            : status;

    return (
        <main className="job-detail-page">
            <div className="job-detail-shell">
                <header className="job-detail-header">
                    <Link to="/jobs" className="job-detail-back">
                        ← Back to jobs
                    </Link>

                    <button
                        className="job-detail-refresh"
                        type="button"
                        disabled={isActing}
                        onClick={() => void loadJob()}
                    >
                        Refresh
                    </button>
                </header>

                {pageError && (
                    <div className="job-detail-alert" role="alert">
                        {pageError}
                    </div>
                )}

                {actionError && (
                    <div className="job-detail-alert" role="alert">
                        {actionError}
                    </div>
                )}

                {successMessage && (
                    <div
                        className="job-detail-success"
                        role="status"
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

                            <h1>{job.title}</h1>
                        </div>

                        <span className="job-detail-status">
                            {workflowStatus}
                        </span>
                    </div>

                    <p className="job-detail-description">
                        {job.description}
                    </p>

                    {job.previewOnly && (
                        <div className="job-detail-notice">
                            This is a limited preview. Customer contact
                            and exact location details are hidden until
                            the job is assigned to you.
                        </div>
                    )}

                    <div className="job-detail-facts">
                        <div>
                            <span>Category</span>
                            <strong>{job.category}</strong>
                        </div>

                        <div>
                            <span>Subcategory</span>
                            <strong>{job.subCategory}</strong>
                        </div>

                        <div>
                            <span>City</span>
                            <strong>
                                {job.address?.city || "Not available"}
                            </strong>
                        </div>

                        <div>
                            <span>Initial budget</span>
                            <strong>
                                {job.payments?.budget != null
                                    ? `₹${job.payments.budget}`
                                    : "Not available"}
                            </strong>
                        </div>
                    </div>

                    {!job.previewOnly && (
                        <section className="job-detail-section">
                            <h2>Service location</h2>

                            <dl className="job-detail-location">
                                {[
                                    ["House number", job.address?.houseNo],
                                    ["Street", job.address?.street],
                                    ["Locality", job.address?.colony],
                                    ["Landmark", job.address?.landMark],
                                    ["Contact number", job.address?.newMobile],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value || "Not provided"}</dd>
                                    </div>
                                ))}
                            </dl>

                            <div className="job-detail-parties">
                                <div>
                                    <h3>Customer</h3>
                                    <p>
                                        {displayName(job.customer?.name)}
                                    </p>
                                    <p>
                                        {displayName(
                                            job.customer?.mobileNumber
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <h3>Assigned worker</h3>
                                    <p>
                                        {job.worker?.name ||
                                            "Not assigned"}
                                    </p>
                                    <p>
                                        {job.worker?.mobileNumber ||
                                            "Not available"}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="job-detail-section">
                        <h2>Workflow stages</h2>
                        <p className="job-detail-muted">
                            Current backend state: {status}. This is a
                            lifecycle guide, not a timestamped audit history.
                        </p>

                        <ol className="job-workflow-list">
                            {WORKFLOW_STAGES.map((stage, index) => (
                                <li
                                    key={stage}
                                    className={
                                        stage === status
                                            ? "is-current"
                                            : index < currentStage
                                                ? "is-earlier"
                                                : ""
                                    }
                                >
                                    <span className="job-workflow-marker">
                                        {stage === status
                                            ? "●"
                                            : index < currentStage
                                                ? "✓"
                                                : "○"}
                                    </span>

                                    <span>{stage}</span>
                                </li>
                            ))}
                        </ol>

                        {status === "ReworkRequired" && (
                            <p className="job-detail-notice">
                                Rework has been requested. The worker
                                must resume work before completing it again.
                            </p>
                        )}
                    </section>

                    <section className="job-detail-section">
                        <h2>Before-work evidence</h2>

                        {beforeMedia.length === 0 ? (
                            <p className="job-detail-muted">
                                No before-work photos are attached.
                            </p>
                        ) : (
                            <div className="job-detail-media-grid">
                                {beforeMedia.map((media, index) => (
                                    <figure key={getId(media) || index}>
                                        {media.url && (
                                            <img
                                                src={media.url}
                                                alt={
                                                    media.originalName ||
                                                    `Before-work photo ${index + 1}`
                                                }
                                            />
                                        )}

                                        <figcaption>
                                            {media.originalName ||
                                                `Photo ${index + 1}`}
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        )}
                    </section>

                    {afterMedia.length > 0 && (
                        <section className="job-detail-section">
                            <h2>After-work evidence</h2>

                            <div className="job-detail-media-grid">
                                {afterMedia.map((media, index) => (
                                    <figure key={getId(media) || index}>
                                        {media.url && (
                                            <img
                                                src={media.url}
                                                alt={
                                                    media.originalName ||
                                                    `After-work photo ${index + 1}`
                                                }
                                            />
                                        )}
                                        <figcaption>
                                            {media.originalName ||
                                                `Photo ${index + 1}`}
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </section>
                    )}

                    {job.EstimateSubmitted && (
                        <section className="job-detail-section">
                            <h2>Worker estimate</h2>

                            <div className="job-detail-facts">
                                <div>
                                    <span>Estimated amount</span>
                                    <strong>
                                        ₹{job.EstimateSubmitted.budget}
                                    </strong>
                                </div>

                                <div>
                                    <span>Actual problem</span>
                                    <strong>
                                        {job.EstimateSubmitted.actualProblem}
                                    </strong>
                                </div>
                            </div>
                        </section>
                    )}

                    {reworkMedia.length > 0 && (
                        <section className="job-detail-section">
                            <h2>Rework evidence</h2>

                            <div className="job-detail-media-grid">
                                {reworkMedia.map((media, index) => (
                                    <figure key={getId(media) || index}>
                                        {media.url && (
                                            <img
                                                src={media.url}
                                                alt={
                                                    media.originalName ||
                                                    `Rework photo ${index + 1}`
                                                }
                                            />
                                        )}
                                        <figcaption>
                                            {media.originalName ||
                                                `Photo ${index + 1}`}
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="job-detail-section job-detail-actions">
                        <h2>Available actions</h2>

                        {canAdminAssign && (
                            <form
                                className="job-action-form"
                                onSubmit={(event) => {
                                    event.preventDefault();

                                    if (!workerId.trim()) {
                                        setActionError(
                                            "Enter the worker's user ID."
                                        );
                                        return;
                                    }

                                    void performAction(
                                        () =>
                                            assignJob(
                                                id,
                                                workerId.trim(),
                                                crypto.randomUUID()
                                            ),
                                        "Job assigned."
                                    );
                                }}
                            >
                                <label htmlFor="assign-worker-id">
                                    Worker user ID
                                </label>

                                <input
                                    id="assign-worker-id"
                                    value={workerId}
                                    onChange={(event) =>
                                        setWorkerId(event.target.value)
                                    }
                                    placeholder="Enter worker MongoDB ID"
                                    required
                                />

                                <button disabled={isActing}>
                                    {isActing
                                        ? "Assigning..."
                                        : "Assign job"}
                                </button>
                            </form>
                        )}

                        {allowAccept && (
                            <div className="job-action-buttons">
                                <button
                                    disabled={isActing}
                                    onClick={() =>
                                        void performAction(
                                            () =>
                                                acceptJob(
                                                    id,
                                                    crypto.randomUUID()
                                                ),
                                            "Job accepted."
                                        )
                                    }
                                >
                                    Accept job
                                </button>

                                <button
                                    className="job-action-secondary"
                                    disabled={isActing}
                                    onClick={() =>
                                        void performAction(
                                            () =>
                                                declineJob(
                                                    id,
                                                    crypto.randomUUID()
                                                ),
                                            "Assignment declined."
                                        )
                                    }
                                >
                                    Decline assignment
                                </button>
                            </div>
                        )}

                        {allowChecking && (
                            <button
                                disabled={isActing}
                                onClick={() =>
                                    void performAction(
                                        () =>
                                            markJobChecking(
                                                id,
                                                crypto.randomUUID()
                                            ),
                                        "Job marked as Checking."
                                    )
                                }
                            >
                                Mark arrival / start checking
                            </button>
                        )}

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
                                    step="0.01"
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
                                    value={actualProblem}
                                    onChange={(event) =>
                                        setActualProblem(event.target.value)
                                    }
                                    required
                                />

                                <button disabled={isActing}>
                                    Submit estimate
                                </button>
                            </form>
                        )}

                        {allowApprove && (
                            <button
                                disabled={isActing}
                                onClick={() =>
                                    void performAction(
                                        () =>
                                            approveJobEstimate(
                                                id,
                                                crypto.randomUUID()
                                            ),
                                        "Estimate approved; job moved to InProgress."
                                    )
                                }
                            >
                                Approve estimate and start work
                            </button>
                        )}

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
                                    {afterFiles.length} photo(s) selected.
                                    At least one is required.
                                </p>

                                <button
                                    disabled={
                                        isActing ||
                                        afterFiles.length === 0
                                    }
                                    onClick={() =>
                                        void performAction(
                                            async () => {
                                                const ids =
                                                    await uploadEvidence(
                                                        afterFiles
                                                    );

                                                return completeJob(
                                                    id,
                                                    ids,
                                                    crypto.randomUUID()
                                                );
                                            },
                                            "Work marked complete."
                                        )
                                    }
                                >
                                    Complete work
                                </button>
                            </div>
                        )}

                        {allowVerify && (
                            <div className="job-action-buttons">
                                <button
                                    disabled={isActing}
                                    onClick={() =>
                                        void performAction(
                                            () =>
                                                verifyJob(
                                                    id,
                                                    crypto.randomUUID()
                                                ),
                                            "Job verified successfully."
                                        )
                                    }
                                >
                                    Verify completed work
                                </button>

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

                                    <button
                                        className="job-action-secondary"
                                        disabled={
                                            isActing ||
                                            reworkFiles.length === 0
                                        }
                                        onClick={() =>
                                            void performAction(
                                                async () => {
                                                    const ids =
                                                        await uploadEvidence(
                                                            reworkFiles
                                                        );

                                                    return requestJobRework(
                                                        id,
                                                        ids,
                                                        crypto.randomUUID()
                                                    );
                                                },
                                                "Rework requested."
                                            )
                                        }
                                    >
                                        Request rework
                                    </button>
                                </div>
                            </div>
                        )}

                        {allowResume && (
                            <button
                                disabled={isActing}
                                onClick={() =>
                                    void performAction(
                                        () =>
                                            resumeJobAfterRework(
                                                id,
                                                crypto.randomUUID()
                                            ),
                                        "Job returned to InProgress."
                                    )
                                }
                            >
                                Resume rework
                            </button>
                        )}

                        {!job.previewOnly &&
                            !canAdminAssign &&
                            !allowAccept &&
                            !allowChecking &&
                            !allowEstimate &&
                            !allowApprove &&
                            !allowComplete &&
                            !allowVerify &&
                            !allowResume && (
                                <p className="job-detail-muted">
                                    There are no workflow actions available
                                    for your role and this job's current state.
                                </p>
                            )}
                    </section>
                </section>
            </div>
        </main>
    );
}

export default JobDetails;