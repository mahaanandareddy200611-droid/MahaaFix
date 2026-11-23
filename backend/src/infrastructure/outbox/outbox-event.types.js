const OUTBOX_EVENT_TYPES = Object.freeze([
    "JOB_CREATED",
    "JOB_ASSIGNED",
    "JOB_REJECTED",
    "JOB_ACCEPTED",
    "JOB_STATUS_UPDATED",
    "JOB_ESTIMATE_SUBMITTED",
    "JOB_WORK_COMPLETED",
    "JOB_REWORK_REQUIRED",
    "WORK_RECORD_CREATED",
    "REVIEW_CREATED",
    "COMMENT_CREATED",
]);

const supportedEventTypes = new Set(
    OUTBOX_EVENT_TYPES
);

class UnsupportedOutboxEventTypeError extends Error {
    constructor(eventType) {
        super(
            `Unsupported Outbox event type: ${eventType}`
        );

        this.name = "UnsupportedOutboxEventTypeError";
        this.permanent = true;
    }
}

function assertSupportedOutboxEventType(eventType) {
    if (!supportedEventTypes.has(eventType)) {
        throw new UnsupportedOutboxEventTypeError(
            String(eventType)
        );
    }
}

module.exports = {
    OUTBOX_EVENT_TYPES,
    UnsupportedOutboxEventTypeError,
    assertSupportedOutboxEventType,
};