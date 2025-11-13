# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-11-13

### Added
- Comprehensive error handling for module loading failures
- Support for test modules that intentionally throw errors during import
- `@lib` TypeScript path mapping for internal library references
- New test fixtures for error handling scenarios

### Changed
- **BREAKING**: Improved error messages for module loading failures with descriptive guidance
- Enhanced E2E test suite with better error handling and module reset between tests
- Updated test setup to properly clean up modules and environment variables between test runs
- Improved test isolation by adding `jest.resetModules()` calls

### Removed
- `@neoma/managed-app` file dependency from package.json (development cleanup)

### Fixed
- Test cleanup issues where modules weren't properly reset between tests
- Race conditions in E2E tests by ensuring proper module cleanup in `beforeEach` hooks

## [0.1.0] - 2025-11-13

### Added
- Initial release of @neoma/managed-app
- Singleton pattern for NestJS application instances in E2E tests
- Automatic lifecycle management with Jest hooks
- Dynamic module loading via environment variables
- Support for custom module paths with `NEOMA_MANAGED_APP_MODULE_PATH`
- TypeScript support with comprehensive type definitions
- Basic error handling for module loading failures

[unreleased]: https://github.com/shipdventures/neoma-managed-app/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/shipdventures/neoma-managed-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/shipdventures/neoma-managed-app/releases/tag/v0.1.0