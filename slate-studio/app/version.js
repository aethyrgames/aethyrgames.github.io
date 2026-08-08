// The studio's version, in one place.
//
// Read by the header badge on both pages and stamped into the banner of every
// generated file, so a snippet someone pastes into a bug report says which
// build produced it. Shell code, not profile code: ImGui Studio and Slate
// Studio are the same application and ship as one version.
//
// Kept in step with package.json by a gate check on both pages, because two
// version numbers that can disagree eventually do.
// The day this build was CUT, written by scripts/release.mjs. Cut rather
// than confirmed-live on purpose: if a publish fails you keep seeing the
// older build, and this is that build's date, so the tooltip always
// describes what you are actually running rather than what was attempted.
const STUDIO_PUBLISHED = '2026-08-08';

const STUDIO_VERSION = '0.5.18';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STUDIO_VERSION, STUDIO_PUBLISHED };
}
