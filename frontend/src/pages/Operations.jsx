
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
    getAvailableJobs,
    assignJob,
} from "../services/job.service";

import "../css/Operations.css";

function Operations() {
    const { user } = useAuth();
    const role = String(user?.role || "").toLowerCase();
    const canAssign = role === "admin";

    const [jobs, setJobs] = useState([]);
    const [workerIds, setWorkerIds] = useState({});
    const [filters, setFilters] = useState({
        category: "",
        city: "",
    });

    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busyJobId, setBusyJobId] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [notice, setNotice] = useState("");
    const [reloadVersion, setReloadVersion] = useState(0);

    const loadJobs = useCallback(async (signal) => {
        setLoading(true);
        setErrorMessage("");

        try {
            const params = {
                ...filters,
                page,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === "") {
                    delete params[key];
                }
            });

            const response = await getAvailableJobs(params, {
                signal,
            });

            const result = response.data?.data;

            if (!Array.isArray(result)) {
                throw new Error(
                    "The Jobs API returned an unexpected response."
                );
            }

            setJobs(result);
        } catch (error) {
            if (
                signal?.aborted ||
                error.code === "ERR_CANCELED"
            ) {
                return;
            }

            setErrorMessage(
                error.response?.data?.message ||
                    (error.response
                        ? `Unable to load jobs (${error.response.status}).`
                        : "Could not reach the MahaaFix server.")
            );
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [filters, page]);

    useEffect(() => {
        const controller = new AbortController();

        void loadJobs(controller.signal);

        return () => controller.abort();
    }, [loadJobs, reloadVersion]);

    function handleFilterChange(event) {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));

        setPage(0);
    }

    async function handleAssign(event, job) {
        event.preventDefault();

        const id = String(job._id || job.id || "");
        const workerId = (workerIds[id] || "").trim();

        if (!workerId) {
            setErrorMessage("Enter the worker's user ID.");
            return;
        }

        if (busyJobId) {
            return;
        }

        setBusyJobId(id);
        setErrorMessage("");
        setNotice("");

        try {
            await assignJob(
                id,
                workerId,
                crypto.randomUUID()
            );

            setNotice(
                `Job "${job.title}" was assigned successfully.`
            );

            // Created jobs disappear from the available list once assigned.
            await loadJobs();
        } catch (error) {
            const status = error.response?.status;

            if (status === 403) {
                setErrorMessage(
                    "The backend denied assignment. Verify that this account has admin privileges and is included in the server's ADMIN_EMAIL allowlist."
                );
            } else if (status === 404) {
                setErrorMessage(
                    "The job or worker was not found. Verify both IDs."
                );
            } else if (status === 409) {
                setErrorMessage(
                    error.response?.data?.message ||
                        "The worker may be offline or the job may already have been assigned. Refresh the list."
                );

                await loadJobs();
            } else if (error.request && !error.response) {
                setErrorMessage(
                    "No response was received. The assignment may have succeeded. Refresh the list and inspect the job before trying again."
                );

                await loadJobs();
            } else {
                setErrorMessage(
                    error.response?.data?.message ||
                        "Unable to assign this job."
                );
            }
        } finally {
            setBusyJobId("");
        }
    }

    return (
        <main className="operations-page">
            <div className="operations-container">
                <header className="operations-header">
                    <div>
                        <Link
                            to="/dashboard"
                            className="operations-brand"
                        >
                            MAHAAFIX / OPERATIONS
                        </Link>

                        <h1>Job assignment</h1>

                        <p>
                            Review newly created jobs and manage
                            assignment operations.
                        </p>
                    </div>

                    <span className="operations-role">
                        {role}
                    </span>
                </header>

                <section className="operations-summary">
                    <div>
                        <span>Jobs on this page</span>
                        <strong>
                            {loading ? "—" : jobs.length}
                        </strong>
                    </div>

                    <div>
                        <span>Current page</span>
                        <strong>{page + 1}</strong>
                    </div>
                </section>

                <section className="operations-filters">
                    <h2>Filter available jobs</h2>

                    <div className="operations-filter-grid">
                        <div className="operations-field">
                            <label htmlFor="operations-category">
                                Category
                            </label>

                            <select
                                id="operations-category"
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">All categories</option>
                                <option value="repair">Repair</option>
                                <option value="new-installation">
                                    New installation
                                </option>
                                <option value="inspection">Inspection</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>

                        <div className="operations-field">
                            <label htmlFor="operations-city">
                                City
                            </label>

                            <input
                                id="operations-city"
                                name="city"
                                value={filters.city}
                                onChange={handleFilterChange}
                                placeholder="Filter by city"
                            />
                        </div>

                        <div className="operations-filter-actions">
                            <button
                                type="button"
                                className="operations-secondary"
                                disabled={loading}
                                onClick={() =>
                                    setReloadVersion((value) => value + 1)
                                }
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </section>

                {notice && (
                    <div
                        className="operations-notice"
                        role="status"
                    >
                        {notice}
                    </div>
                )}

                {errorMessage && (
                    <div
                        className="operations-error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                )}

                {!canAssign && (
                    <div className="operations-notice">
                        Your account can view the available jobs here,
                        but the current backend only authorizes
                        assignment through its admin middleware.
                    </div>
                )}

                <section
                    className="operations-results"
                    aria-busy={loading}
                >
                    <div className="operations-results-heading">
                        <h2>Available jobs</h2>

                        {loading && (
                            <span role="status">Loading...</span>
                        )}
                    </div>

                    {!loading && !errorMessage && jobs.length === 0 && (
                        <div className="operations-empty">
                            <h3>No available jobs</h3>
                            <p>
                                Try another filter or refresh the list.
                            </p>
                        </div>
                    )}

                    {!loading && errorMessage && jobs.length === 0 && (
                        <div className="operations-empty">
                            <p>Jobs could not be loaded.</p>
                        </div>
                    )}

                    <div className="operations-job-list">
                        {jobs.map((job) => {
                            const id = String(job._id || job.id || "");

                            return (
                                <article
                                    className="operations-job-card"
                                    key={id}
                                >
                                    <div className="operations-job-info">
                                        <span className="operations-status">
                                            Created
                                        </span>

                                        <h3>{job.title || "Untitled job"}</h3>

                                        <p>
                                            {job.category || "Uncategorized"}
                                            {job.subCategory
                                                ? ` · ${job.subCategory}`
                                                : ""}
                                        </p>

                                        <p>
                                            {[job.address?.street, job.address?.city]
                                                .filter(Boolean)
                                                .join(", ") ||
                                                "Location unavailable"}
                                        </p>

                                        <small>Job ID: {id}</small>

                                        <Link to={`/jobs/${id}`}>
                                            Open job details →
                                        </Link>
                                    </div>

                                    {canAssign && (
                                        <form
                                            className="operations-assign-form"
                                            onSubmit={(event) =>
                                                void handleAssign(event, job)
                                            }
                                        >
                                            <label htmlFor={`worker-${id}`}>
                                                Worker user ID
                                            </label>

                                            <input
                                                id={`worker-${id}`}
                                                value={workerIds[id] || ""}
                                                onChange={(event) =>
                                                    setWorkerIds((current) => ({
                                                        ...current,
                                                        [id]: event.target.value,
                                                    }))
                                                }
                                                placeholder="MongoDB user ID"
                                                required
                                                disabled={busyJobId === id}
                                            />

                                            <button
                                                className="operations-primary"
                                                type="submit"
                                                disabled={Boolean(busyJobId)}
                                            >
                                                {busyJobId === id
                                                    ? "Assigning..."
                                                    : "Assign worker"}
                                            </button>
                                        </form>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    <nav
                        className="operations-pagination"
                        aria-label="Job pages"
                    >
                        <button
                            className="operations-secondary"
                            disabled={loading || page === 0}
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(0, current - 1)
                                )
                            }
                        >
                            Previous
                        </button>

                        <span>Page {page + 1}</span>

                        <button
                            className="operations-secondary"
                            disabled={loading || jobs.length < 20}
                            onClick={() =>
                                setPage((current) => current + 1)
                            }
                        >
                            Next
                        </button>
                    </nav>
                </section>
            </div>
        </main>
    );
}

export default Operations;