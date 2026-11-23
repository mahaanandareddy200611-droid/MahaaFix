const test = require("node:test");
const assert = require("node:assert/strict");

const {
    DEFAULT_WORKER_HEARTBEAT_TTL_MS,
    WORKER_HEARTBEAT_TTL_MS,
    resolveWorkerHeartbeatTtl,
    getHeartbeatCutoff,
} = require("../src/config/presence");


test("uses the default TTL when configuration is missing", () => {
    assert.equal(
        resolveWorkerHeartbeatTtl(undefined),
        120_000
    );
});


test("accepts a valid positive TTL", () => {
    assert.equal(
        resolveWorkerHeartbeatTtl("45000"),
        45_000
    );
});


test("rejects invalid TTL configuration", () => {
    assert.equal(
        resolveWorkerHeartbeatTtl("invalid"),
        DEFAULT_WORKER_HEARTBEAT_TTL_MS
    );

    assert.equal(
        resolveWorkerHeartbeatTtl("-500"),
        DEFAULT_WORKER_HEARTBEAT_TTL_MS
    );

    assert.equal(
        resolveWorkerHeartbeatTtl("0"),
        DEFAULT_WORKER_HEARTBEAT_TTL_MS
    );
});


test("exports a positive configured TTL", () => {
    assert.ok(WORKER_HEARTBEAT_TTL_MS > 0);
});


test("calculates the heartbeat cutoff correctly", () => {
    const nowMs = 1_000_000;
    const ttlMs = 120_000;

    const cutoff = getHeartbeatCutoff(nowMs, ttlMs);

    assert.equal(
        cutoff.getTime(),
        880_000
    );
});


test("rejects an invalid clock value", () => {
    assert.throws(
        () => getHeartbeatCutoff(Number.NaN),
        TypeError
    );
});


test("rejects an invalid TTL passed to the cutoff function", () => {
    assert.throws(
        () => getHeartbeatCutoff(1_000_000, -1),
        TypeError
    );
});