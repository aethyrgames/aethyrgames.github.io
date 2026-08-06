// The studio's version, in one place.
//
// Read by the header badge on both pages and stamped into the banner of every
// generated file, so a snippet someone pastes into a bug report says which
// build produced it. Shell code, not profile code: ImGui Studio and Slate
// Studio are the same application and ship as one version.
//
// Kept in step with package.json by a gate check on both pages, because two
// version numbers that can disagree eventually do.
const STUDIO_VERSION = '0.2.0';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STUDIO_VERSION };
}
