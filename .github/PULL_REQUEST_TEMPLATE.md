## What
<!-- One or two sentences: what does this change? -->

## Why
<!-- The problem or user need behind it. Link issues with "Closes #123". -->

## How it was tested
- [ ] `cd server && npm test`
- [ ] `cd server && npm run test:integration` (if SQL or migrations changed)
- [ ] `cd ai-service && python -m pytest tests`
- [ ] `cd client && npm test && npm run build`
- [ ] Checked manually in the browser (describe below)

## Checklist
- [ ] No secrets, `.env` files, or real candidate data in the diff
- [ ] New migrations are additive and numbered (`server/db/migrations/NNN_*.sql`)
- [ ] Docs / README / `docs/CHANGELOG.md` updated if behaviour changed
- [ ] Known limitations noted below

## Known limitations / follow-ups
