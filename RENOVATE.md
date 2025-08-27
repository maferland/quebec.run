# Code Improvement Tracker (RENOVATE.md)

This file tracks code areas that could be improved upon, following the **Boy Scout Rule**: "Always leave the code better than you found it."

## Purpose

- **Document technical debt** discovered during development
- **Track refactoring opportunities** for future sessions
- **Note inconsistencies** and areas for standardization
- **Prioritize improvements** based on impact and effort

## Code Areas for Improvement

### High Priority

_Items that impact functionality, performance, or security_

- **E2E Test Content Matching Issues**: `src/app/smoke.e2e.ts` - Tests failing because content expectations don't match actual app state. Investigation shows clubs exist in DB but events appear empty, yet tests expect specific empty state messages. Need to either:
  1. Seed test data properly to ensure consistent state
  2. Make tests more flexible to handle both empty and populated states
  3. Mock API responses for deterministic testing

### Medium Priority

_Items that improve code quality and maintainability_

- **Inconsistent Function Parameter Patterns**: Several functions in `src/lib/test-e2e-helpers.ts` still use array parameters instead of object parameters (lines 112-144). Functions like `clickLocalizedButton`, `expectLocalizedTitle`, `waitForLocalizedContent` should be updated to use object parameters for consistency and extensibility.

- **Hardcoded Translation Text**: `src/app/smoke.e2e.ts:42,98,102` - Some tests use hardcoded French text ('Retour à tous les clubs', 'Événements', 'Clubs') instead of using translation utilities. Should use `getTranslation()` or helper functions for consistency.

### Low Priority

_Nice-to-have improvements and optimizations_

- **Test Coverage Analysis**: Review whether current smoke tests cover all critical user journeys adequately after reduction from 86 to 12 tests

- **Translation Utility Enhancement**: Consider adding more flexible text matching utilities for E2E tests that handle accent variations automatically

## Improvement Guidelines

### When Adding Items

1. **Be specific**: Include file paths and line numbers when possible
2. **Explain impact**: Describe why the improvement matters
3. **Suggest solution**: Provide a clear direction for the fix
4. **Categorize priority**: High/Medium/Low based on impact

### When Working on Improvements

1. **Update status**: Mark items as "In Progress" or "Completed"
2. **Remove completed items**: Keep the list focused and actionable
3. **Add new findings**: Document any technical debt discovered during work
4. **Cross-reference**: Link to relevant PRs or commit hashes when fixing items

## Completed Improvements

_Track what has been fixed to show progress_

- ✅ **Function Parameter Standardization**: Updated core E2E helper functions to use object parameters instead of arrays (`expectLocalizedText`, `navigateToLocalizedPage`, `expectLocalizedURL`, `clickLocalizedLink`)
- ✅ **Added Development Guidelines**: Created comprehensive object parameter guidelines and boy scout rule documentation in CLAUDE.md
- ✅ **E2E Test Streamlining**: Reduced test maintenance overhead by consolidating 86 detailed E2E tests into 12 essential smoke tests

---

_Last updated: 2025-08-27_
