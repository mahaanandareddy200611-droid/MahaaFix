
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getWorkRecordById,
  updateWorkRecord,
  deleteWorkRecord,
  addReview,
  updateReview,
  addComment,
} from "../services/workrecord.service";

import "../css/WorkRecordDetails.css";

const INITIAL_EDIT_FORM = {
  title: "",
  description: "",
  category: "",
  type: "service",
  amount: "",
  visibility: "public",
  customerWhatsappNumber: "",
};

const MAX_TEXT_LENGTH = 1000;

function createRequestKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `mf-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function getId(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(value._id || value.id || "");
}

function formatDate(value, includeTime = false) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === "") {
    return "Not provided";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Not provided";
  }

  return `₹${numericAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function getRequestError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 400) {
    return message || "The submitted information is invalid.";
  }

  if (status === 401) {
    return "Your session may have expired. Please sign in again.";
  }

  if (status === 403) {
    return message || "You are not allowed to perform this action.";
  }

  if (status === 404) {
    return message || "This work record could not be found.";
  }

  if (status === 409) {
    return (
      message ||
      "The record changed on the server. Refresh its latest state."
    );
  }

  if (status === 413) {
    return "The submitted content is too large.";
  }

  if (status === 422) {
    return message || "The submitted information failed validation.";
  }

  if (status === 429) {
    return "Too many requests. Wait a moment before trying again.";
  }

  if (status >= 500) {
    return "The server encountered an error. Please try again.";
  }

  if (error?.request && !error?.response) {
    return (
      "No server response was received. The operation may have " +
      "succeeded. Refresh this record before retrying."
    );
  }

  return message || error?.message || "The request failed.";
}

function normalizeMedia(media) {
  if (Array.isArray(media)) return media;
  if (!media) return [];

  return [media];
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

function getMediaName(media, index) {
  if (media && typeof media === "object") {
    return (
      media.originalName ||
      media.filename ||
      `Work evidence ${index + 1}`
    );
  }

  return `Work evidence ${index + 1}`;
}

function getMediaMimeType(media) {
  return String(
    media?.mimeType ||
      media?.mimetype ||
      media?.format ||
      ""
  ).toLowerCase();
}

function getMediaKind(media) {
  const mimeType = getMediaMimeType(media);
  const storedType = String(media?.type || "").toLowerCase();

  if (
    mimeType.startsWith("image/") ||
    storedType === "image"
  ) {
    return "image";
  }

  if (
    mimeType.startsWith("video/") ||
    storedType === "video"
  ) {
    return "video";
  }

  if (
    mimeType.startsWith("audio/") ||
    storedType === "voice" ||
    storedType === "audio"
  ) {
    return "audio";
  }

  if (
    mimeType === "application/pdf" ||
    storedType === "pdf"
  ) {
    return "pdf";
  }

  return "file";
}

function getPersonName(value, fallback = "MahaaFix user") {
  if (typeof value === "string") return fallback;

  return value?.name || fallback;
}

function getStarLabel(rating) {
  const value = Number(rating);

  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return "Not rated";
  }

  return `${value}/5`;
}

