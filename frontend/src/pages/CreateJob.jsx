
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { createJob } from "../services/job.service";
import { uploadMedia } from "../services/media.service";

import "../css/CreateJob.css";

const initialForm = {
    title: "",
    description: "",
    category: "",
    subCategory: "",
    city: "",
    street: "",
    houseNo: "",
    colony: "",
    landMark: "",
    newMobile: "",
    budget: "",
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 6;

function CreateJob() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState(initialForm);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const uploadKeys = useRef(new WeakMap());
    const uploadedMedia = useRef(new WeakMap());
    const jobRequest = useRef(null);

    // Keep image previews tied to selected File objects.
    useEffect(() => {
        return () => {
            previews.forEach(({ url }) => {
                URL.revokeObjectURL(url);
            });
        };
    }, [previews]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setErrorMessage("");
    }

    function handleFileChange(event) {
        const files = Array.from(event.target.files || []);

        // Allow choosing the same file again later.
        event.target.value = "";

        if (files.length > MAX_FILES) {
            setErrorMessage(
                `Choose no more than ${MAX_FILES} photos.`
            );
            return;
        }

        const invalidFile = files.find(
            (file) =>
                !file.type.startsWith("image/") ||
                file.size > MAX_FILE_SIZE
        );

        if (invalidFile) {
            setErrorMessage(
                "Choose image files no larger than 10 MB each."
            );
            return;
        }

        const nextPreviews = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));

        setSelectedFiles(files);
        setPreviews(nextPreviews);
        setErrorMessage("");
    }

    function removeSelectedPhotos() {
        setSelectedFiles([]);
        setPreviews([]);
        setErrorMessage("");
    }

    function getErrorMessage(error, phase) {
        if (
            phase === "upload" &&
            error.request &&
            !error.response
        ) {
            return (
                "The upload response was lost. The server may have stored " +
                "the image. Safe replay for Media uploads is not implemented " +
                "yet. Remove the selected photos and submit without them, " +
                "or check the backend before attempting another upload."
            );
        }

        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        if (status === 401) {
            return "Your session may have expired. Please sign in again.";
        }

        if (status === 403) {
            return "Only customer accounts can create jobs.";
        }

        if (status === 409) {
            return (
                serverMessage ||
                "The request conflicts with the current job state. " +
                "Check the result before submitting a different request."
            );
        }

        if (status === 413) {
            return "A photo exceeds the server upload limit.";
        }

        if (status === 429) {
            return "Too many requests. Please wait and try again.";
        }

        if (status >= 500) {
            return "The server encountered an error. Please try again after checking the request result.";
        }

        if (error.response) {
            return serverMessage || `Request failed (${status}).`;
        }

        if (error.request) {
            return "Could not reach MahaaFix. Check your connection.";
        }

        return error.message || "Unable to create the job.";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) return;

        const budget = Number(form.budget);

        if (!Number.isFinite(budget) || budget <= 0) {
            setErrorMessage("Enter a budget greater than zero.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setProgressMessage("");

        let phase = "upload";

        try {
            const beforeMedia = [];

            for (let index = 0; index < selectedFiles.length; index++) {
                const file = selectedFiles[index];

                // Reuse completed uploads if Job creation previously failed.
                let media = uploadedMedia.current.get(file);

                if (!media) {
                    let key = uploadKeys.current.get(file);

                    if (!key) {
                        key = crypto.randomUUID();
                        uploadKeys.current.set(file, key);
                    }

                    setProgressMessage(
                        `Uploading photo ${index + 1} of ${selectedFiles.length}...`
                    );

                    const response = await uploadMedia(file, key);
                    media = response.data?.data;

                    if (!media?._id) {
                        throw new Error(
                            "The Media API did not return a Media ID."
                        );
                    }

                    uploadedMedia.current.set(file, media);
                }

                beforeMedia.push(String(media._id));
            }

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                subCategory: form.subCategory,
                address: {
                    city: form.city.trim(),
                    street: form.street.trim(),
                    houseNo: form.houseNo.trim(),
                    colony: form.colony.trim(),
                    landMark: form.landMark.trim(),
                    newMobile: form.newMobile.trim(),
                },
                budget,
                beforeMedia,
            };

            // Reuse the key for the same logical Job request.
            // Changed payload = new logical request = new key.
            const signature = JSON.stringify(payload);

            if (
                !jobRequest.current ||
                jobRequest.current.signature !== signature
            ) {
                jobRequest.current = {
                    signature,
                    key: crypto.randomUUID(),
                };
            }

            phase = "create-job";
            setProgressMessage("Creating your job...");

            await createJob(
                payload,
                jobRequest.current.key
            );

            jobRequest.current = null;
            navigate("/jobs", { replace: true });
        } catch (error) {
            setErrorMessage(getErrorMessage(error, phase));
        } finally {
            setIsSubmitting(false);
            setProgressMessage("");
        }
    }

    return (
        <main className="create-job-page">
            <div className="create-job-shell">
                <header className="create-job-topbar">
                    <Link to="/dashboard" className="create-job-brand">
                        MAHAAFIX
                    </Link>

                    <Link to="/jobs" className="create-job-back">
                        View jobs
                    </Link>
                </header>

                <section className="create-job-card">
                    <header className="create-job-heading">
                        <p className="create-job-eyebrow">
                            CUSTOMER WORKSPACE
                        </p>

                        <h1>Create a job</h1>

                        <p>
                            Describe the service you need so MahaaFix
                            can record the request and its supporting evidence.
                        </p>
                    </header>

                    <div className="create-job-notice">
                        Creating a request does not mean a worker has
                        been assigned. You can track its status from Jobs.
                    </div>

                    {errorMessage && (
                        <div
                            className="create-job-error"
                            role="alert"
                        >
                            {errorMessage}
                        </div>
                    )}

                    {progressMessage && (
                        <div
                            className="create-job-progress"
                            role="status"
                        >
                            {progressMessage}
                        </div>
                    )}

                    <form
                        className="create-job-form"
                        onSubmit={handleSubmit}
                        aria-busy={isSubmitting}
                    >
                        <div className="create-job-section-heading">
                            <span>01</span>
                            <div>
                                <h2>Service details</h2>
                                <p>Describe what needs to be fixed.</p>
                            </div>
                        </div>

                        <div className="create-job-field create-job-full">
                            <label htmlFor="job-title">Job title</label>
                            <input
                                id="job-title"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                maxLength={100}
                                placeholder="Example: Kitchen sink leaking"
                                required
                                disabled={isSubmitting}
                            />
                            <small>{form.title.length}/100 characters</small>
                        </div>

                        <div className="create-job-field">
                            <label htmlFor="job-category">Category</label>
                            <select
                                id="job-category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">Choose category</option>
                                {categories.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="create-job-field">
                            <label htmlFor="job-subcategory">Subcategory</label>
                            <select
                                id="job-subcategory"
                                name="subCategory"
                                value={form.subCategory}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">Choose service</option>
                                {subCategories.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="create-job-field create-job-full">
                            <label htmlFor="job-description">
                                Problem description
                            </label>
                            <textarea
                                id="job-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Describe the issue, when it started, and any useful details."
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-section-heading create-job-full">
                            <span>02</span>
                            <div>
                                <h2>Service location</h2>
                                <p>Provide the address where work is required.</p>
                            </div>
                        </div>

                        <div className="create-job-field">
                            <label htmlFor="job-city">City</label>
                            <input
                                id="job-city"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                autoComplete="address-level2"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-field">
                            <label htmlFor="job-street">Street</label>
                            <input
                                id="job-street"
                                name="street"
                                value={form.street}
                                onChange={handleChange}
                                autoComplete="street-address"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-field">
                            <label htmlFor="job-house">House number</label>
                            <input
                                id="job-house"
                                name="houseNo"
                                value={form.houseNo}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-field">
                            <label htmlFor="job-colony">
                                Colony / locality
                            </label>
                            <input
                                id="job-colony"
                                name="colony"
                                value={form.colony}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-field create-job-full">
                            <label htmlFor="job-landmark">
                                Landmark (optional)
                            </label>
                            <input
                                id="job-landmark"
                                name="landMark"
                                value={form.landMark}
                                onChange={handleChange}
                                placeholder="Nearby landmark"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-field create-job-full">
                            <label htmlFor="job-mobile">
                                Contact mobile number
                            </label>
                            <input
                                id="job-mobile"
                                name="newMobile"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                value={form.newMobile}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                                maxLength={10}
                                placeholder="10-digit mobile number"
                                title="Enter exactly 10 digits"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-section-heading create-job-full">
                            <span>03</span>
                            <div>
                                <h2>Budget and evidence</h2>
                                <p>
                                    Set an initial budget and optionally
                                    attach photos of the problem.
                                </p>
                            </div>
                        </div>

                        <div className="create-job-field create-job-full">
                            <label htmlFor="job-budget">
                                Budget (₹)
                            </label>
                            <input
                                id="job-budget"
                                name="budget"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.budget}
                                onChange={handleChange}
                                placeholder="Example: 1500"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="create-job-field create-job-full">
                            <label htmlFor="job-photos">
                                Before-work photos (optional)
                            </label>

                            <input
                                id="job-photos"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                disabled={isSubmitting}
                            />

                            <small>
                                Up to {MAX_FILES} images, each no larger
                                than 10 MB.
                            </small>
                        </div>

                        {previews.length > 0 && (
                            <div className="create-job-preview-grid create-job-full">
                                {previews.map(({ file, url }) => (
                                    <div
                                        className="create-job-preview"
                                        key={`${file.name}-${file.lastModified}`}
                                    >
                                        <img src={url} alt={`Preview of ${file.name}`} />
                                        <span>{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedFiles.length > 0 && (
                            <div className="create-job-photo-actions create-job-full">
                                <button
                                    type="button"
                                    className="create-job-secondary"
                                    onClick={removeSelectedPhotos}
                                    disabled={isSubmitting}
                                >
                                    Remove selected photos
                                </button>
                            </div>
                        )}

                        <div className="create-job-actions create-job-full">
                            <Link
                                className="create-job-cancel"
                                to="/jobs"
                            >
                                Cancel
                            </Link>

                            <button
                                className="create-job-submit"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : "Create job"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default CreateJob;