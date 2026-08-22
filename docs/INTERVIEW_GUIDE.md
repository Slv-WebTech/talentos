# Interview Guide

**Status: skeleton only.** Nothing in this project has been built yet ([[IMPLEMENTED_FEATURES]]), so most sections below are intentionally empty placeholders rather than filled in — per the standing protocol's own rule: never claim technologies, features, challenges, or skills that weren't actually implemented/faced. Fill each section in as real work happens, using [[CHANGELOG]] and [[IMPLEMENTED_FEATURES]] as the source of truth for what's actually true.

## 1. Elevator Pitch (forward-looking draft — describes intent, not completed work)
> I'm building an AI-powered Applicant Tracking System to solve slow, inconsistent manual resume screening for recruiters. The application will use a React/Node/PostgreSQL stack with a separate Python AI service for resume parsing and candidate ranking. The most technically interesting part will likely be the resume-ranking pipeline, matching unstructured resume text against a job description without any labeled training data.

Revise this once real implementation happens — replace "building"/"will" with what actually shipped.

## 2. 60-Second Explanation
_Not yet written — needs real implementation to speak to (what it does, why, the hardest part, what was learned). Draft after the MVP vertical slice in [[PROJECT_PLAN]] is working._

## 3. 2–3 Minute Detailed Explanation
_Pending. Will cover: problem, solution, architecture (from [[ARCHITECTURE]]), key features (from [[IMPLEMENTED_FEATURES]] — not [[FEATURES]]), technical challenges actually encountered, and technical decisions actually made (from [[DECISIONS]])._

## 4. STAR Stories
_Empty. A STAR story requires a real Situation/Task/Action/Result that happened — none has happened yet. Candidate topics to watch for as work proceeds (do not write these until they're true):_
- A difficult bug encountered while wiring the AI service to the server
- The resume-ranking design trade-off (see the AI-approach decision in [[DECISIONS]]) — this is the strongest candidate for a "difficult architectural decision" story once implemented
- Any security issue found/fixed handling uploaded files or candidate PII

## 5. Technical Skills Demonstrated
_Empty — a skill matrix built from code that doesn't exist yet would be fabricated. Populate once features in [[IMPLEMENTED_FEATURES]] exist, citing the actual file/pattern as evidence._

## 6. Skill Impact
_Empty, same reasoning as above._

## 7. Engineering Skills
_Empty, same reasoning as above._

## 8. Before vs After
_Empty — needs the project to actually be built to compare against a "before" state._

## 9. Project Impact
_No users, no metrics — this project has no deployment yet. When applicable, use qualitative impact; never invent numbers (per the protocol's own rule)._

## 10. Resume Bullets
_Empty. Draft only from actually-shipped, verifiable work — see [[IMPLEMENTED_FEATURES]] before writing any bullet._

## 11. LinkedIn / Portfolio Description
_Empty — same dependency on real implementation._

## 12–13. Common Interview Questions & Answers
_Empty — should be generated from the technologies actually used (per [[PROJECT_CONTEXT]]'s stack) once there's implementation experience to answer from, not the stack as merely planned._

## 14. "Why Did You Choose X?"
Can be partially answered now, since these are real decisions already made — see [[DECISIONS]] for full reasoning on PostgreSQL, and the rule-based+embeddings AI approach. Expand this section as more decisions are recorded.

## 15. "What Was The Hardest Part?"
_Empty — cannot answer honestly until something has actually been hard._

## 16. "What Would You Improve?"
_Empty — premature; there's nothing built to critique yet. Once the MVP slice lands, [[TECHNICAL_DEBT]] and [[PROJECT_SCORE]] are the honest source material for this answer._

## 17. "What Did You Learn?"
_Empty, pending real work._

## 18. Interview Strength Score
_Not scored — scoring an unbuilt project's interview strength would be fabrication. Score once there's a working MVP._

## 19. Personal Skill Growth Summary
_Empty, pending real work._

## 20. Project Story
```
Idea (spec provided) → Documentation baseline (2026-08-14, this doc) → [next: scaffold] → ...
```
Update this chain as each real phase completes.
