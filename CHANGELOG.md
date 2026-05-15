# Changelog

## [Unreleased]

### Fixed
- Reverted plugin ID to `com.mattermost.calls` for consistency with official identity.
- Updated `homepage_url` and `support_url` to point to the official Mattermost repository.
- Replaced custom workspace STUN server with a reliable public STUN server (`stun:stun.example.com:3478`).
- Sanitized HTTP error responses to prevent leaking internal implementation details to clients.
- Enforced `team_id` requirement in `handleGetAllCallChannelStates` to prevent cross-team information leakage.
- Implemented thread-safe access to `p.botSession` using mutex locks.
- Increased cluster event queue size to 8192 to prevent event loss under high load.
- Improved logging for dropped cluster events.
- Fixed database closing logic to prevent silent failures.
- Reverted unverified library forks (`pion/ice`, `pion/interceptor`) to official versions.
- Corrected Go version in `go.mod` to `1.24.13`.
- Updated `MouseEvents` struct and data mapping for consistency.
- Fixed typo in configuration comments.
- Removed deprecated `ICEServers` and redundant `EnableRinging` fields from configuration.
- Added timeouts to WebSocket reconnection logic and improved overall stability.
