import api from "../api/api";

const JOBS_URL = "/api/v1/jobs";

/**
 * Require a usable identifier before constructing the request.
 * This prevents accidental requests to URLs like /jobs/undefined.
 */
function requireId(id, label = "Job ID") {
  if (id === null || id === undefined || String(id).trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return encodeURIComponent(String(id).trim());
}

/**
 * Mutating requests must provide an idempotency key.
 *
 * The key identifies one logical operation. If a request times out,
 * reuse the same key when retrying that exact operation.
 *
 * Do not reuse the key for a different action.
 */
function idempotencyConfig(key) {
  if (typeof key !== "string" || !key.trim()) {
    throw new Error(
      "An idempotency key is required for this operation."
    );
  }

  return {
    headers: {
      "Idempotency-Key": key.trim(),
    },
  };
}

/**
 * Validate required string payloads.
 */
function requireText(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

/**
 * Browse jobs available to the current account.
 *
 * GET /api/v1/jobs/
 */
export function getAvailableJobs(params = {}, config = {}) {
  return api.get(`${JOBS_URL}/`, {
    ...config,
    params,
  });
}

/**
 * Get jobs associated with the current user.
 *
 * GET /api/v1/jobs/my-jobs
 *
 * The backend determines which jobs the user is permitted to see.
 */
export function getMyJobs(params = {}, config = {}) {
  return api.get(`${JOBS_URL}/my-jobs`, {
    ...config,
    params,
  });
}

/**
 * Fetch a single job.
 *
 * GET /api/v1/jobs/:id
 *
 * The backend's authorization middleware controls access to details.
 */
export function getJobById(id, config = {}) {
  const jobId = requireId(id);

  return api.get(`${JOBS_URL}/${jobId}`, config);
}

/**
 * Create a new job.
 *
 * POST /api/v1/jobs/create
 *
 * `data` must match the backend's create-job validator.
 */
export function createJob(data, key) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("A valid job payload is required.");
  }

  return api.post(
    `${JOBS_URL}/create`,
    data,
    idempotencyConfig(key)
  );
}

/**
 * Admin/operator assigns a worker to a job.
 *
 * POST /api/v1/jobs/:id/assign
 *
 * IMPORTANT: the backend expects the property `workerid`.
 */
export function assignJob(id, workerId, key) {
  const jobId = requireId(id);

  const normalizedWorkerId = requireText(
    workerId,
    "Worker ID"
  );

  return api.post(
    `${JOBS_URL}/${jobId}/assign`,
    {
      workerid: normalizedWorkerId,
    },
    idempotencyConfig(key)
  );
}

/**
 * Assigned worker accepts a job.
 *
 * PATCH /api/v1/jobs/:id/accepted
 */
export function acceptJob(id, key) {
  const jobId = requireId(id);

  return api.patch(
    `${JOBS_URL}/${jobId}/accepted`,
    {},
    idempotencyConfig(key)
  );
}

/**
 * Assigned worker declines an assignment.
 *
 * PATCH /api/v1/jobs/:id/reject
 */
export function declineJob(id, key) {
  const jobId = requireId(id);

  return api.patch(
    `${JOBS_URL}/${jobId}/reject`,
    {},
    idempotencyConfig(key)
  );
}

/**
 * Worker marks arrival and begins checking the job.
 *
 * PATCH /api/v1/jobs/:id/checking
 *
 * The backend sets the status to Checking.
 */
export function markJobChecking(id, key) {
  const jobId = requireId(id);

  return api.patch(
    `${JOBS_URL}/${jobId}/checking`,
    {},
    idempotencyConfig(key)
  );
}

/**
 * Worker submits an estimate and diagnosis.
 *
 * PATCH /api/v1/jobs/:id/EstimateSubmitted
 *
 * Expected body:
 * {
 *   budget: number,
 *   actualProblem: string
 * }
 */
