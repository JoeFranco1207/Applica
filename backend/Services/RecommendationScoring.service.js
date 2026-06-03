import Job from '../Model/JobSchema.js';
import Post from '../Model/PostSchema.js';
import User from '../Model/UserSchema.js';
import AppError from '../Middleware/AppError.js';

/**
 * Extract keywords from text (4+ chars, case-insensitive)
 */
const extractKeywords = (text = '') => {
  if (!text) return [];
  const normalized = String(text).toLowerCase();
  const tokens = normalized.match(/\b[a-z0-9]{4,}\b/g) || [];
  return Array.from(new Set(tokens));
};

/**
 * Calculate keyword overlap score between two sets of keywords
 * Returns 0-100 scale
 */
const calculateKeywordOverlapScore = (sourceKeywords = [], targetKeywords = []) => {
  if (!sourceKeywords.length || !targetKeywords.length) return 0;
  
  const overlap = sourceKeywords.filter(k => targetKeywords.includes(k));
  const similarity = overlap.length / Math.max(sourceKeywords.length, targetKeywords.length);
  return Math.round(similarity * 100);
};

/**
 * Score experience match (0-100)
 * Matches job title/description against user's stated experience
 */
const scoreExperienceMatch = (job, userExperience = '') => {
  if (!userExperience || !job) return 0;
  
  const jobText = [job.title, job.description, job.requirements]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  const expKeywords = extractKeywords(userExperience);
  if (!expKeywords.length) return 0;
  
  let matchScore = 0;
  expKeywords.forEach(keyword => {
    if (jobText.includes(keyword)) {
      const occurrences = (jobText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
      matchScore += Math.min(occurrences, 3) * 15; // Up to 45 points per keyword
    }
  });
  
  return Math.min(matchScore, 100);
};

/**
 * Score education match (0-100)
 * Matches job requirements against user's stated education level
 */
const scoreEducationMatch = (job, userEducation = '') => {
  if (!userEducation || !job) return 0;
  
  const jobText = [job.title, job.requirements, job.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  const educationKeywords = extractKeywords(userEducation);
  if (!educationKeywords.length) return 0;
  
  // Education keywords might include degree types, fields, etc.
  let matchScore = 0;
  educationKeywords.forEach(keyword => {
    if (jobText.includes(keyword)) {
      matchScore += 25; // 25 points per education keyword match
    }
  });
  
  return Math.min(matchScore, 100);
};

/**
 * Score location match (0-100)
 * 100 = same city, 75 = same region, 50 = same country, 25 = remote option, 0 = no match
 */
const scoreLocationMatch = (job, userLocation = {}) => {
  if (!job || !userLocation) return 0;
  
  // Remote jobs are always good
  if (job.remoteType === 'Remote') return 100;
  
  const jobCity = (job.location || '').toLowerCase().trim();
  const userCity = (userLocation.city || '').toLowerCase().trim();
  const userRegion = (userLocation.region || '').toLowerCase().trim();
  
  // Exact city match (highest priority)
  if (jobCity && userCity && jobCity === userCity) return 100;
  
  // Check if job location contains user's city
  if (jobCity && userCity && jobCity.includes(userCity)) return 95;
  
  // Region/area match
  if (userRegion && jobCity && jobCity.includes(userRegion)) return 75;
  
  // Hybrid is better than on-site for non-local jobs
  if (job.remoteType === 'Hybrid') return 50;
  
  // On-site in different location gets low score
  if (job.remoteType === 'On-site') return 25;
  
  return 0;
};

/**
 * Score salary appropriateness (0-100)
 * User gets higher score for jobs matching their expected range
 */
const scoreSalaryMatch = (job, userExpectedSalary = null) => {
  if (!job || !userExpectedSalary) return 50; // Neutral if unknown
  
  const minSalary = job.salaryMin || job.salary || 0;
  const maxSalary = job.salaryMax || job.salary || 0;
  
  if (!minSalary && !maxSalary) return 50; // No salary info
  
  // If user expects salary is below job's min, it's not a good match
  if (userExpectedSalary < minSalary * 0.9) return 20;
  
  // If user expects salary is above job's max, slightly less ideal but acceptable
  if (userExpectedSalary > maxSalary * 1.2) return 40;
  
  // Within reasonable range
  if (userExpectedSalary >= minSalary && userExpectedSalary <= maxSalary) return 100;
  
  // Close to range
  return 70;
};

/**
 * Score employment type match (0-100)
 * Some users might prefer certain types
 */
const scoreEmploymentTypeMatch = (job, userPreferredTypes = []) => {
  if (!job || !userPreferredTypes || !userPreferredTypes.length) return 50; // Neutral
  
  if (userPreferredTypes.includes(job.employmentType)) return 100;
  
  // Full-time is generally popular
  if (job.employmentType === 'Full-time') return 80;
  
  return 40;
};

/**
 * Calculate comprehensive recommendation score for a job (0-100)
 * Weights: Experience (30%), Location (25%), Education (20%), Salary (15%), Type (10%)
 */
export const scoreJobRecommendation = (job, userProfile = {}) => {
  if (!job || !userProfile) return 0;
  
  const {
    experience = '',
    education = '',
    location = {},
    expectedSalary = null,
    preferredEmploymentTypes = [],
  } = userProfile;
  
  const scores = {
    experience: scoreExperienceMatch(job, experience),
    education: scoreEducationMatch(job, education),
    location: scoreLocationMatch(job, location),
    salary: scoreSalaryMatch(job, expectedSalary),
    employment: scoreEmploymentTypeMatch(job, preferredEmploymentTypes),
  };
  
  // Weighted average
  const totalScore = 
    (scores.experience * 0.30) +
    (scores.location * 0.25) +
    (scores.education * 0.20) +
    (scores.salary * 0.15) +
    (scores.employment * 0.10);
  
  return {
    score: Math.round(totalScore),
    breakdown: scores,
  };
};

/**
 * Calculate recommendation score for a social post
 * Scores based on author relevance and content match
 */
export const scorePostRecommendation = (post, userProfile = {}) => {
  if (!post) return 0;
  
  const { experience = '', education = '' } = userProfile;
  
  const postContent = [
    post.content,
    post.tags?.join(' '),
    post.authorName,
    post.authorCompanyName,
  ]
    .filter(Boolean)
    .join(' ');
  
  const userKeywords = extractKeywords([experience, education].join(' '));
  
  if (!userKeywords.length) return 50; // Neutral score for incomplete profiles
  
  const postKeywords = extractKeywords(postContent);
  const overlapScore = calculateKeywordOverlapScore(userKeywords, postKeywords);
  
  // Boost if post is from a known company or relevant author
  let authorBoost = 0;
  if (post.authorRole === 'employer') authorBoost = 20;
  if (post.authorCompanyName) authorBoost = 15;
  
  return Math.min(overlapScore + authorBoost, 100);
};

/**
 * Get personalized job recommendations for a user
 * Returns sorted jobs with scores
 */
export const getPersonalizedJobsService = async (userId, limit = 20, skip = 0) => {
  if (!userId) throw new AppError('User ID required', 400);
  
  // Fetch user profile
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError('User not found', 404);
  
  // Build user profile for scoring
  const userProfile = {
    experience: user.experience || '',
    education: user.education || '',
    location: user.location || {},
    expectedSalary: user.expectedSalary || null,
    preferredEmploymentTypes: user.preferredEmploymentTypes || [],
  };
  
  // Fetch all active jobs
  const activeJobFilter = {
    deletedAt: { $exists: false },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  };
  
  const jobs = await Job.find(activeJobFilter)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email companyName role profilePicture companyLogo',
    })
    .lean();
  
  // Score each job
  const jobsWithScores = jobs.map(job => {
    const { score, breakdown } = scoreJobRecommendation(job, userProfile);
    return {
      ...job,
      recommendationScore: score,
      scoreBreakdown: breakdown,
    };
  });
  
  // Filter out very low scores (< 10) and sort by score descending
  const recommendedJobs = jobsWithScores
    .filter(j => j.recommendationScore >= 10)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(skip, skip + limit);
  
  const total = jobsWithScores.filter(j => j.recommendationScore >= 10).length;
  
  return {
    jobs: recommendedJobs,
    total,
    userProfile: {
      experience: userProfile.experience,
      education: userProfile.education,
      location: userProfile.location,
    },
  };
};

