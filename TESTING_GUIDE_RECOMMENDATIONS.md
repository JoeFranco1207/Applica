# Smart Feed Recommendation System - Testing Guide

## Overview
This document provides comprehensive steps to test the personalized feed recommendation system. The system automatically recommends jobs and posts based on user profile (experience, education, skills, location).

## Architecture Summary

### Backend Flow
1. User requests `/api/auth/feed/personalized-jobs` (or similar endpoint)
2. RecommendationScoring.service.js scores all jobs against user profile
3. Jobs filtered (score >= 10) and sorted by score (highest first)
4. Returns scored jobs with breakdown

### Frontend Flow
1. BrowseJob.jsx checks if user is jobseeker with profile data
2. If yes, fetches from personalized endpoint
3. If no, fetches from generic endpoint
4. Displays jobs/posts in recommendation order

## Test Scenarios

### Scenario 1: Jobseeker with Complete Profile
**Setup**:
1. Create jobseeker account
2. Complete profile with:
   - Experience: "5 years in React development and Node.js backend"
   - Education: "Bachelor of Science in Computer Science"
   - Location: City = "Manila", Region = "NCR"
   - Skills: React, Node.js, JavaScript

**Expected Results**:
- Browse Jobs page shows React/Node jobs first
- Manila/NCR jobs score higher than on-site jobs
- Backend developer roles appear before unrelated roles
- Console shows scores in network response

**How to Verify**:
1. Log in as jobseeker
2. Navigate to Browse Jobs
3. Open browser DevTools > Network
4. Check /api/auth/feed/personalized-jobs request
5. Expand response and verify "recommendationScore" field on jobs
6. Verify React/Node jobs appear first

### Scenario 2: Jobseeker with Incomplete Profile
**Setup**:
1. Create jobseeker account
2. Complete only name/basic info, leave experience empty

**Expected Results**:
- Should fall back to generic feed (`/api/jobs`)
- All jobs shown in default order
- No personalization applied

**How to Verify**:
1. Navigate to Browse Jobs
2. Check Network tab
3. Should see `/api/jobs` endpoint (not `/api/auth/feed/...`)

### Scenario 3: Job Scoring Breakdown
**Setup**: Complete profile jobseeker browsing jobs

**Expected Results**:
Each job in response includes `scoreBreakdown`:
```json
{
  "_id": "...",
  "title": "Senior React Developer",
  "recommendationScore": 82,
  "scoreBreakdown": {
    "experience": 90,      // Match with React mentioned in profile
    "education": 75,       // Computer Science background match
    "location": 100,       // Remote job
    "salary": 70,          // Within expected range
    "employment": 80       // Full-time available
  }
}
```

**How to Verify**:
1. Open DevTools > Network > API response
2. Find a recommended job
3. Expand `scoreBreakdown` object
4. Verify all 5 component scores present (0-100)

### Scenario 4: Location Matching
**Setup**: Jobseeker in Manila with jobs in different locations

**Expected Results**:
- Remote jobs: 100 points
- Same city jobs: 100 points
- Same region jobs: 75 points
- Hybrid jobs: 50 points
- On-site in different city: 25 points

**How to Verify**:
1. Create test jobs:
   - "Remote React Dev" (Remote)
   - "Manila Frontend Dev" (On-site, Manila)
   - "Cebu Backend Dev" (On-site, Cebu)
   - "Quezon City Hybrid" (Hybrid, QC)

2. Browse as Manila jobseeker
3. Verify order matches location scoring

### Scenario 5: Experience Matching
**Setup**: Profile with "5 years service crew" + jobs for different roles

**Expected Results**:
- Hospitality/service industry jobs score high
- Tech jobs score very low
- Keywords from profile appear in top recommendations

**How to Verify**:
1. Create jobseeker with experience="service crew in hotels"
2. Browse jobs
3. Hotel staff, restaurant, hospitality jobs should appear first
4. Tech jobs should be lower

### Scenario 6: Social Posts Personalization
**Setup**: Complete profile jobseeker browsing social posts

**Expected Results**:
- Posts mentioning profile keywords score higher
- Posts from employers score higher
- Personalized posts endpoint used (`/api/auth/feed/personalized-posts`)

