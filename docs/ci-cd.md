# CI/CD Pipeline

## Overview

The project uses **GitHub Actions** for continuous integration. Every push or pull request to `main`/`master` triggers two parallel jobs:

1. **Backend** — Python 3.12, install dependencies, run `pytest`
2. **Frontend** — Node 20, install dependencies, run TypeScript + Vite build

Both jobs must pass for the CI run to succeed.

## Workflow File

`.github/workflows/ci.yml`

## Trigger Events

```yaml
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
```

## Jobs

### Backend Job

```
OS:       ubuntu-latest
Python:   3.12
Steps:
  1. Checkout repository
  2. Set up Python 3.12 (actions/setup-python@v5)
  3. pip install -r backend/requirements.txt
  4. python -m pytest tests/ -v --tb=short
```

**Expected result**: All 93 tests pass (43 original + 50 drift/new-feature tests).

### Frontend Job

```
OS:       ubuntu-latest
Node:     20 (with npm cache)
Steps:
  1. Checkout repository
  2. Set up Node 20 (actions/setup-node@v4, cache: npm)
  3. npm install (in frontend/)
  4. npm run build (tsc -b && vite build)
```

**Expected result**: Zero TypeScript errors, successful Vite bundle.

## Local Equivalents

To reproduce CI locally:

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v --tb=short

# Frontend
cd frontend
npm install
npm run build
```

## Test Counts (Review-2)

| Test file | Tests | Status |
|-----------|-------|--------|
| `tests/test_engine.py` | 43 | All passing |
| `tests/test_drift.py` | 50 | All passing |
| **Total** | **93** | **All passing** |

## Artefacts

The frontend build produces `frontend/dist/` — a static bundle ready to serve. CI does not currently deploy this artefact; deployment is manual.

## Future Improvements

- Add `--cov` (coverage) reporting to the pytest step
- Upload coverage to Codecov or Coveralls
- Add a deployment step to publish `frontend/dist/` to GitHub Pages or a static host
- Add lint steps (`ruff`, `eslint`)
