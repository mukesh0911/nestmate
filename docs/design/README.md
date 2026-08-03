# NestMate Premium Design — Index

| Phase | Artifact | Status |
|-------|----------|--------|
| 1 Product research | [01-PRODUCT_RESEARCH_BRIEF.md](01-PRODUCT_RESEARCH_BRIEF.md) | Done |
| 2 Competitive UX | [02-COMPETITIVE_UX_RESEARCH.md](02-COMPETITIVE_UX_RESEARCH.md) | Done |
| 3 Principles | [03-DESIGN_PRINCIPLES.md](03-DESIGN_PRINCIPLES.md) | Done |
| 4 IA | [04-INFORMATION_ARCHITECTURE.md](04-INFORMATION_ARCHITECTURE.md) | Done |
| 5 Low-fi wireframes | [wireframes/index.html](wireframes/index.html) | Done (HTML; Figma sync pending auth) |
| 6 Hi-fi + proto + critique | [hifi/index.html](hifi/index.html) | Done (HTML; Figma sync pending auth) |
| 7 React | — | **Blocked** until you approve |

## Open locally

```bash
open docs/design/wireframes/index.html
open docs/design/hifi/index.html
```

## Figma

Cloud agent cannot complete interactive Figma MCP authentication. After authenticating Figma in **Cursor desktop**:

1. Create file **NestMate Premium — Research & Design**
2. Run scripts in [`figma-sync/`](figma-sync/) via `use_figma`
3. Update [`figma-state.json`](figma-state.json) with `file_key`

## Approval gates

- **Wireframes:** Review `wireframes/index.html` — reply `approve wireframes` (or request changes)
- **Hi-fi quality bar:** Review `hifi/index.html` — reply `approve hi-fi` before any React presentation work