function MediaGallery({ media }) {
  const items = normalizeMedia(media);

  if (!items.length) {
    return (
      <p className="work-record-detail-muted">
        No attachments are available for this record.
      </p>
    );
  }

  return (
    <div className="work-record-media-grid">
      {items.map((item, index) => {
        const mediaId = getId(item);
        const url = getMediaUrl(item);
        const label = getMediaName(item, index);
        const kind = getMediaKind(item);

        return (
          <figure
            className="work-record-media-item"
            key={mediaId || `${label}-${index}`}
          >
            {url && kind === "image" && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${label} in a new tab`}
              >
                <img
                  src={url}
                  alt={label}
                  loading="lazy"
                />
              </a>
            )}

            {url && kind === "video" && (
              <video
                controls
                preload="metadata"
                aria-label={label}
              >
                <source
                  src={url}
                  type={getMediaMimeType(item) || undefined}
                />
                Your browser does not support this video.
              </video>
            )}

            {url && kind === "audio" && (
              <div className="work-record-media-audio">
                <span aria-hidden="true">♫</span>
                <audio controls preload="metadata">
                  <source
                    src={url}
                    type={getMediaMimeType(item) || undefined}
                  />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {url && kind === "pdf" && (
              <div className="work-record-media-file">
                <span aria-hidden="true">PDF</span>
                <a href={url} target="_blank" rel="noreferrer">
                  Open PDF
                </a>
              </div>
            )}

            {url && kind === "file" && (
              <div className="work-record-media-file">
                <span aria-hidden="true">FILE</span>
                <a href={url} target="_blank" rel="noreferrer">
                  Open attachment
                </a>
              </div>
            )}

            {!url && (
              <div className="work-record-media-unavailable">
                Preview unavailable
              </div>
            )}

            <figcaption>{label}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function WorkRecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserId = getId(user?._id || user?.id);
  const role = String(user?.role || "").toLowerCase();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [commentText, setCommentText] = useState("");

  // Keep an idempotency key for the same logical action when retrying.
  const mutationKeys = useRef(new Map());

  const loadRecord = useCallback(
    async ({ signal, silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        const response = await getWorkRecordById(
          id,
          signal ? { signal } : {}
        );

        if (signal?.aborted) return null;

        const data = response?.data?.data;

        if (!data?._id) {
          throw new Error(
            "The API returned an unexpected work-record response."
          );
        }

        setRecord(data);

        return data;
      } catch (error) {
        if (
          signal?.aborted ||
          error?.code === "ERR_CANCELED"
        ) {
          return null;
        }

        setPageError(getRequestError(error));

        return null;
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadRecord({ signal: controller.signal });

    return () => controller.abort();
  }, [loadRecord]);

  const workerId = getId(record?.worker);
  const customerId = getId(record?.customer);

  const isOwner = Boolean(
    currentUserId && workerId && currentUserId === workerId
  );

  const isAssociatedCustomer = Boolean(
    currentUserId &&
      customerId &&
      currentUserId === customerId
  );

  const isAdministrator = ["admin", "operator"].includes(role);

  const canManageRecord = isOwner && role === "worker";

  const canEdit =
    canManageRecord &&
    record?.engagementType === "contract";

  const canReview =
    role === "customer" && isAssociatedCustomer;

  const canComment =
    record?.visibility !== "private" ||
    isOwner ||
    isAssociatedCustomer ||
    isAdministrator;

  const reviews = Array.isArray(record?.reviews)
    ? record.reviews
    : [];

  const comments = Array.isArray(record?.comments)
    ? record.comments
    : [];

  const media = normalizeMedia(record?.Media);

  const existingReview = reviews.find(
    (item) => getId(item.reviewedBy) === currentUserId
  );

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : null;

  // Populate the edit form when the loaded record changes.
  useEffect(() => {
    if (!record) return;

    setEditForm({
      title: record.title || "",
      description: record.description || "",
      category: record.category || "",
      type: record.type || "service",
      amount: String(record.amount ?? ""),
      visibility: record.visibility || "public",
      customerWhatsappNumber:
        record.customerWhatsappNumber || "",
    });

    const ownReview = (record.reviews || []).find(
      (item) => getId(item.reviewedBy) === currentUserId
    );

    setRating(String(ownReview?.rating || 5));
    setReviewText(ownReview?.review || "");
  }, [record, currentUserId]);

  function getMutationKey(scope) {
    if (!mutationKeys.current.has(scope)) {
      mutationKeys.current.set(scope, createRequestKey());
    }

    return mutationKeys.current.get(scope);
  }

  async function runAction(
    scope,
    action,
    successMessage,
    { reload = true } = {}
  ) {
    if (busyRef.current) return false;

    busyRef.current = true;
    setBusy(true);
    setActionError("");
    setNotice("");

    const key = getMutationKey(scope);

    try {
      await action(key);

      // The operation succeeded; a future independent action gets a new key.
      mutationKeys.current.delete(scope);

      if (reload) {
        const freshRecord = await loadRecord({ silent: true });

        if (!freshRecord) {
          setNotice(
            `${successMessage} The action succeeded, but the latest ` +
              "record could not be loaded. Refresh before continuing."
          );

          return true;
        }
      }

      setNotice(successMessage);

      return true;
    } catch (error) {
      setActionError(getRequestError(error));

      // A timeout leaves the outcome uncertain. Keep the same key and
      // refresh the record instead of blindly issuing a new mutation.
      if (
        error?.response?.status === 409 ||
        (error?.request && !error?.response)
      ) {
        await loadRecord({ silent: true });
      }

      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleUpdate(event) {
    event.preventDefault();

    const title = editForm.title.trim();
    const description = editForm.description.trim();
    const category = editForm.category.trim();
    const amount = Number(editForm.amount);
    const customerWhatsappNumber =
      editForm.customerWhatsappNumber.trim();

    if (!title || title.length > 100) {
      setActionError(
        "Title is required and must be no longer than 100 characters."
      );
      return;
    }

    if (description.length < 25) {
      setActionError(
        "Description must contain at least 25 characters."
      );
      return;
    }

    if (!category) {
      setActionError("Category is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setActionError(
        "Amount must be a valid number greater than or equal to zero."
      );
      return;
    }

    const payload = {
      title,
      description,
      category,
      type: editForm.type,
      amount,
      visibility: editForm.visibility,
      customerWhatsappNumber,
    };

    const scope = `update:${id}:${JSON.stringify(payload)}`;

    const succeeded = await runAction(
      scope,
      (key) => updateWorkRecord(id, payload, key),
      "Work record updated successfully."
    );

    if (succeeded) {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;

    const succeeded = await runAction(
      `delete:${id}`,
      (key) => deleteWorkRecord(id, key),
      "Work record deleted.",
      { reload: false }
    );

    if (succeeded) {
      navigate("/work-records", { replace: true });
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    const numericRating = Number(rating);
    const review = reviewText.trim();

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setActionError("Select a rating from 1 to 5.");
      return;
    }

    if (!review || review.length > MAX_TEXT_LENGTH) {
      setActionError(
        "Write a review between 1 and 1000 characters."
      );
      return;
    }

    if (!canReview) {
      setActionError(
        "Only the customer associated with this record can review it."
      );
      return;
    }

    const payload = {
      rating: numericRating,
      review,
    };

    const operation = existingReview ? "update" : "create";

    const scope =
      `review:${operation}:${id}:${JSON.stringify(payload)}`;

    await runAction(
      scope,
      (key) =>
        existingReview
          ? updateReview(id, payload, key)
          : addReview(id, payload, key),
      existingReview
        ? "Your review was updated."
        : "Your review was submitted."
    );
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    const comment = commentText.trim();

    if (!comment || comment.length > MAX_TEXT_LENGTH) {
      setActionError(
        "Enter a comment between 1 and 1000 characters."
      );
      return;
    }

    if (!canComment) {
      setActionError(
        "You are not authorized to comment on this private record."
      );
      return;
    }

    const payload = { comment };
    const scope = `comment:${id}:${comment}`;

    const succeeded = await runAction(
      scope,
      (key) => addComment(id, payload, key),
      "Comment added successfully."
    );

    // Preserve the user's comment when a request fails.
    if (succeeded) {
      setCommentText("");
    }
  }

  if (loading) {
    return (
      <main className="work-record-detail-page">
        <div
          className="work-record-detail-state"
          role="status"
          aria-live="polite"
        >
          <span className="work-record-detail-spinner" />
          <p>Loading work record…</p>
        </div>
      </main>
    );
  }

  if (pageError && !record) {
    return (
      <main className="work-record-detail-page">
        <section className="work-record-detail-state">
          <h1>Unable to load work record</h1>

          <p role="alert">{pageError}</p>

          <div className="work-record-detail-actions">
            <button
              className="work-record-primary"
              type="button"
              onClick={() => void loadRecord()}
            >
              Retry
            </button>

            <Link to="/work-records">
              Back to work records
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!record) return null;

  return (
    <main className="work-record-detail-page">
      <div className="work-record-detail-shell">
        <header className="work-record-detail-topbar">
          <Link to="/work-records" className="work-record-back-link">
            <span aria-hidden="true">←</span>
            Work records
          </Link>

          <div className="work-record-brand">MAHAAFIX</div>

          <button
            className="work-record-refresh"
            type="button"
            disabled={busy || refreshing}
            onClick={() => void loadRecord({ silent: true })}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {pageError && (
          <div
            className="work-record-detail-error"
            role="alert"
          >
            {pageError}
          </div>
        )}

        {actionError && (
          <div
            className="work-record-detail-error"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {notice && (
          <div
            className="work-record-detail-success"
            role="status"
            aria-live="polite"
          >
            {notice}
          </div>
        )}

        <article className="work-record-detail-card">
          <header className="work-record-detail-heading">
            <div className="work-record-detail-title-area">
              <p className="work-record-detail-eyebrow">
                VERIFIED WORK HISTORY
              </p>

              <h1>
                {record.title || "Untitled work record"}
              </h1>

              <p className="work-record-detail-description">
                {record.description || "No description available."}
              </p>
            </div>

            <div className="work-record-detail-badges">
              <span
                className={`work-record-detail-status status-${String(
                  record.visibility || "public"
                ).toLowerCase()}`}
              >
                {record.visibility || "public"}
              </span>

              <span className="work-record-detail-type">
                {record.engagementType || "work"}
              </span>
            </div>
          </header>

          <section className="work-record-detail-section">
            <div className="work-record-detail-section-heading">
              <h2>Record information</h2>
            </div>

            <dl className="work-record-detail-facts">
              <div>
                <dt>Professional</dt>
                <dd>{getPersonName(record.worker, "Work professional")}</dd>
              </div>

              <div>
                <dt>Category</dt>
                <dd>{record.category || "Not specified"}</dd>
              </div>

              <div>
                <dt>Work type</dt>
                <dd>{record.type || "Not specified"}</dd>
              </div>

              <div>
                <dt>City</dt>
                <dd>{record.city || "Not specified"}</dd>
              </div>

              <div>
                <dt>Recorded amount</dt>
                <dd>{formatAmount(record.amount)}</dd>
              </div>

              <div>
                <dt>Created</dt>
                <dd>{formatDate(record.createdAt)}</dd>
              </div>

              <div>
                <dt>Last updated</dt>
                <dd>{formatDate(record.updatedAt, true)}</dd>
              </div>

              <div>
                <dt>Attachments</dt>
                <dd>{media.length}</dd>
              </div>

              <div>
                <dt>Reviews</dt>
                <dd>
                  {averageRating
                    ? `${averageRating}/5 (${reviews.length})`
                    : "No reviews yet"}
                </dd>
              </div>

              {record.customerName && (
                <div>
                  <dt>Customer</dt>
                  <dd>{record.customerName}</dd>
                </div>
              )}

              {record.customerWhatsappNumber && (
                <div>
                  <dt>Customer WhatsApp</dt>
                  <dd>
                    {record.customerWhatsappNumber}
                  </dd>
                </div>
              )}
            </dl>

            {record._id && (
              <p className="work-record-detail-id">
                Record ID: {record._id}
              </p>
            )}
          </section>

          <section className="work-record-detail-section">
            <div className="work-record-detail-section-heading">
              <h2>Work evidence and attachments</h2>
              <span>{media.length} file(s)</span>
            </div>

            <MediaGallery media={media} />
          </section>

          {canManageRecord && (
            <section className="work-record-detail-section">
              <h2>Owner actions</h2>

              <p className="work-record-detail-muted">
                You are the record owner. Editing is available for
                contract records; deletion is handled separately.
              </p>

              <div className="work-record-detail-actions">
                {canEdit && !editing && (
                  <button
                    type="button"
                    className="work-record-primary"
                    disabled={busy}
                    onClick={() => {
                      setActionError("");
                      setNotice("");
                      setEditing(true);
                    }}
                  >
                    Edit contract record
                  </button>
                )}

                {!canEdit && record.engagementType !== "contract" && (
                  <span className="work-record-detail-inline-note">
                    One-time work records cannot be edited.
                  </span>
                )}

                {!confirmDelete ? (
                  <button
                    type="button"
                    className="work-record-danger"
                    disabled={busy}
                    onClick={() => {
                      setActionError("");
                      setConfirmDelete(true);
                    }}
                  >
                    Delete record
                  </button>
                ) : (
                  <div className="work-record-confirm-delete">
                    <p>
                      Delete this work record permanently? This
                      action cannot be undone from this page.
                    </p>

                    <div className="work-record-detail-actions">
                      <button
                        type="button"
                        className="work-record-danger"
                        disabled={busy}
                        onClick={() => void handleDelete()}
                      >
                        {busy
                          ? "Deleting…"
                          : "Confirm deletion"}
                      </button>

                      <button
                        type="button"
                        className="work-record-secondary"
                        disabled={busy}
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {editing && canEdit && (
            <section className="work-record-detail-section">
              <h2>Edit contract record</h2>

              <form
                className="work-record-edit-form"
                onSubmit={handleUpdate}
              >
                <div className="work-record-form-field">
                  <label htmlFor="edit-title">Title</label>
                  <input
                    id="edit-title"
                    name="title"
                    type="text"
                    maxLength={100}
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    disabled={busy}
                  />
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="edit-description">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    minLength={25}
                    maxLength={5000}
                    rows={5}
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                    disabled={busy}
                  />
                  <small>
                    Minimum 25 characters.
                  </small>
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="edit-category">Category</label>
                  <input
                    id="edit-category"
                    name="category"
                    type="text"
                    maxLength={100}
                    value={editForm.category}
                    onChange={handleEditChange}
                    required
                    disabled={busy}
                  />
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="edit-type">Work type</label>
                  <select
                    id="edit-type"
                    name="type"
                    value={editForm.type}
                    onChange={handleEditChange}
                    required
                    disabled={busy}
                  >
                    <option value="New">New</option>
                    <option value="installation">Installation</option>
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="replacement">Replacement</option>
                    <option value="inspection">Inspection</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="edit-amount">
                    Amount (₹)
                  </label>
                  <input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={editForm.amount}
                    onChange={handleEditChange}
                    required
                    disabled={busy}
                  />
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="edit-visibility">
                    Visibility
                  </label>
                  <select
                    id="edit-visibility"
                    name="visibility"
                    value={editForm.visibility}
                    onChange={handleEditChange}
                    required
                    disabled={busy}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="edit-whatsapp">
                    Customer WhatsApp number
                  </label>
                  <input
                    id="edit-whatsapp"
                    name="customerWhatsappNumber"
                    type="tel"
                    autoComplete="tel"
                    value={editForm.customerWhatsappNumber}
                    onChange={handleEditChange}
                    disabled={busy}
                  />
                </div>

                <div className="work-record-detail-actions">
                  <button
                    type="submit"
                    className="work-record-primary"
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save changes"}
                  </button>

                  <button
                    type="button"
                    className="work-record-secondary"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      setActionError("");
                    }}
                  >
                    Cancel edit
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="work-record-detail-section">
            <div className="work-record-detail-section-heading">
              <h2>Reviews</h2>
              <span>{reviews.length}</span>
            </div>

            {reviews.length === 0 ? (
              <div className="work-record-detail-empty">
                <h3>No reviews yet</h3>
                <p>
                  Reviews will appear here when the associated
                  customer submits one.
                </p>
              </div>
            ) : (
              <div className="work-record-discussion">
                {reviews.map((item, index) => (
                  <article
                    className="work-record-discussion-item"
                    key={
                      getId(item._id) ||
                      `${getId(item.reviewedBy)}-${item.createdAt || index}`
                    }
                  >
                    <div className="work-record-discussion-heading">
                      <div>
                        <strong>
                          {getPersonName(item.reviewedBy)}
                        </strong>

                        {item.createdAt && (
                          <small>
                            {formatDate(item.createdAt, true)}
                          </small>
                        )}
                      </div>

                      <span className="work-record-rating">
                        ★ {getStarLabel(item.rating)}
                      </span>
                    </div>

                    <p>{item.review || "No written review."}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {canReview && (
            <section className="work-record-detail-section">
              <h2>
                {existingReview
                  ? "Update your review"
                  : "Review this work record"}
              </h2>

              <p className="work-record-detail-muted">
                Only the customer associated with this record can
                create or update its review.
              </p>

              <form
                className="work-record-edit-form"
                onSubmit={handleReviewSubmit}
              >
                <div className="work-record-form-field">
                  <label htmlFor="review-rating">Rating</label>

                  <select
                    id="review-rating"
                    value={rating}
                    onChange={(event) =>
                      setRating(event.target.value)
                    }
                    required
                    disabled={busy}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </div>

                <div className="work-record-form-field">
                  <label htmlFor="review-text">Your review</label>

                  <textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(event) =>
                      setReviewText(event.target.value)
                    }
                    maxLength={MAX_TEXT_LENGTH}
                    rows={4}
                    required
                    disabled={busy}
                    placeholder="Describe your experience with this work…"
                  />

                  <small>
                    {reviewText.length}/{MAX_TEXT_LENGTH} characters
                  </small>
                </div>

                <button
                  type="submit"
                  className="work-record-primary"
                  disabled={busy}
                >
                  {busy
                    ? "Submitting…"
                    : existingReview
                      ? "Update review"
                      : "Submit review"}
                </button>
              </form>
            </section>
          )}

          <section className="work-record-detail-section">
            <div className="work-record-detail-section-heading">
              <h2>Comments</h2>
              <span>{comments.length}</span>
            </div>

            {comments.length === 0 ? (
              <div className="work-record-detail-empty">
                <h3>No comments yet</h3>
                <p>
                  Comments will appear here after someone adds one.
                </p>
              </div>
            ) : (
              <div className="work-record-discussion">
                {comments.map((item, index) => (
                  <article
                    className="work-record-discussion-item"
                    key={
                      getId(item._id) ||
                      `${getId(item.commentedBy)}-${item.createdAt || index}`
                    }
                  >
                    <div className="work-record-discussion-heading">
                      <strong>
                        {getPersonName(item.commentedBy)}
                      </strong>

                      {item.createdAt && (
                        <small>
                          {formatDate(item.createdAt, true)}
                        </small>
                      )}
                    </div>

                    <p>{item.comment || ""}</p>
                  </article>
                ))}
              </div>
            )}

            {canComment ? (
              <form
                className="work-record-edit-form work-record-comment-form"
                onSubmit={handleCommentSubmit}
              >
                <div className="work-record-form-field">
                  <label htmlFor="new-comment">
                    Add a comment
                  </label>

                  <textarea
                    id="new-comment"
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(event.target.value)
                    }
                    maxLength={MAX_TEXT_LENGTH}
                    rows={3}
                    required
                    disabled={busy}
                    placeholder="Write a useful comment…"
                  />

                  <small>
                    {commentText.length}/{MAX_TEXT_LENGTH} characters
                  </small>
                </div>

                <button
                  type="submit"
                  className="work-record-primary"
                  disabled={busy || !commentText.trim()}
                >
                  {busy ? "Submitting…" : "Add comment"}
                </button>
              </form>
            ) : (
              <p className="work-record-detail-muted">
                This record is private. Only its authorized
                participants can comment.
              </p>
            )}
          </section>
        </article>
      </div>
    </main>
  );
}

export default WorkRecordDetails;