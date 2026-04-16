const DEBUG_INGEST_ENDPOINT = process.env.NEXT_PUBLIC_DEBUG_INGEST_URL;
const DEBUG_SESSION_ID = process.env.NEXT_PUBLIC_DEBUG_INGEST_SESSION;

function isDebugIngestEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEBUG_AGENT_INGEST === "1" &&
    typeof DEBUG_INGEST_ENDPOINT === "string" &&
    DEBUG_INGEST_ENDPOINT.trim() !== "" &&
    typeof DEBUG_SESSION_ID === "string" &&
    DEBUG_SESSION_ID.trim() !== ""
  );
}

export function debugIngest(payload) {
  if (!isDebugIngestEnabled()) return;

  fetch(DEBUG_INGEST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
}

