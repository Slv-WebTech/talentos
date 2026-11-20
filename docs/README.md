# Documentation Index

Start with [[DEV_CONTEXT]] if you're picking this project back up — it's the "what's happening right now" file. The root [README](../README.md) covers setup, configuration and the API at a glance.

| File | What it's for |
|---|---|
| [[PROJECT_CONTEXT]] | Purpose, users, stack, current status |
| [[PROJECT_PLAN]] | Roadmap — Completed / In Progress / Next / Later / Blocked |
| [[ARCHITECTURE]] | Technical architecture, data flow, data model, API surface, folder structure |
| [[DECISIONS]] | ADR log — why Postgres, why rule-based AI, auth re-check, transition rules, etc. |
| [[PROJECT_STYLE]] | Code conventions and UI style |
| [[FEATURES]] | Feature inventory with status |
| [[IMPLEMENTED_FEATURES]] | What's actually built and verified |
| [[FUTURE_FEATURES]] | Bonus/enhancement backlog, prioritized |
| [[SITE_MAP]] | Application routes and their status |
| [[PROJECT_SCORE]] | Honest quality baseline, re-scored per milestone |
| [[TECHNICAL_DEBT]] | Known shortcuts and their fixes |
| [[TESTING]] | Test suites, commands, known gaps |
| [QA-REPORT](QA-REPORT.md) | Senior-QA findings, what was fixed, what remains and why |
| [[DEPLOYMENT]] | Target platforms, environment variables, hardening checklist |
| [[CHANGELOG]] | Dated history of what changed |
| [[INTERVIEW_GUIDE]] | Portfolio/interview material |

## Status
In development. Auth, job postings, resume upload + AI parsing, match scoring, the hiring pipeline with audit history, and recruiter search/filter are implemented and covered by 54 automated tests (see [[TESTING]]). Interview scheduling, analytics, notifications and an admin console are still planned. See [[PROJECT_SCORE]] for the current honest baseline and [QA-REPORT](QA-REPORT.md) for open items.
