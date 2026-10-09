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
};

const categories = [
    { value: "repair", label: "Repair" },
    { value: "new-installation", label: "New installation" },
    { value: "inspection", label: "Inspection" },
    { value: "cleaning", label: "Cleaning" },
    { value: "emergency", label: "Emergency" },
];

const subCategories = [
    { value: "Electrical", label: "Electrical" },
    { value: "Plumbing", label: "Plumbing" },
    { value: "AC-repair", label: "AC repair" },
    { value: "House-cleaning", label: "House cleaning" },
    { value: "Bathroom-cleaning", label: "Bathroom cleaning" },
    { value: "ApplianceRepair", label: "Appliance repair" },
];

function getErrorMessage(error) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (status === 401) {
        return "Your session may have expired. Please sign in again.";
    }

    if (status === 403) {
        return "Your account is not permitted to access these jobs.";
    }

    if (status === 429) {
        return "Too many requests. Please wait before trying again.";
    }

    if (status >= 500) {
        return "The server encountered a problem. Please try again.";
    }

    if (error.request && !error.response) {
        return "Could not reach MahaaFix. Check your connection and retry.";
    }

    return serverMessage || "Unable to load jobs.";
}

function Jobs() {
    const { user } = useAuth();

    const role = String(user?.role || "").toLowerCase();
    const isWorker = role === "worker";

    const [draftFilters, setDraftFilters] = useState(initialFilters);
    const [filters, setFilters] = useState(initialFilters);

    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [reloadVersion, setReloadVersion] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function loadJobs() {
            setLoading(true);
            setErrorMessage("");

            try {
                const params = Object.fromEntries(
                    Object.entries(filters).filter(
                        ([, value]) => value !== ""
                    )
                );

                let response;

                if (isWorker) {
                    response = await getAvailableJobs(
                        { ...params, page },
                        { signal: controller.signal }
                    );
                } else {
                    response = await getMyJobs(
                        params,
                        { signal: controller.signal }
                    );
                }

                const results = response.data?.data;

                if (!Array.isArray(results)) {
                    throw new Error(
                        "The Jobs API returned an unexpected response."
                    );
                }

                setJobs(results);
            } catch (error) {
                if (
                    controller.signal.aborted ||
                    error.code === "ERR_CANCELED"
                ) {
                    return;
                }

                setJobs([]);

                setErrorMessage(
                    error.response
                        ? getErrorMessage(error)
                        : error.message || "Unable to load jobs."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadJobs();

        return () => {
            controller.abort();
        };
    }, [role, isWorker, filters, page, reloadVersion]);

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
        ? "Available jobs"
        : role === "customer"
            ? "Your jobs"
            : "Jobs overview";

    const description = isWorker
        ? "Browse newly created service requests."
        : role === "customer"
            ? "Review jobs associated with your account."
            : "Review the jobs returned by your account's API.";

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
                            {description}
                        </p>
                    </div>

                    <span className="jobs-role-label">
                        {role || "Member"}
                    </span>
                </header>

                <section
                    className="jobs-filter-panel"
                    aria-labelledby="jobs-filter-heading"
                >
                    <h2 id="jobs-filter-heading">
                        Find jobs
                    </h2>

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

                                {categories.map((item) => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
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

                                {subCategories.map((item) => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
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
                                type="text"
                                value={draftFilters.city}
                                onChange={handleFilterChange}
                                placeholder="Enter a city"
                            />
                        </div>

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
                    aria-labelledby="jobs-results-heading"
                    aria-busy={loading}
                >
                    <div className="jobs-results-heading">
                        <div>
                            <h2 id="jobs-results-heading">
                                {loading
                                    ? "Loading jobs..."
                                    : "Results"}
                            </h2>

                            {!loading && !errorMessage && (
                                <p>
                                    {jobs.length}{" "}
                                    {jobs.length === 1 ? "job" : "jobs"} found
                                </p>
                            )}
                        </div>

                        <button
                            className="jobs-refresh-button"
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                setReloadVersion((value) => value + 1)
                            }
                        >
                            Refresh
                        </button>
                    </div>

                    {loading && (
                        <div className="jobs-state" role="status">
                            Loading jobs from MahaaFix...
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
                                type="button"
                                onClick={() =>
                                    setReloadVersion((value) => value + 1)
                                }
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!loading &&
                        !errorMessage &&
                        jobs.length === 0 && (
                            <div className="jobs-state">
                                <h3>No jobs found</h3>

                                <p>
                                    Try changing the filters or check again later.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !errorMessage &&
                        jobs.length > 0 && (
                            <div className="jobs-list">
                                {jobs.map((job) => {
                                    const id = job._id || job.id;
                                    const city = job.address?.city;
                                    const street = job.address?.street;

                                    return (
                                        <article
                                            className="job-card"
                                            key={id}
                                        >
                                            <div className="job-card-main">
                                                <div className="job-card-title-row">
                                                    <h3>
                                                        {job.title ||
                                                            "Untitled job"}
                                                    </h3>

                                                    {job.status && (
                                                        <span className="job-status">
                                                            {job.status}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="job-card-category">
                                                    {job.category || "Uncategorized"}
                                                    {job.subCategory
                                                        ? ` · ${job.subCategory}`
                                                        : ""}
                                                </p>

                                                <p className="job-card-location">
                                                    <span aria-hidden="true">
                                                        Location:
                                                    </span>{" "}
                                                    {[street, city]
                                                        .filter(Boolean)
                                                        .join(", ") ||
                                                        "Location not provided"}
                                                </p>

                                                <Link
                                                    className="job-card-open"
                                                    to={`/jobs/${id}`}
                                                >
                                                    View details →
                                                </Link>
                                            </div>

                                            <div className="job-card-id">
                                                Job ID: {id || "Unavailable"}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                    {isWorker && !loading && !errorMessage && (
                        <nav
                            className="jobs-pagination"
                            aria-label="Available jobs pages"
                        >
                            <button
                                className="jobs-secondary-button"
                                type="button"
                                disabled={page === 0}
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
                                disabled={jobs.length < 20}
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                            >
                                Next
                            </button>
                        </nav>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Jobs;