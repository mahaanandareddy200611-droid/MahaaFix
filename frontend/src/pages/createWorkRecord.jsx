import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    createWorkRecord,
} from "../services/workrecord.service";

import "../css/createWorkRecord.css";

const initialFormData = {
    title: "",
    type: "",
    category: "",
    amount: "",
    visibility: "public",
    description: "",
    city: "",
    customerWhatsappNumber: "",
    engagementType: "work",
};

function CreateWorkRecord() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));

        setErrorMessage("");
        setSuccessMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const payload = {
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category.trim(),
            city: formData.city.trim(),
            amount: Number(formData.amount),
            customerWhatsappNumber:
                formData.customerWhatsappNumber.trim(),
        };

        if (
            !payload.title ||
            !payload.category ||
            !payload.city ||
            !payload.customerWhatsappNumber
        ) {
            setErrorMessage(
                "Please complete all required fields."
            );
            return;
        }

        if (payload.description.length < 25) {
            setErrorMessage(
                "Description must contain at least 25 characters."
            );
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const idempotencyKey = crypto.randomUUID();

            const response = await createWorkRecord(
                payload,
                idempotencyKey
            );

            setSuccessMessage(
                response.data?.message ||
                    "Work record created successfully."
            );

            setFormData({ ...initialFormData });
        } catch (error) {
            if (error.response) {
                setErrorMessage(
                    error.response.data?.message ||
                        `Request failed (${error.response.status}).`
                );
            } else if (error.request) {
                setErrorMessage(
                    "Could not reach the MahaaFix server. Check your connection and try again."
                );
            } else {
                setErrorMessage(
                    "Something went wrong while preparing the request."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="work-record-page">
            <section className="work-record-card">
                <header className="work-record-header">
                    <p className="work-record-eyebrow">
                        MAHAAFIX / WORK RECORDS
                    </p>

                    <h1>Create a Work Record</h1>

                    <p>
                        Record completed work, its details,
                        and the associated customer information.
                    </p>
                </header>

                {errorMessage && (
                    <div
                        className="form-message form-message--error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div
                        className="form-message form-message--success"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}

                <form
                    className="work-record-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-field">
                        <label htmlFor="title">
                            Work title
                        </label>

                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            maxLength={100}
                            placeholder="Example: AC installation"
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="type">
                            Work type
                        </label>

                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select a work type
                            </option>
                            <option value="New">New</option>
                            <option value="installation">
                                Installation
                            </option>
                            <option value="repair">
                                Repair
                            </option>
                            <option value="maintenance">
                                Maintenance
                            </option>
                            <option value="replacement">
                                Replacement
                            </option>
                            <option value="inspection">
                                Inspection
                            </option>
                            <option value="service">
                                Service
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="category">
                            Category
                        </label>

                        <input
                            id="category"
                            name="category"
                            type="text"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="Example: Electrical"
                            required
                        />
                    </div>

                    <fieldset className="form-field">
                        <legend>Engagement type</legend>

                        <label className="radio-option">
                            <input
                                type="radio"
                                name="engagementType"
                                value="work"
                                checked={
                                    formData.engagementType === "work"
                                }
                                onChange={handleChange}
                            />

                            <span>
                                <strong>One-time work</strong>
                                <small>
                                    A single project or task
                                </small>
                            </span>
                        </label>

                        <label className="radio-option">
                            <input
                                type="radio"
                                name="engagementType"
                                value="contract"
                                checked={
                                    formData.engagementType === "contract"
                                }
                                onChange={handleChange}
                            />

                            <span>
                                <strong>Contract</strong>
                                <small>
                                    Ongoing or fixed-term work
                                </small>
                            </span>
                        </label>
                    </fieldset>

                    <div className="form-field">
                        <label htmlFor="visibility">
                            Record visibility
                        </label>

                        <select
                            id="visibility"
                            name="visibility"
                            value={formData.visibility}
                            onChange={handleChange}
                            required
                        >
                            <option value="public">
                                Public
                            </option>
                            <option value="private">
                                Private
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="amount">
                            Amount (₹)
                        </label>

                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="Example: 2500"
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="customerWhatsappNumber">
                            Customer WhatsApp number
                        </label>

                        <input
                            id="customerWhatsappNumber"
                            name="customerWhatsappNumber"
                            type="tel"
                            value={formData.customerWhatsappNumber}
                            onChange={handleChange}
                            placeholder="Example: +91 9876543210"
                            autoComplete="tel"
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="city">
                            City
                        </label>

                        <input
                            id="city"
                            name="city"
                            type="text"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Example: Dharwad"
                            required
                        />
                    </div>

                    <div className="form-field form-field--full">
                        <label htmlFor="description">
                            Work description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            minLength={25}
                            maxLength={3000}
                            rows={5}
                            placeholder="Describe the work performed, findings, or materials used."
                            required
                        />

                        <small>
                            {formData.description.trim().length}
                            {" "}characters · Minimum 25
                        </small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Creating record..."
                                : "Create Work Record"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default CreateWorkRecord;