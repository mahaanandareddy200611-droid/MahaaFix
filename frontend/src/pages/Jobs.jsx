
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
    getAvailableJobs,
    getMyJobs,
} from "../services/job.service";

import "../css/Jobs.css";

const initialFilters = {
    category: "",
    subCategory: "",
    city: "",
    status: "",
};

const categories = [
    ["repair", "Repair"],
    ["new-installation", "New installation"],
    ["inspection", "Inspection"],
    ["cleaning", "Cleaning"],
    ["emergency", "Emergency"],
];

const subCategories = [
    ["Electrical", "Electrical"],
    ["Plumbing", "Plumbing"],
    ["AC-repair", "AC repair"],
    ["House-cleaning", "House cleaning"],
    ["Bathroom-cleaning", "Bathroom cleaning"],
    ["ApplianceRepair", "Appliance repair"],
];

const statuses = [
    "Created",
    "Assigned",
    "WorkerAccepted",
    "Checking",
    "WaitingCustomerApproval",
    "TemporaryFixApproved",
    "InProgress",
    "WorkCompleted",
    "Verified",
    "ReworkRequired",
    "Reject",
];

function Jobs() {
    const { user } = useAuth();
    const role = String(user?.role || "").toLowerCase();
    const isWorker = role === "worker";
    const isCustomer = role === "customer";

    const [workerView, setWorkerView] = useState("available");
    const [draftFilters, setDraftFilters] = useState(initialFilters);
    const [filters, setFilters] = useState(initialFilters);
    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [reloadVersion, setReloadVersion] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchJobs() {
            setLoading(true);
            setErrorMessage("");

            try {
                const params = Object.fromEntries(
                    Object.entries(filters).filter(
                        ([, value]) => value !== ""
                    )
                );

                // Available jobs are always Created, so a status
                // filter only applies to the user's own job list.
                const useAvailableJobs =
                    isWorker && workerView === "available";

                if (useAvailableJobs) {
                    delete params.status;
                }

                params.page = page;

                const response = useAvailableJobs
                    ? await getAvailableJobs(params, {
                          signal: controller.signal,
                      })
                    : await getMyJobs(params, {
                          signal: controller.signal,
                      });

                const data = response.data?.data;

                if (!Array.isArray(data)) {
                    throw new Error(
                        "The Jobs API returned an invalid response."
                    );
                }

                setJobs(data);
            } catch (error) {
                if (
                    controller.signal.aborted ||
                    error.code === "ERR_CANCELED"
                ) {
                    return;
                }

                setJobs([]);

                const status = error.response?.status;

                if (status === 401) {
                    setErrorMessage("Please sign in again.");
                } else if (status === 403) {
                    setErrorMessage(
                        "Your account cannot access these jobs."
                    );
                } else {
                    setErrorMessage(
                        error.response?.data?.message ||
                            error.message ||
                            "Unable to load jobs."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void fetchJobs();

        return () => controller.abort();
    }, [
        filters,
        page,
        reloadVersion,
        isWorker,
        workerView,
    ]);

    function handleFilterChange(event) {
        const { name, value } = event.target;

        setDraftFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleApplyFilters(event) {
        event.preventDefault();
        setPage(0);
        setFilters({
            ...draftFilters,
            city: draftFilters.city.trim(),
        });
    }

    function handleClearFilters() {
        setDraftFilters(initialFilters);
        setFilters(initialFilters);
        setPage(0);
    }

    const heading = isWorker
        ? workerView === "available"
            ? "Available jobs"
            : "My assignments"
        : isCustomer
            ? "Your jobs"
            : "Jobs overview";

    return (
        <main className="jobs-page">
            <div className="jobs-container">
                <header className="jobs-header">
                    <div>
                        <p className="jobs-eyebrow">
                            MAHAAFIX / JOBS
                        </p>
                        <h1>{heading}</h1>
                        <p className="jobs-subtitle">
                            {isWorker
                                ? workerView === "available"
                                    ? "Browse new service requests."
                                    : "Manage jobs assigned to you and continue their workflow."
                                : isCustomer
                                    ? "Track your requests, estimates and completed work."
                                    : "Inspect jobs and open their workflow details."}
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="jobs-back-link"
                    >
                        Dashboard
                    </Link>
                </header>

                {isWorker && (
                    <div
                        className="jobs-view-tabs"
                        role="group"
                        aria-label="Job view"
                    >
                        <button
                            type="button"
                            className={
                                workerView === "available"
                                    ? "is-selected"
                                    : ""
                            }
                            aria-pressed={workerView === "available"}
                            onClick={() => {
                                setWorkerView("available");
                                setPage(0);
                            }}
                        >
                            Available jobs
                        </button>

                        <button
                            type="button"
                            className={
                                workerView === "mine"
                                    ? "is-selected"
                                    : ""
                            }
                            aria-pressed={workerView === "mine"}
                            onClick={() => {
                                setWorkerView("mine");
                                setPage(0);
                            }}
                        >
                            My assignments
                        </button>
                    </div>
                )}

                <section className="jobs-filter-panel">
                    <h2>Filter jobs</h2>

                    <form
                        className="jobs-filter-form"
                        onSubmit={handleApplyFilters}
                    >
                        <div className="jobs-field">
                            <label htmlFor="jobs-category">
                                Category
                            </label>
                            <select
                                id="jobs-category"
                                name="category"
                                value={draftFilters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">All categories</option>
                                {categories.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="jobs-field">
                            <label htmlFor="jobs-subcategory">
                                Subcategory
                            </label>
                            <select
                                id="jobs-subcategory"
                                name="subCategory"
                                value={draftFilters.subCategory}
                                onChange={handleFilterChange}
                            >
                                <option value="">All subcategories</option>
                                {subCategories.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="jobs-field">
                            <label htmlFor="jobs-city">
                                City
                            </label>
                            <input
                                id="jobs-city"
                                name="city"
                                value={draftFilters.city}
                                onChange={handleFilterChange}
                                placeholder="Enter a city"
                            />
                        </div>

                        {(!isWorker || workerView === "mine") && (
                            <div className="jobs-field">
                                <label htmlFor="jobs-status">
                                    Status
                                </label>
                                <select
                                    id="jobs-status"
                                    name="status"
                                    value={draftFilters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All statuses</option>
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="jobs-filter-actions">
                            <button
                                className="jobs-primary-button"
                                type="submit"
                            >
                                Apply filters
                            </button>
                            <button
                                className="jobs-secondary-button"
                                type="button"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </section>

                <section
                    className="jobs-results"
                    aria-busy={loading}
                >
                    <div className="jobs-results-heading">
                        <div>
                            <h2>Results</h2>
                            {!loading && !errorMessage && (
                                <p>
                                    {jobs.length} jobs on this page
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            className="jobs-refresh-button"
                            disabled={loading}
                            onClick={() =>
                                setReloadVersion((version) => version + 1)
                            }
                        >
                            Refresh
                        </button>
                    </div>

                    {loading && (
                        <div className="jobs-state" role="status">
                            Loading jobs...
                        </div>
                    )}

                    {!loading && errorMessage && (
                        <div
                            className="jobs-state jobs-state--error"
                            role="alert"
                        >
                            <p>{errorMessage}</p>
                            <button
                                className="jobs-primary-button"
                                onClick={() =>
                                    setReloadVersion((version) => version + 1)
                                }
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading &&
                        !errorMessage &&
                        jobs.length === 0 && (
                            <div className="jobs-state">
                                <h3>No jobs found</h3>
                                <p>
                                    Try a different filter or refresh later.
                                </p>
                            </div>
                        )}

                    {!loading && !errorMessage && jobs.length > 0 && (
                        <div className="jobs-list">
                            {jobs.map((job) => {
                                const id = String(job._id || job.id || "");

                                return (
                                    <article
                                        className="job-card"
                                        key={id}
                                    >
                                        <div className="job-card-main">
                                            <div className="job-card-title-row">
                                                <h3>
                                                    {job.title || "Untitled job"}
                                                </h3>

                                                <span className="job-status">
                                                    {job.status || "Created"}
                                                </span>
                                            </div>

                                            <p className="job-card-category">
                                                {job.category || "Uncategorized"}
                                                {job.subCategory
                                                    ? ` · ${job.subCategory}`
                                                    : ""}
                                            </p>

                                            <p className="job-card-location">
                                                {[
                                                    job.address?.street,
                                                    job.address?.city,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ") ||
                                                    "Location unavailable"}
                                            </p>

                                            {job.payments?.budget != null && (
                                                <p className="job-card-location">
                                                    Budget: ₹{job.payments.budget}
                                                </p>
                                            )}

                                            <Link
                                                className="job-card-open"
                                                to={`/jobs/${id}`}
                                            >
                                                View job and available actions →
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    <nav
                        className="jobs-pagination"
                        aria-label="Job pages"
                    >
                        <button
                            className="jobs-secondary-button"
                            type="button"
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
                            className="jobs-secondary-button"
                            type="button"
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

export default Jobs;