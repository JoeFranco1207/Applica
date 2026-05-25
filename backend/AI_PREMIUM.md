Applica AI Premium - Backend notes

- Purpose: Gate AI-powered features (unlimited resume generation with AI assistance, and AI-powered applicant filtering) behind the `premiumAIAccess` flag on the `User` model.

- Resume generation:
  - The `createResumeService` accepts an optional boolean flag `useAI` in the `resumeData` payload.
  - If `useAI: true` is provided, the service will check `user.premiumAIAccess` and return `403` when not present.
  - Integration point for an LLM or other AI enrichment: inside `createResumeService` where the `useAI` guard is checked.

- AI applicant filtering:
  - New service `filterApplicantsWithAI(jobId, employerId, keywords)` implements a gated, deterministic keyword-ranking algorithm.
  - Employers must have `premiumAIAccess` enabled to call this feature; otherwise the API returns `403`.
  - Controller: `filterApplicantsWithAIController` (see [backend/Controller/JobsController.js](backend/Controller/JobsController.js))
  - Route: `POST /api/employer/my-jobs/:jobId/applicants/filter-ai` (protected, employer-only)

- Notes & next steps:
  - Replace the simple keyword ranking with a real LLM/reranker if available; keep the premium guard.
  - Consider recording usage metrics and creating billing hooks if desired.
