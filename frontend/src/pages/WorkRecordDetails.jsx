
import { useCallback, useEffect, useState } from "react";
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

const initialEdit = {
    title: "",
    description: "",
    category: "",
    type: "",
    amount: "",
    visibility: "public",
    customerWhatsappNumber: "",
};

function getId(value) {
    if (!value) return "";
    return String(typeof value === "object" ? value._id : value);
}

function requestError(error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) return "Please sign in again.";
    if (status === 403) return message || "You are not permitted to perform this action.";
    if (status === 404) return "This WorkRecord was not found.";
    if (status === 409) return message || "The record changed. Refresh before editing again.";
    if (status === 429) return "Too many requests. Try again later.";
    if (status >= 500) return "The server encountered an error.";

    if (error.request && !error.response) {
        return "No response was received. The request may have succeeded; refresh before retrying.";
    }

    return message || error.message || "The request failed.";
}

function WorkRecordDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const currentUserId = getId(user?._id || user?.id);
    const role = String(user?.role || "").toLowerCase();

    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [actionError, setActionError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState(initialEdit);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [rating, setRating] = useState("5");
    const [reviewText, setReviewText] = useState("");
    const [commentText, setCommentText] = useState("");

    const loadRecord = useCallback(async (signal) => {
        setLoading(true);
        setPageError("");

        try {
            const response = await getWorkRecordById(id, {
                ...(signal ? { signal } : {}),
            });

            const data = response.data?.data;

            if (!data?._id) {
                throw new Error("The API returned an invalid WorkRecord.");
            }

            setRecord(data);
        } catch (error) {
            if (signal?.aborted || error.code === "ERR_CANCELED") {
                return;
            }

            setPageError(requestError(error));
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        const controller = new AbortController();

        void loadRecord(controller.signal);

        return () => controller.abort();
    }, [loadRecord]);

    const workerId = getId(record?.worker);
    const customerId = getId(record?.customer);

    const isOwner = currentUserId === workerId;
    const isAssociatedCustomer = currentUserId === customerId;

    const canEdit =
        isOwner &&
        record?.engagementType === "contract" &&
        role === "worker";

    const existingReview = (record?.reviews || []).find(
        (item) => getId(item.reviewedBy) === currentUserId
    );

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

    async function runAction(action, message, { reload = true } = {}) {
        if (busy) return;

        setBusy(true);
        setActionError("");
        setNotice("");

        try {
            await action();

            if (reload) {
                await loadRecord();
            }

            setNotice(message);
        } catch (error) {
            setActionError(requestError(error));
        } finally {
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

        if (editForm.description.trim().length < 25) {
            setActionError(
                "Description must contain at least 25 characters."
            );
            return;
        }

        const payload = {
            title: editForm.title.trim(),
            description: editForm.description.trim(),
            category: editForm.category.trim(),
            type: editForm.type,
            amount: Number(editForm.amount),
            visibility: editForm.visibility,
            customerWhatsappNumber:
                editForm.customerWhatsappNumber.trim(),
        };

        await runAction(
            () =>
                updateWorkRecord(
                    id,
                    payload,
                    crypto.randomUUID()
                ),
            "WorkRecord updated."
        );

        setEditing(false);
    }

    async function handleDelete() {
       setBusy(true);
setActionError("");

    try {
        await deleteWorkRecord(id, crypto.randomUUID());
        navigate("/work-records", { replace: true });
    } catch (error) {
        setActionError(requestError(error));
    } finally {
        setBusy(false);
    }


    }

    async function handleReviewSubmit(event) {
        event.preventDefault();

        const payload = {
            rating: Number(rating),
            review: reviewText.trim(),
        };

        if (!payload.review) {
            setActionError("Write a review before submitting.");
            return;
        }

        await runAction(
            () =>
                existingReview
                    ? updateReview(id, payload, crypto.randomUUID())
                    : addReview(id, payload, crypto.randomUUID()),
            existingReview ? "Review updated." : "Review submitted."
        );
    }

    async function handleCommentSubmit(event) {
        event.preventDefault();

        const comment = commentText.trim();

        if (!comment) {
            setActionError("Enter a comment.");
            return;
        }

        await runAction(
            () =>
                addComment(
                    id,
                    { comment },
                    crypto.randomUUID()
                ),
            "Comment added."
        );

        setCommentText("");
    }

    if (loading) {
        return (
            <main className="work-record-detail-page">
                <div className="work-record-detail-state" role="status">
                    Loading WorkRecord...
                </div>
            </main>
        );
    }

    if (pageError && !record) {
        return (
            <main className="work-record-detail-page">
                <section className="work-record-detail-state">
                    <h1>Unable to load WorkRecord</h1>
                    <p role="alert">{pageError}</p>
                    <button
                        type="button"
                        onClick={() => void loadRecord()}
                    >
                        Retry
                    </button>
                    <Link to="/work-records">Back to records</Link>
                </section>
            </main>
        );
    }

    if (!record) return null;

    return (
        <main className="work-record-detail-page">
            <div className="work-record-detail-shell">
                <header className="work-record-detail-topbar">
                    <Link to="/work-records">
                        ← Work Records
                    </Link>

                    <span>MAHAAFIX</span>
                </header>

                {actionError && (
                    <div className="work-record-detail-error" role="alert">
                        {actionError}
                    </div>
                )}

                {notice && (
                    <div className="work-record-detail-success" role="status">
                        {notice}
                    </div>
                )}

                <article className="work-record-detail-card">
                    <header className="work-record-detail-heading">
                        <p>WORK RECORD</p>
                        <h1>{record.title}</h1>
                        <span className="work-record-detail-status">
                            {record.visibility || "public"}
                        </span>
                    </header>

                    <p className="work-record-detail-description">
                        {record.description}
                    </p>

                    <dl className="work-record-detail-facts">
                        <div>
                            <dt>Worker</dt>
                            <dd>
                                {record.worker?.name || "Work professional"}
                            </dd>
                        </div>

                        <div>
                            <dt>Category</dt>
                            <dd>{record.category}</dd>
                        </div>

                        <div>
                            <dt>Work type</dt>
                            <dd>{record.type}</dd>
                        </div>

                        <div>
                            <dt>City</dt>
                            <dd>{record.city || "Not provided"}</dd>
                        </div>

                        <div>
                            <dt>Amount</dt>
                            <dd>
                                {record.amount != null
                                    ? `₹${record.amount}`
                                    : "Not provided"}
                            </dd>
                        </div>

                        <div>
                            <dt>Engagement</dt>
                            <dd>{record.engagementType || "work"}</dd>
                        </div>

                        {record.customerWhatsappNumber && (
                            <div>
                                <dt>Customer contact</dt>
                                <dd>
                                    {record.customerWhatsappNumber}
                                </dd>
                            </div>
                        )}

                        <div>
                            <dt>Created</dt>
                            <dd>
                                {record.createdAt
                                    ? new Date(record.createdAt).toLocaleDateString()
                                    : "Not available"}
                            </dd>
                        </div>
                    </dl>

                    {Array.isArray(record.Media) && record.Media.length > 0 && (
                        <section className="work-record-detail-section">
                            <h2>Media</h2>

                            <div className="work-record-media-grid">
                                {record.Media.map((media, index) => (
                                    <figure
                                        key={getId(media) || index}
                                    >
                                        {media.url && (
                                            <img
                                                src={media.url}
                                                alt={
                                                    media.originalName ||
                                                    `Work evidence ${index + 1}`
                                                }
                                            />
                                        )}
                                        <figcaption>
                                            {media.originalName ||
                                                `Media ${index + 1}`}
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </section>
                    )}

                    {isOwner && (
                        <section className="work-record-detail-section">
                            <h2>Owner actions</h2>

                            {canEdit && !editing && (
                                <button
                                    className="work-record-primary"
                                    type="button"
                                    onClick={() => setEditing(true)}
                                >
                                    Edit contract record
                                </button>
                            )}

                            {isOwner &&
                                record.engagementType !== "contract" && (
                                    <p className="work-record-detail-muted">
                                        This is a one-time work record.
                                        The backend permits editing only
                                        contract records.
                                    </p>
                                )}

                            {!confirmDelete ? (
                                <button
                                    className="work-record-danger"
                                    type="button"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    Delete record
                                </button>
                            ) : (
                                <div className="work-record-confirm-delete">
                                    <p>
                                        Delete this WorkRecord permanently?
                                    </p>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void handleDelete()}
                                    >
                                        Confirm deletion
                                    </button>
                                    <button
                                        className="work-record-secondary"
                                        type="button"
                                        onClick={() => setConfirmDelete(false)}
                                        disabled={busy}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {editing && canEdit && (
                        <section className="work-record-detail-section">
                            <h2>Edit contract record</h2>

                            <form
                                className="work-record-edit-form"
                                onSubmit={handleUpdate}
                            >
                                <label htmlFor="edit-title">
                                    Title
                                </label>
                                <input
                                    id="edit-title"
                                    name="title"
                                    value={editForm.title}
                                    onChange={handleEditChange}
                                    maxLength={100}
                                    required
                                    disabled={busy}
                                />

                                <label htmlFor="edit-description">
                                    Description
                                </label>
                                <textarea
                                    id="edit-description"
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditChange}
                                    minLength={25}
                                    rows={4}
                                    required
                                    disabled={busy}
                                />

                                <label htmlFor="edit-category">
                                    Category
                                </label>
                                <input
                                    id="edit-category"
                                    name="category"
                                    value={editForm.category}
                                    onChange={handleEditChange}
                                    required
                                    disabled={busy}
                                />

                                <label htmlFor="edit-type">
                                    Type
                                </label>
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

                                <label htmlFor="edit-amount">
                                    Amount (₹)
                                </label>
                                <input
                                    id="edit-amount"
                                    name="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={handleEditChange}
                                    required
                                    disabled={busy}
                                />

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

                                <label htmlFor="edit-whatsapp">
                                    Customer WhatsApp number
                                </label>
                                <input
                                    id="edit-whatsapp"
                                    name="customerWhatsappNumber"
                                    value={editForm.customerWhatsappNumber}
                                    onChange={handleEditChange}
                                    required
                                    disabled={busy}
                                />

                                <div className="work-record-detail-actions">
                                    <button
                                        className="work-record-primary"
                                        disabled={busy}
                                    >
                                        {busy ? "Saving..." : "Save changes"}
                                    </button>

                                    <button
                                        className="work-record-secondary"
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        disabled={busy}
                                    >
                                        Cancel edit
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {isAssociatedCustomer && (
                        <section className="work-record-detail-section">
                            <h2>
                                {existingReview
                                    ? "Your review"
                                    : "Review this WorkRecord"}
                            </h2>

                            <form
                                className="work-record-edit-form"
                                onSubmit={handleReviewSubmit}
                            >
                                <label htmlFor="review-rating">
                                    Rating
                                </label>

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
                                        <option
                                            key={value}
                                            value={value}
                                        >
                                            {value} / 5
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="review-text">
                                    Review
                                </label>

                                <textarea
                                    id="review-text"
                                    value={reviewText}
                                    onChange={(event) =>
                                        setReviewText(event.target.value)
                                    }
                                    maxLength={1000}
                                    rows={4}
                                    required
                                    disabled={busy}
                                />

                                <button
                                    className="work-record-primary"
                                    disabled={busy}
                                >
                                    {existingReview
                                        ? "Update review"
                                        : "Submit review"}
                                </button>
                            </form>
                        </section>
                    )}

                    <section className="work-record-detail-section">
                        <h2>Reviews ({record.reviews?.length || 0})</h2>

                        {!record.reviews?.length ? (
                            <p className="work-record-detail-muted">
                                No reviews yet.
                            </p>
                        ) : (
                            <div className="work-record-discussion">
                                {record.reviews.map((item) => (
                                    <article
                                        key={getId(item._id) || `${getId(item.reviewedBy)}-${item.createdAt}`}
                                        className="work-record-discussion-item"
                                    >
                                        <div className="work-record-discussion-heading">
                                            <strong>
                                                {item.reviewedBy?.name ||
                                                    "MahaaFix user"}
                                            </strong>

                                            <span>
                                                {item.rating}/5
                                            </span>
                                        </div>

                                        <p>{item.review}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="work-record-detail-section">
                        <h2>Comments ({record.comments?.length || 0})</h2>

                        <div className="work-record-discussion">
                            {(record.comments || []).map((item) => (
                                <article
                                    key={getId(item._id)}
                                    className="work-record-discussion-item"
                                >
                                    <strong>
                                        {item.commentedBy?.name ||
                                            "MahaaFix user"}
                                    </strong>

                                    <p>{item.comment}</p>

                                    <small>
                                        {item.createdAt
                                            ? new Date(item.createdAt).toLocaleString()
                                            : ""}
                                    </small>
                                </article>
                            ))}
                        </div>

                        <form
                            className="work-record-edit-form work-record-comment-form"
                            onSubmit={handleCommentSubmit}
                        >
                            <label htmlFor="new-comment">
                                Add a comment
                            </label>

                            <textarea
                                id="new-comment"
                                value={commentText}
                                onChange={(event) =>
                                    setCommentText(event.target.value)
                                }
                                maxLength={1000}
                                rows={3}
                                required
                                disabled={busy}
                            />

                            <button
                                className="work-record-primary"
                                disabled={busy}
                            >
                                {busy ? "Submitting..." : "Add comment"}
                            </button>
                        </form>
                    </section>
                </article>
            </div>
        </main>
    );
}

export default WorkRecordDetails;