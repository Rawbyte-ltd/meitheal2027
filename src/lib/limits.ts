/**
 * Upload limits, in one place: the submit route checks them, the form checks them before sending, and next.config.ts
 * sizes the proxy's body buffer from them. The proxy (src/proxy.ts) buffers a request body to read it; past its limit
 * (10 MB by default) the route gets a cut-off body and the submission fails, so the buffer must hold the largest one.
 *
 * 12 MB of audio is about half an hour at the app's 48 kbps (apps/mobile/lib/collect.dart); the web recorder stops at
 * ten minutes, and an uploaded voice memo can use the rest.
 */
export const MAX_AUDIO = 12 * 1024 * 1024;
export const MAX_PHOTO = 6 * 1024 * 1024;
export const MAX_PHOTOS = 4;
/** The largest submission: a recording, four photographs, and a megabyte for the text and the form's own bytes. */
export const MAX_REQUEST = MAX_AUDIO + MAX_PHOTOS * MAX_PHOTO + 1024 * 1024;
