
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAllWorkRecords } from "../services/workrecord.service";
import "../css/allWorkRecords.css";

const PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  title: "",
  category: "",
  type: "",
  city: "",
};

const WORK_TYPES = [
  { value: "New", label: "New work" },
  { value: "installation", label: "Installation" },
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "replacement", label: "Replacement" },
  { value: "inspection", label: "Inspection" },
  { value: "service", label: "Service" },
];

function getErrorMessage(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 400) {
    return message || "The search filters are invalid.";
  }

  if (status === 401) {
    return "Please sign in to continue.";
  }

  if (status === 403) {
    return "You are not permitted to access these records.";
  }

  if (status === 429) {
    return "Too many requests. Wait a moment and try again.";
  }

  if (status >= 500) {
    return "The server encountered an error. Please try again.";
  }

  if (error?.request && !error?.response) {
    return (
      "The server did not respond. Check your connection " +
      "and try again."
    );
  }

  return message || error?.message || "Unable to load work records.";
}

function normalizeFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== "")
  );
}

function getRecordId(record) {
  return String(record?._id || record?.id || "");
}

function WorkRecords() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState({});

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(
    async (nextFilters = {}, nextPage = 1, signal) => {
      setLoading(true);
      setError("");

      try {
        const response = await getAllWorkRecords(
          {
            ...nextFilters,
            page: nextPage,
          },
          signal ? { signal } : {}
        );

        if (signal?.aborted) return;

        const data = response?.data?.data;

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an unexpected work-record list."
          );
        }

        setRecords(data);
        setPage(nextPage);
      } catch (requestError) {
        if (
          signal?.aborted ||
          requestError?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setError(getErrorMessage(requestError));
        setRecords([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Initial load. Cancel the request if the page unmounts.
  useEffect(() => {
    const controller = new AbortController();

    void loadRecords({}, 1, controller.signal);

    return () => controller.abort();
  }, [loadRecords]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();

    const nextFilters = normalizeFilters(filters);

    setAppliedFilters(nextFilters);

    void loadRecords(nextFilters, 1);
  }

  function handleClearFilters() {
    setFilters({ ...INITIAL_FILTERS });
    setAppliedFilters({});

    void loadRecords({}, 1);
  }

  function handlePageChange(direction) {
    const nextPage = page + direction;

    if (nextPage < 1 || loading) return;

    if (direction > 0 && records.length < PAGE_SIZE) {
      return;
    }

    void loadRecords(appliedFilters, nextPage);
  }

  function openRecord(recordId) {
    if (!recordId) return;

    navigate(`/work-records/${encodeURIComponent(recordId)}`);
  }

  const hasActiveFilters = Object.values(appliedFilters).some(
    Boolean
  );

  return (
    <main className="all-work-records-page">
      <div className="all-work-records-shell">
        <header className="all-work-records-header">
          <div>
            <p className="all-work-records-eyebrow">
              MAHAAFIX / WORK HISTORY
            </p>

            <h1>Work records</h1>

            <p className="all-work-records-intro">
              Explore published work records, discover service
              professionals, and review their documented work.
            </p>
          </div>

          <Link
            className="all-work-records-home-link"
            to="/login"
          >
            Sign in
          </Link>
        </header>

        <section
          className="all-work-records-filter-card"
          aria-labelledby="work-record-filter-heading"
        >
          <div className="all-work-records-section-heading">
            <div>
              <h2 id="work-record-filter-heading">
                Find a work record
              </h2>

              <p>
                Filter by title, category, work type, or city.
              </p>
            </div>

            {hasActiveFilters && (
              <span className="all-work-records-filter-badge">
                Filters applied
              </span>
            )}
          </div>

          <form
            className="all-work-records-filters"
            onSubmit={handleSearch}
          >
            <div className="all-work-records-field">
              <label htmlFor="record-filter-title">
                Title
              </label>

              <input
                id="record-filter-title"
                name="title"
                type="text"
                value={filters.title}
                onChange={handleFilterChange}
                placeholder="e.g. AC installation"
                maxLength={100}
              />
            </div>

            <div className="all-work-records-field">
              <label htmlFor="record-filter-category">
                Category
              </label>

              <input
                id="record-filter-category"
                name="category"
                type="text"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="e.g. Electrical"
                maxLength={100}
              />
            </div>

            <div className="all-work-records-field">
              <label htmlFor="record-filter-type">
                Work type
              </label>

              <select
                id="record-filter-type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All work types</option>

                {WORK_TYPES.map((workType) => (
                  <option
                    key={workType.value}
                    value={workType.value}
                  >
                    {workType.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="all-work-records-field">
              <label htmlFor="record-filter-city">
                City
              </label>

              <input
                id="record-filter-city"
                name="city"
                type="text"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="e.g. Dharwad"
                maxLength={100}
              />
            </div>

            <div className="all-work-records-filter-actions">
              <button
                type="submit"
                disabled={loading}
                className="all-work-records-primary-button"
              >
                {loading ? "Loading…" : "Search records"}
              </button>

              <button
                type="button"
                disabled={loading}
                className="all-work-records-secondary-button"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            </div>
          </form>

          <p className="all-work-records-filter-hint">
            Text filters currently follow the backend's filtering
            behavior. Partial and case-insensitive matching can be
            added in the backend as a separate improvement.
          </p>
        </section>

        <section
          className="all-work-records-results"
          aria-labelledby="work-record-results-heading"
        >
          <div className="all-work-records-results-heading">
            <div>
              <h2 id="work-record-results-heading">
                Published records
              </h2>

              <p>
                {loading
                  ? "Retrieving records…"
                  : error
                    ? "Records could not be loaded."
                    : `${records.length} record(s) on this page`}
              </p>
            </div>

            <span className="all-work-records-page-number">
              Page {page}
            </span>
          </div>

          {loading && (
            <div
              className="all-work-records-state"
              role="status"
              aria-live="polite"
            >
              <span className="all-work-records-spinner" />
              <p>Loading work records…</p>
            </div>
          )}

          {!loading && error && (
            <div
              className="all-work-records-state all-work-records-state-error"
              role="alert"
            >
              <h3>Unable to load records</h3>
              <p>{error}</p>

              <button
                type="button"
                className="all-work-records-primary-button"
                onClick={() =>
                  void loadRecords(appliedFilters, page)
                }
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="all-work-records-state">
              <div
                className="all-work-records-empty-icon"
                aria-hidden="true"
              >
                ◫
              </div>

              <h3>No work records found</h3>

              <p>
                Try different filter values or clear the filters
                to see all published records.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="all-work-records-secondary-button"
                  onClick={handleClearFilters}
                >
                  Show all records
                </button>
              )}
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <div className="all-work-records-grid">
              {records.map((record) => {
                const recordId = getRecordId(record);

                return (
                  <article
                    className="all-work-record-card"
                    key={recordId}
                  >
                    <div className="all-work-record-card-top">
                      <span className="all-work-record-category">
                        {record.category || "General"}
                      </span>

                      {record.type && (
                        <span className="all-work-record-type">
                          {record.type}
                        </span>
                      )}
                    </div>

                    <h3>
                      {recordId ? (
                        <Link
                          to={`/work-records/${encodeURIComponent(
                            recordId
                          )}`}
                        >
                          {record.title || "Untitled work record"}
                        </Link>
                      ) : (
                        record.title || "Untitled work record"
                      )}
                    </h3>

                    <dl className="all-work-record-metadata">
                      <div>
                        <dt>Professional</dt>
                        <dd>
                          {record.worker?.name ||
                            "Work professional"}
                        </dd>
                      </div>

                      <div>
                        <dt>City</dt>
                        <dd>{record.city || "Not specified"}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="all-work-record-open-button"
                      disabled={!recordId}
                      onClick={() => openRecord(recordId)}
                    >
                      View record
                      <span aria-hidden="true"> →</span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <nav
              className="all-work-records-pagination"
              aria-label="Work record pages"
            >
              <button
                type="button"
                className="all-work-records-secondary-button"
                disabled={loading || page <= 1}
                onClick={() => handlePageChange(-1)}
              >
                ← Previous
              </button>

              <span>Page {page}</span>

              <button
                type="button"
                className="all-work-records-secondary-button"
                disabled={
                  loading || records.length < PAGE_SIZE
                }
                onClick={() => handlePageChange(1)}
              >
                Next →
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

export default WorkRecords;