/**
 * Get personalized social posts recommendations for a user
 * Returns sorted posts with scores
 */
export const getPersonalizedPostsService = async (userId, limit = 20, skip = 0, viewerId = null) => {
  if (!userId) throw new AppError('User ID required', 400);
  
  // Fetch user profile
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError('User not found', 404);
  
  // Build user profile for scoring
  const userProfile = {
    experience: user.experience || '',
    education: user.education || '',
  };
  
  // Fetch all active, non-restricted posts
  const filter = {
    restricted: { $ne: true },
    archived: { $ne: true },
  };
  
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  
  // Filter by visibility and score each post
  const postsWithScores = posts.map(post => {
    const score = scorePostRecommendation(post, userProfile);
    return {
      ...post,
      recommendationScore: score,
    };
  }).filter(p => p.recommendationScore >= 20) // Filter low scores
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(skip, skip + limit);
  
  const total = posts
    .filter(p => scorePostRecommendation(p, userProfile) >= 20)
    .length;
  
  return {
    posts: postsWithScores,
    total,
    userProfile: {
      experience: userProfile.experience,
      education: userProfile.education,
    },
  };
};

/**
 * Get combined personalized feed (jobs + posts)
 * Returns interleaved jobs and posts based on scores
 */
export const getPersonalizedFeedService = async (userId, limit = 30, skip = 0) => {
  if (!userId) throw new AppError('User ID required', 400);
  
  const jobData = await getPersonalizedJobsService(userId, Math.ceil(limit * 0.4), 0);
  const postData = await getPersonalizedPostsService(userId, Math.ceil(limit * 0.6), 0);
  
  // Combine and interleave by score
  const combined = [
    ...jobData.jobs.map(j => ({ ...j, type: 'job' })),
    ...postData.posts.map(p => ({ ...p, type: 'post' })),
  ]
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(skip, skip + limit);
  
  return {
    feed: combined,
    total: jobData.total + postData.total,
    stats: {
      jobCount: jobData.jobs.length,
      postCount: postData.posts.length,
    },
  };
};

export default {
  scoreJobRecommendation,
  scorePostRecommendation,
  getPersonalizedJobsService,
  getPersonalizedPostsService,
  getPersonalizedFeedService,
};
