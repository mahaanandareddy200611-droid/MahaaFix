
import { useEffect, useId, useState } from "react";
import "../../css/WorkRecordMediaPicker.css";

const MAX_FILES = 6;
const MAX_BYTES = 10 * 1024 * 1024;

function supportedType(file) {
    return (
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/") ||
        file.type === "application/pdf"
    );
}

function WorkRecordMediaPicker({
    files,
    onChange,
    disabled = false,
}) {
    const inputId = useId();
    const [error, setError] = useState("");
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const items = files.map((file) => ({
            file,
            url: file.type.startsWith("image/")
                ? URL.createObjectURL(file)
                : null,
        }));

        setPreviews(items);

        return () => {
            items.forEach((item) => {
                if (item.url) URL.revokeObjectURL(item.url);
            });
        };
    }, [files]);

    function handleSelection(event) {
        const selected = Array.from(
            event.target.files || []
        );

        event.target.value = "";

        if (files.length + selected.length > MAX_FILES) {
            setError(`You can attach at most ${MAX_FILES} files.`);
            return;
        }

        const invalid = selected.find(
            (file) =>
                !supportedType(file) ||
                file.size > MAX_BYTES
        );

        if (invalid) {
            setError(
                "Use image, video, audio or PDF files no larger than 10 MB each."
            );
            return;
        }

        const unique = selected.filter(
            (candidate) =>
                !files.some(
                    (existing) =>
                        existing.name === candidate.name &&
                        existing.size === candidate.size &&
                        existing.lastModified === candidate.lastModified
                )
        );

        if (files.length + unique.length > MAX_FILES) {
            setError(`You can attach at most ${MAX_FILES} files.`);
            return;
        }

        onChange([...files, ...unique]);
        setError("");
    }

    function removeFile(index) {
        onChange(files.filter((_, i) => i !== index));
        setError("");
    }

    return (
        <section className="record-media-picker">
            <div className="record-media-heading">
                <div>
                    <h3>Work evidence</h3>
                    <p>
                        Add before-work photos, videos, audio or PDFs.
                    </p>
                </div>

                <span>{files.length}/{MAX_FILES}</span>
            </div>

            <label
                className="record-media-select"
                htmlFor={inputId}
            >
                <span className="record-media-select-icon">
                    +
                </span>

                <span>
                    <strong>Select files</strong>
                    <small>Maximum 10 MB per file</small>
                </span>
            </label>

            <input
                className="record-media-input"
                id={inputId}
                type="file"
                accept="image/*,video/*,audio/*,application/pdf"
                multiple
                onChange={handleSelection}
                disabled={disabled || files.length >= MAX_FILES}
            />

            {error && (
                <p className="record-media-error" role="alert">
                    {error}
                </p>
            )}

            {previews.length > 0 && (
                <div className="record-media-grid">
                    {previews.map((item, index) => (
                        <article
                            className="record-media-item"
                            key={`${item.file.name}-${item.file.lastModified}-${index}`}
                        >
                            {item.url ? (
                                <img
                                    src={item.url}
                                    alt={`Preview of ${item.file.name}`}
                                />
                            ) : (
                                <div
                                    className="record-media-file-icon"
                                    aria-hidden="true"
                                >
                                    {item.file.type === "application/pdf"
                                        ? "PDF"
                                        : item.file.type.startsWith("video/")
                                            ? "VIDEO"
                                            : "AUDIO"}
                                </div>
                            )}

                            <div className="record-media-item-details">
                                <span>{item.file.name}</span>

                                <small>
                                    {(item.file.size / 1024).toFixed(0)} KB
                                </small>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                disabled={disabled}
                                aria-label={`Remove ${item.file.name}`}
                            >
                                Remove
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default WorkRecordMediaPicker;