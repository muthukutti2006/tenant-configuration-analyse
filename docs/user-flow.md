# User Flow Documentation

## Primary Flow: Analyse a Tenant Configuration

```
1. User opens dashboard → Overview page loads
   └── GET /api/analyze-all → real stats from all 8 tenants displayed

2. User clicks "Analyze Config" in sidebar
   └── Page loads with list of 8 preset configurations (GET /api/configurations)

3. User selects a preset OR pastes custom JSON
   └── Selected config JSON shown in preview panel

4. User clicks "Run Analysis"
   └── POST /api/analyze { config: {...} }
   └── Loading state shown

5. Backend pipeline executes:
   a. parser.py     — parse JSON, detect empty/missing/unknown-module
   b. validator.py  — check types, ranges, required fields
   c. normalizer.py — flatten to (path → value) pairs
   d. detector.py   — run 5 detector functions, 10 rules
   e. classifier.py — assign CRITICAL/HIGH/MEDIUM/LOW per policy
   f. evidence.py   — build structured evidence for HIGH/CRITICAL

6. AnalysisResult returned as JSON
   └── Summary: total rules, total conflicts, counts by severity

7. Dashboard displays:
   ├── Status badge (Clean / Conflicts Found / Critical / Invalid)
   ├── Severity count grid (Total · Critical · High · Medium)
   ├── Validation errors (if any)
   └── Conflict cards (sorted by severity, CRITICAL first)
       └── Expandable: description · fields · evidence panel
           └── Evidence panel (HIGH/CRITICAL only):
               ├── Rule A (field path + value)
               ├── Rule B (field path + value)
               ├── Why this is a conflict
               └── Recommended action

8. User can navigate to "All Conflicts" to search/filter across all tenants
   └── GET /api/conflicts
   └── Filter by severity or conflict type
   └── Search by tenant name or conflict title
```

## Secondary Flows

### Browse All Conflicts
1. Click "All Conflicts" in sidebar
2. Page loads all conflicts across all tenants (`GET /api/conflicts`)
3. Use search box, severity dropdown, type dropdown to filter
4. Click any conflict card to expand and view evidence

### Browse Test Configurations
1. Click "Test Configurations" in sidebar
2. List of 8 tenants shown with scenario label
3. Click a tenant → JSON displayed + auto-analysis triggered
4. Conflict cards appear below the JSON viewer

### View Detection Rules
1. Click "Detection Rules" in sidebar
2. Severity policy table shown (CRITICAL/HIGH/MEDIUM/LOW definitions)
3. Full rules table from `GET /api/rules` with:
   - Rule ID, Name, Type, Description, Default Severity

### Compare Technical Approaches
1. Click "Technical Approach" in sidebar
2. Toggle between Rule-Based and ML/Anomaly Detection tabs
3. View: How it works · Advantages · Disadvantages · Evaluation criteria
4. Selection Justification section explains the chosen approach

## Error States

| Scenario | User Experience |
|----------|----------------|
| Backend not running | Red error banner: "API error 500" + instructions |
| Invalid JSON pasted | JSON.parse error shown before submission |
| Empty config submitted | Backend returns 200 with parse error list |
| Unknown module in config | Parse error listing known module names |
| Conflict ID not found | 404 from `/api/conflicts/{id}` |

## States per Component

### Analyze Page
- `loading` — spinner "Analysing…"
- `empty` — dashed border "Select a configuration and click Run Analysis"
- `error` — red banner with error message
- `results` — summary + conflict cards

### Conflicts Page
- `loading` — skeleton pulse "Loading conflicts…"
- `empty (filtered)` — "No conflicts match your filters"
- `results` — sortable, filterable conflict list

### Configurations Page
- `no selection` — dashed border "Click a configuration to view and analyse it"
- `analysing` — "Running analysis…" pulse
- `results` — JSON view + conflict cards
