import AppError from '../Middleware/AppError.js';
import Job from '../Model/JobSchema.js';
import User from '../Model/UserSchema.js';

/**
 * AI-like applicant filtering (stub implementation)
 * - Requires employer to have `premiumAIAccess`.
 * - Accepts an array of keywords and ranks applicants by simple keyword matches
 *   across the applicant's `bio`, `experience`, and `education` fields.
 *
 * Note: This is a deterministic, fast server-side implementation used to provide
 * a gated AI filtering experience. Integrating a real LLM/reranker should be
 * performed where noted and must remain behind the premium access check.
 */
export const filterApplicantsWithAI = async (jobId, employerId, keywords = []) => {
  const employer = await User.findById(employerId).select('premiumAIAccess');
  if (!employer) throw new AppError('Employer not found', 404);
  if (!employer.premiumAIAccess) throw new AppError('AI filtering requires Applica AI Premium access', 403);

  const job = await Job.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);
  if (job.createdBy.toString() !== employerId.toString()) throw new AppError('Not authorized to filter applicants for this job', 403);

  // Normalize keywords to lowercase strings
  const kw = Array.isArray(keywords) ? keywords.map(k => ('' + k).toLowerCase().trim()).filter(Boolean) : [];

  // Gather applicant data and compute a simple score
  const results = [];
  for (const entry of job.applicants) {
    const applicantId = entry.user ? entry.user : entry;
    const user = await User.findById(applicantId).select('firstName lastName bio experience education resume profilePicture');
    if (!user) continue;

    const text = `${user.bio || ''} ${user.experience || ''} ${user.education || ''}`.toLowerCase();
    let score = 0;
    for (const k of kw) {
      if (text.includes(k)) score += 1;
    }

    results.push({
      applicant: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        resume: user.resume,
        profilePicture: user.profilePicture,
      },
      score,
    });
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results;
};
