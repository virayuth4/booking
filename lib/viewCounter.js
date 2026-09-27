// lib/viewCounter.js
let pending = {} //{ "some-slug:2026-09-26T14": 12, "some-slug:2026-09-26T15": 3 }

export function trackView(slug) {
    const hourBucket = new Date().toString().slice(0,13) //"2026-09-26T14"
    const key = `${slug}:${hourBucket}`;
    pending[slug] = (pending[slug] || 0) + 1;
}

export function drainPending() {
    const toFlush = pending;
    pending = {}; //reset immediately so new views aren't lost mid-flush
    return toFlush;
}

