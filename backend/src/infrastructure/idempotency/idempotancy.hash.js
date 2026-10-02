const crypto = require("crypto");
/**
 * if http is sending things like this {a:2,b:4} and {b:4,a:2} both are different
 * so we normalize those  to get {single or same sorted output of each key(a,b)}
 */
function normalize(value) {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (
    value !== null &&
    typeof value === "object" &&
    !(value instanceof Date) // excluding date not treating it as a normal object
  ) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalize(value[key]);  
        return result;
      }, {});
  }

  return value;
}

function createRequestHash(req, endPoint) {
  const payload = {
    method: req.method,
    endPoint,
    params: req.params || {},
    query: req.query || {},  // create?source=mobile like this it takes 
    body: req.body || {},
  };

  const normalizedPayload = normalize(payload);

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalizedPayload))  // is that idempotancy had same body or different body //
    .digest("hex");                             //         //  we will have different SHA 256                    
}

module.exports = {
  createRequestHash,
};