export function submitJobEstimate(id, data, key) {
  const jobId = requireId(id);

  if (!data || typeof data !== "object") {
    throw new Error("Estimate information is required.");
  }

  const budget = Number(data.budget);

  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error(
      "Estimate budget must be a number greater than zero."
    );
  }

  const actualProblem = requireText(
    data.actualProblem,
    "Actual problem / diagnosis"
  );

  return api.patch(
    `${JOBS_URL}/${jobId}/EstimateSubmitted`,
    {
      budget,
      actualProblem,
    },
    idempotencyConfig(key)
  );
}

/**
 * Customer decides how to proceed after reviewing an estimate.
 *
 * PATCH /api/v1/jobs/:id/Approval
 *
 * Expected decisions in the intended frontend:
 * - "InProgress"
 * - "TemporaryFixApproved"
 * - "Reject"
 *
 * NOTE: the currently published backend controller only accepts
 * TemporaryFixApproved and InProgress. Reject needs the backend
 * Approval controller to be updated before this option will work.
 */
export function approveJobEstimate(id, decision, key) {
  const jobId = requireId(id);

  const allowedDecisions = [
    "InProgress",
    "TemporaryFixApproved",
    "Reject",
  ];

  if (!allowedDecisions.includes(decision)) {
    throw new Error(
      `Unsupported estimate decision: ${String(decision)}`
    );
  }

  return api.patch(
    `${JOBS_URL}/${jobId}/Approval`,
    {
      decision,
    },
    idempotencyConfig(key)
  );
}

/**
 * Worker completes the job and submits after-work evidence.
 *
 * PATCH /api/v1/jobs/:id/WorkCompleted
 *
 * The backend expects `afterMedia`, not `mediaIds`.
 */
export function completeJob(id, afterMedia, key) {
  const jobId = requireId(id);

  if (!Array.isArray(afterMedia) || afterMedia.length === 0) {
    throw new Error(
      "At least one after-work evidence Media ID is required."
    );
  }

  return api.patch(
    `${JOBS_URL}/${jobId}/WorkCompleted`,
    {
      afterMedia,
    },
    idempotencyConfig(key)
  );
}

/**
 * Customer verifies completed work.
 *
 * PATCH /api/v1/jobs/:id/verified
 */
export function verifyJob(id, key) {
  const jobId = requireId(id);

  return api.patch(
    `${JOBS_URL}/${jobId}/verified`,
    {},
    idempotencyConfig(key)
  );
}

/**
 * Customer requests rework with supporting evidence.
 *
 * PATCH /api/v1/jobs/:id/ReworkRequired
 *
 * The backend expects `reworkProof`, not `afterMedia`.
 */
export function requestJobRework(id, reworkProof, key) {
  const jobId = requireId(id);

  if (!Array.isArray(reworkProof) || reworkProof.length === 0) {
    throw new Error(
      "At least one rework evidence Media ID is required."
    );
  }

  return api.patch(
    `${JOBS_URL}/${jobId}/ReworkRequired`,
    {
      reworkProof,
    },
    idempotencyConfig(key)
  );
}

/**
 * Assigned worker resumes the job after rework is requested.
 *
 * PATCH /api/v1/jobs/:id/status
 *
 * The backend reads req.body.newStatus.
 * Its workflow rules must allow ReworkRequired -> InProgress.
 */
export function resumeJobAfterRework(id, key) {
  const jobId = requireId(id);

  return api.patch(
    `${JOBS_URL}/${jobId}/status`,
    {
      newStatus: "InProgress",
    },
    idempotencyConfig(key)
  );
}

/**
 * Optional reusable helper for future status actions.
 * Keep this aligned with the backend workflow's permitted transitions.
 */
export function updateJobStatus(id, newStatus, key) {
  const jobId = requireId(id);

  const normalizedStatus = requireText(
    newStatus,
    "New job status"
  );

  return api.patch(
    `${JOBS_URL}/${jobId}/status`,
    {
      newStatus: normalizedStatus,
    },
    idempotencyConfig(key)
  );
}

// Compatibility alias for components that call this endpoint "getJobs".
export const getJobs = getAvailableJobs;