**How to Verify**:
1. Navigate to Feed/Social section
2. Check Network > /api/auth/feed/personalized-posts
3. Verify `recommendationScore` on posts

### Scenario 7: Pagination
**Test**: Getting more recommendations after initial load

**Setup**: Add `?limit=10&skip=10` to personalized endpoint

**Expected Results**:
- First 10 recommendations returned at skip=0
- Next 10 at skip=10
- Scores consistent across pages

**How to Verify**:
```bash
curl "http://localhost:8000/api/auth/feed/personalized-jobs?limit=5&skip=0" \
  -H "Authorization: Bearer <TOKEN>"

curl "http://localhost:8000/api/auth/feed/personalized-jobs?limit=5&skip=5" \
  -H "Authorization: Bearer <TOKEN>"
```

### Scenario 8: Combined Feed
**Test**: Interleaved jobs and posts

**Setup**: Access `/api/auth/feed/personalized` endpoint

**Expected Results**:
- Returns both jobs and posts
- Sorted by score (mixed types)
- Response includes "feed" array with "type" field on each item
- Stats show jobCount and postCount

**How to Verify**:
```bash
curl "http://localhost:8000/api/auth/feed/personalized?limit=10" \
  -H "Authorization: Bearer <TOKEN>" | jq '.data.feed[].type'
```

## Manual Testing Checklist

- [ ] Jobseeker with complete profile sees personalized jobs
- [ ] Jobseeker with incomplete profile sees generic jobs
- [ ] Remote jobs appear high in recommendations
- [ ] Location-matching works correctly
- [ ] Experience keywords matched in scores
- [ ] Education level considered in scoring
- [ ] Salary range affects scoring
- [ ] Employment type affects scoring
- [ ] Social posts are personalized
- [ ] Combined feed works
- [ ] Pagination works correctly
- [ ] Scores are consistent (re-load shows same scores)
- [ ] Fallback to generic feed works if personalization fails
- [ ] Low-scoring items (< 10) are filtered

## Performance Testing

### Load Test
```javascript
// In browser console
async function testRecommendations() {
  const start = Date.now();
  const res = await fetch('/api/auth/feed/personalized-jobs?limit=50', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const data = await res.json();
  console.log(`Time: ${Date.now() - start}ms, Items: ${data.data.jobs.length}`);
}
testRecommendations();
```

### Expected: < 2000ms for 50 items

## Debugging

### Check Recommendation Score Calculation
```javascript
// Open DevTools > Network, look for API response
// Find a job with lower-than-expected score
// Manual calculation:
experience_score = 85;
location_score = 100;
education_score = 70;
salary_score = 60;
employment_score = 80;

total = (85 * 0.30) + (100 * 0.25) + (70 * 0.20) + (60 * 0.15) + (80 * 0.10)
      = 25.5 + 25 + 14 + 9 + 8 = 81.5 ≈ 82
```

### Enable Console Logging
In RecommendationScoring.service.js, add:
```javascript
console.log('User Profile:', userProfile);
console.log('Job Scores:', jobsWithScores[0]);
```

### Test without Frontend
```bash
# Terminal 1: Start backend server
npm start

# Terminal 2: Test API directly
TOKEN="your-jwt-token"
curl "http://localhost:8000/api/auth/feed/personalized-jobs" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Known Limitations

1. **First-time users**: Empty profile = generic feed (not an error)
2. **Keyword extraction**: Only 4+ character tokens (skips "react", "node", etc. in lowercase but catches them in full contexts)
3. **No real-time updates**: Feed cached for session (reload to refresh)
4. **Location match**: City-level only (no GPS distance)
5. **Salary**: Assumes user.expectedSalary field exists (might be null)

## Success Criteria

✅ **100% work requirement met if**:
1. Jobseekers with profiles see filtered jobs/posts
2. Scores make logical sense (experience-related jobs score high)
3. Fallback to generic feed works when profile incomplete
4. All 5 scoring factors present and weighted correctly
5. Pagination works without breaking recommendations
6. No errors in browser console or server logs
7. Endpoints return 200 status on success
8. Error handling for missing profiles/users works

