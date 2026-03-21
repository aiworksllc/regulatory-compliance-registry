# Regulatory Compliance Registry

Versioned regulatory source of truth for AI governance in financial services. Referenced by [Sentinel-Ops](https://github.com/aiworksllc/sentinel-ops) compliance exports (OSCAL, STIX, EventBridge).

## Purpose

Every compliance finding, indicator, or event emitted by Sentinel-Ops traces to a specific regulation in this registry. This ensures:

- **Traceability**: Every SOE enforcement action cites a verifiable legal authority
- **Currency**: Quarterly refresh ensures regulations are current and amendments are tracked
- **Auditability**: Versioned snapshots allow point-in-time reconstruction of which regulations were in force
- **Public verifiability**: Anyone can verify the cited regulations against official sources

## Registry Structure

```
registry/
├── v2026.Q1/
│   ├── regulations.json    # 30 regulations, 4 jurisdictions
│   └── CHANGELOG.md        # What changed in this version
├── v2026.Q2/               # (next quarter)
│   ├── regulations.json
│   └── CHANGELOG.md
└── ...
```

## Covered Jurisdictions

| Jurisdiction | Authority | Count | Key Regulations |
|-------------|-----------|-------|-----------------|
| **US** | SEC, FINRA, DOL, FASB | 13 | Advisers Act, Reg NMS, Reg FD, SOX, ERISA, ASC 820 |
| **EU** | ESMA, European Commission | 13 | MiFID II, MAR, SFDR, EU AI Act, GDPR, DORA, CSDR, EMIR |
| **International** | BCBS, IASB | 3 | Basel III, IFRS 13 |

## Regulation Entry Format

Each regulation includes:

| Field | Description |
|-------|-------------|
| `title` | Human-readable name |
| `jurisdiction` | US, EU, UK, or international |
| `authority` | Issuing body (SEC, ESMA, etc.) |
| `citation` | Official legal citation |
| `url` | Public URL to official text |
| `effectiveDate` | When the regulation took effect |
| `lastAmended` | Date of most recent amendment |
| `status` | `in-force`, `superseded`, `proposed`, or `repealed` |
| `summary` | One-sentence description |
| `soeMappings` | Which SOE agents reference this regulation |

## Versioning

- **Quarterly releases**: `v2026.Q1`, `v2026.Q2`, `v2026.Q3`, `v2026.Q4`
- **Out-of-cycle patches**: `v2026.Q1.PATCH-1` for urgent amendments (e.g., emergency SEC rules)
- Each version is a complete snapshot (not a diff)

## Refresh Process

A GitHub Actions workflow runs quarterly to create a refresh issue with a checklist:

1. Review EUR-Lex, SEC/ECFR, FINRA, BCBS, FASB/IASB for changes
2. Update `lastAmended` dates, flag superseded/repealed regulations
3. Add newly enacted regulations
4. Validate with `npm run validate`
5. PR review and merge

## How Sentinel-Ops References This Registry

Sentinel-Ops compliance exports (OSCAL, STIX, EventBridge) include a `registryVersion` field that pins to a specific version of this registry:

```json
{
  "assessment-results": {
    "metadata": {
      "props": [{
        "name": "regulatory-registry-version",
        "ns": "https://yadriworks.ai/ns/sentinel-ops",
        "value": "2026.Q1"
      }]
    }
  }
}
```

This allows auditors to:
1. See which registry version was active when the assessment ran
2. Look up the exact regulation text via the `url` field
3. Verify the regulation was `in-force` at the time of assessment

## Validation

```bash
# Validate current quarter
npm run validate

# Validate all versions
npm run validate:all
```

## License

MIT — YadriWorks Inc.
