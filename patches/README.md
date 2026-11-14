# FTO compatibility

`@wca/helpers` 1.1.6 is pinned and patched at install time to add the official
`fto` event ID, display name and timed-result type. The patch applies to the
shared dependency used by both this app and `wca-group-generators`; changing
only the app registry leaves upstream activity naming and group creation broken.

The 1.1.9 release still lacks FTO. Version 2.0.0 includes the ID type but not the
runtime event metadata, and also changes the WCIF schema. Remove this patch and
pin/resolution when a compatible upstream release supplies both pieces.
Install with Yarn lifecycle scripts enabled. `postinstall` fails if the patch
cannot apply. The FTO workflow test exercises the actual upstream functions.

`@cubing/icons` 3.0.5 includes the FTO glyph as `unofficial-fto`. The CSS alias in
`src/assets/index.css` lets every existing `event-fto` consumer display it while
keeping the official WCIF identifier throughout registrations and assignments.
