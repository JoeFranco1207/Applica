import User from '../Model/UserSchema.js';
import Employer from '../Model/EmployerSchema.js';
import Jobseeker from '../Model/JobseekerSchema.js';
import Post from '../Model/PostSchema.js';
import Resume from '../Model/ResumeSchema.js';
import Job from '../Model/JobSchema.js';
import AppError from '../Middleware/AppError.js';
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { doHash, doHashValidation  } from '../validator/Hashing.js';
import jwt from 'jsonwebtoken';
import { signupValidation, phoneNumberValidation } from '../validator/Validator.js';
import {sendVerificationEmail, sendForgotPasswordEmail, sendLoginNotificationEmail} from '../Services/NodeMailer.js';
import { createSystemNotificationService } from './Notification.service.js';
import { getPersonalizedJobsService } from './RecommendationScoring.service.js';

// Resolve IP to a human-friendly location string. Uses ipapi.co.
const resolveIpLocation = async (ip) => {
  if (!ip) return null;
  try {
    const url = `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return null;
    const data = await resp.json();
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.region) parts.push(data.region);
    if (data.country_name) parts.push(data.country_name);
    return parts.length ? parts.join(', ') : null;
  } catch (e) {
    return null;
  }
};

// Reverse-geocode coordinates to a human-friendly location using Nominatim (OpenStreetMap).
const reverseGeocodeCoords = async (lat, lng) => {
  if (lat == null || lng == null) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;
    const resp = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Applica/1.0 (contact@example.com)' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && data.address) {
      const addr = data.address;
      const parts = [];
      if (addr.city) parts.push(addr.city);
      if (addr.town && !addr.city) parts.push(addr.town);
      if (addr.village && !addr.city && !addr.town) parts.push(addr.village);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      return parts.length ? parts.join(', ') : (data.display_name || null);
    }
    return data.display_name || null;
  } catch (e) {
    return null;
  }
};

// Helper to normalize legacy employer_ prefixed plan values
const normalizePlanFields = (user) => {
  if (user.premiumPlan && typeof user.premiumPlan === 'string' && user.premiumPlan.startsWith('employer_')) {
    user.premiumPlan = user.premiumPlan.replace(/^employer_/, '');
  }
  if (user.lastAIPaymentPlan && typeof user.lastAIPaymentPlan === 'string' && user.lastAIPaymentPlan.startsWith('employer_')) {
    user.lastAIPaymentPlan = user.lastAIPaymentPlan.replace(/^employer_/, '');
  }
};

const normalizeText = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

const extractKeywords = (text = '') => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const tokens = normalized.match(/\b[a-z0-9]{3,}\b/g) || [];
  return Array.from(new Set(tokens)).slice(0, 12);
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRegexArray = (terms = []) => {
  return terms
    .filter(Boolean)
    .map((term) => new RegExp(escapeRegex(term), 'i'));
};

const dedupeCompanies = (companies = []) => {
  const seen = new Set();
  return companies.reduce((result, company) => {
    const name = normalizeText(typeof company === 'string' ? company : company?.name);
    if (!name || seen.has(name)) return result;
    seen.add(name);
    result.push(typeof company === 'string' ? { name: company } : company);
    return result;
  }, []);
};

const isSameObjectId = (a, b) => {
  if (!a || !b) return false;
  return normalizeText(a.toString()) === normalizeText(b.toString());
};

const getAcceptedJobDataForJobseeker = async (userId) => {
  if (!userId) return null;

  const acceptedJobs = await Job.find({
    'applicants.user': userId,
    'applicants.status': 'accepted',
  })
    .populate({ path: 'createdBy', select: 'companyName' })
    .lean();

  if (!acceptedJobs?.length) return null;

  let bestMatch = null;

  for (const job of acceptedJobs) {
    const application = Array.isArray(job.applicants)
      ? job.applicants.find((entry) => entry?.user?.toString() === userId.toString())
      : null;

    if (!application) continue;

    const updatedAt = application.updatedAt ? new Date(application.updatedAt).getTime() : 0;

    if (!bestMatch || updatedAt > bestMatch.updatedAt) {
      bestMatch = {
        employeeOf: job.createdBy?.companyName || job.companyName || '',
        employeeJobTitle: job.title || '',
        updatedAt,
      };
    }
  }

  return bestMatch;
};

const attachEmployeeTagToUser = async (user) => {
  if (!user || user.role !== 'jobseeker') return user;
  const userObj = user.toObject ? user.toObject() : { ...user };
  const acceptedJob = await getAcceptedJobDataForJobseeker(userObj._id || userObj.id || user);
  if (acceptedJob?.employeeOf) {
    userObj.employeeOf = acceptedJob.employeeOf;
    if (acceptedJob.employeeJobTitle) {
      userObj.employeeJobTitle = acceptedJob.employeeJobTitle;
    }
  }
  return userObj;
};

export const registerService = async (data) => { 
   const {firstName, lastName, email, password, phoneNumber} = data;
    email.toLowerCase();
    const emailExists = await User.findOne({email});
    const phoneNumberExists = await User.findOne({phoneNumber});
     const {error: phoneError} = phoneNumberValidation.validate({phoneNumber});

        if(phoneError){
            throw new AppError("Invalid phone number format. Please use 09XXXXXXXXX or +639XXXXXXXXX.", 400)
        }
        
        if(phoneNumberExists){
            throw new AppError("Phone number already exists", 400)
        }
    
         if(emailExists){
        throw new AppError("email already exists", 400);
         }    
          
         const {error} = signupValidation.validate({email, password}, { abortEarly: false });
    
         if(error){
            const errorMessage = error.details
              .map((detail) => detail.message)
              .join(' ');
            throw new AppError(errorMessage, 400);
         }
       if(password.toLowerCase().includes("password")){
        throw new AppError("Password cannot contain the word 'password'", 400);
       }
         const hashedPassword = await doHash(password, 10);
          
         const newUser = await User.create({
              firstName,
             lastName,
             middleName: "",
             email,
            password: hashedPassword,
             phoneNumber,
         })

            return newUser;
     
};

export const sendVerificationCodeService = async(email) =>{
            const code = Math.floor(100000 + Math.random() * 900000);
           
           const user = await User.findOneAndUpdate(
                {email},
                {
                    verificationCode: code,
                    codeExpiration: Date.now() + 10 * 60 * 1000
                }, 
                {returnDocument: 'after'}
            )

             if(!user){
                throw new AppError("Email not found", 404);
            }
            await sendVerificationEmail(email, code);
         
           return true;
        };

// export const verifyCodeService = async(email, code) =>{

//      const user = await User.findOne({email}).select('+verificationCode +codeExpiration');

//              if(!user){
//                  throw new AppError("Email not found", 404);
//              }          
//              if(user.codeExpiration < Date.now()){
//                  throw new AppError("Verification code expired", 400);
//              }   
//              if(user.verificationCode !== Number(code)){
//                 throw new AppError("Invalid verification code", 400);
//              }
            
//              await User.updateOne(
//                { email},
//                {
//                  isVerified: true,
//                  verificationCode: null,
//                  codeExpiration:null
//                }
//              )
//              return true;
            
//             };
 export const verifyCodeService = async (email, code) => {

  const user = await User.findOne({ email })
    .select('+verificationCode +codeExpiration +password');

  if (!user) {
    throw new AppError("Email not found", 404);
  }

  if (user.codeExpiration < Date.now()) {
    throw new AppError("Verification code expired", 400);
  }

  if (user.verificationCode !== Number(code)) {
    throw new AppError("Invalid verification code", 400);
  }

  // mark user as verified
  user.isVerified = true;
  user.verificationCode = null;
  user.codeExpiration = null;

  // Normalize legacy employer_ prefixed plan values before save
  normalizePlanFields(user);

  await user.save();

  // generate token
  const token = jwt.sign(
    {
      email: user.email,
      id: user._id,
      verified: user.isVerified,
      role: (user.role || 'user').toString().trim().toLowerCase(),
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: "8h"
    }
  );

  // remove password before returning
  const safeUser = user.toObject();
  delete safeUser.password;

  return {
    token,
    user: safeUser
  };
};

export const loginService = async(email, password, deviceInfo, ip) => {
      const existingUser = await User.findOne({email}).select('+password +activeSessionToken');
        if(!existingUser){
            throw new AppError("Invalid Email or Password", 400)
        }
        const isPasswordValid = await doHashValidation(password, existingUser.password);

        if(!isPasswordValid){
            throw new AppError("Invalid Email or Password", 400)
        }

        const safeUser = existingUser.toObject();
        delete safeUser.password;

        if (!existingUser.isVerified) {
            return { user: safeUser };
        }

        // determine a friendly device label and prefer client-sent coords for location
        let resolvedLocation = null;
        try {
          if (deviceInfo && typeof deviceInfo === 'object' && deviceInfo.coords) {
            resolvedLocation = await reverseGeocodeCoords(deviceInfo.coords.lat, deviceInfo.coords.lng);
          }
          if (!resolvedLocation) {
            resolvedLocation = await resolveIpLocation(ip);
          }
        } catch (e) {
          resolvedLocation = null;
        }

        const deviceLabelBase = typeof deviceInfo === 'string' ? deviceInfo : (deviceInfo && (deviceInfo.device || deviceInfo.deviceName || deviceInfo.name)) || 'Unknown device';
        const deviceLabel = resolvedLocation ? `${deviceLabelBase} (${resolvedLocation})` : deviceLabelBase;

        const now = Date.now();
        const activeToken = existingUser.activeSessionToken;
        const activeExpires = existingUser.activeSessionExpires?.getTime?.() ?? existingUser.activeSessionExpires;
        const hasActiveSession = activeToken && (!activeExpires || activeExpires > now);

        if (hasActiveSession) {
            await sendLoginNotificationEmail(
              existingUser.email,
              deviceLabel,
              resolvedLocation
            );

            await createSystemNotificationService(
              existingUser._id,
              `A login attempt was made while your Applica account was already active on another session. If this wasn't you, please secure your account immediately.`,
              'status',
              {
                attemptedDevice: deviceLabel || 'Unknown device',
                attemptedLocation: resolvedLocation || null,
              }
            );

            return {
              user: safeUser,
              alreadyLoggedIn: true,
            };
        }

        if (activeToken && activeExpires && activeExpires <= now) {
            existingUser.activeSessionToken = null;
            existingUser.activeSessionDevice = "";
            existingUser.activeSessionExpires = null;
        }

        const token = jwt.sign({
            email: existingUser.email,
            id: existingUser._id,
            verified: existingUser.isVerified,
            role: (existingUser.role || 'user').toString().trim().toLowerCase(),
        }, process.env.TOKEN_SECRET, {
            expiresIn: "8h"
        });

        const expiresAt = new Date(now + 8 * 60 * 60 * 1000);

        existingUser.activeSessionToken = token;
        existingUser.activeSessionDevice = deviceLabel || "Unknown device";
        existingUser.activeSessionLocation = resolvedLocation || "";
        existingUser.activeSessionExpires = expiresAt;

        // Push to sessions array for multi-session support
        existingUser.sessions = existingUser.sessions || [];
        existingUser.sessions.push({
          token,
          device: deviceLabel || 'Unknown device',
          location: resolvedLocation || '',
          createdAt: new Date(now),
          expires: expiresAt,
        });

        // Normalize legacy employer_ prefixed plan values before save
        normalizePlanFields(existingUser);

        // Defensive: if legacy documents stored `location` as an empty string,
        // convert to the object shape expected by the schema so Mongo doesn't
        // attempt to create nested fields inside a string element.
        if (existingUser.location == null || typeof existingUser.location === 'string') {
          existingUser.location = {
            region: '',
            city: '',
            barangay: '',
            otherDetails: '',
            coords: { lat: null, lng: null },
          };
        }

        await existingUser.save();

        return { token, user: safeUser };
    
}

export const chooseRoleService = async(userId, role) => {
  const normalizedRole = (role || "").toString().trim().toLowerCase();

  if (!['jobseeker', 'employer'].includes(normalizedRole)) {
    throw new AppError("Invalid role selection", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }


  if (user.role !== "user" && user.__t) {
    throw new AppError("Role already selected", 400);
  }

  user.role = normalizedRole;
  user.__t = normalizedRole;

  await user.save();

  return { role: user.role };
}

export const getProfileService = async (userId) => {
  const user = await User.findById(userId).select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode');

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return await attachEmployeeTagToUser(user);
};

export const getUserByIdService = async (userId) => {
  const user = await User.findById(userId).select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return await attachEmployeeTagToUser(user);
};

export const searchUsersByNameService = async (query, requesterId) => {
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const queryRegex = new RegExp(escapedQuery, 'i');
  const queryParts = normalizedQuery.split(/\s+/);

  const searchConditions = [
    { firstName: queryRegex },
    { lastName: queryRegex },
    { companyName: queryRegex },
    { role: queryRegex },
    { bio: queryRegex },
    { experience: queryRegex },
    { education: queryRegex },
    { skills: queryRegex },
    { 'location.region': queryRegex },
    { 'location.city': queryRegex },
    { 'location.barangay': queryRegex },
  ];

  if (queryParts.length >= 2) {
    searchConditions.push({
      firstName: new RegExp(queryParts[0], 'i'),
      lastName: new RegExp(queryParts.slice(1).join(' '), 'i'),
    });
    searchConditions.push({
      companyName: new RegExp(queryParts.join(' '), 'i'),
    });
    searchConditions.push({
      bio: new RegExp(queryParts.join(' '), 'i'),
    });
  }

  const isEmailQuery = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedQuery);
  if (isEmailQuery) {
    searchConditions.push({ email: new RegExp(`^${escapedQuery}$`, 'i') });
  } else if (normalizedQuery.includes('@')) {
    searchConditions.push({ email: queryRegex });
  }

  const filter = {
    $or: searchConditions,
  };

  if (!isEmailQuery) {
    filter.showProfileInSearch = { $ne: false };
  }

  if (requesterId) {
    filter._id = { $ne: requesterId };
  }

  const users = await User.find(filter)
    .select('firstName lastName email profilePicture companyLogo role companyName')
    .limit(12)
    .lean();

  return users.map((user) => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profilePicture: user.profilePicture || user.companyLogo || '',
    role: user.role,
    companyName: user.companyName || '',
  }));
};

// Recommendation service: simple personalized recommendations based on user profile
export const getRecommendationsForUser = async (userId, limit = 6) => {
  if (!userId) return { jobs: [], companies: [], skills: [] };

  const user = await User.findById(userId).lean();
  if (!user) return { jobs: [], companies: [], skills: [] };

  const skills = (user.skills || []).slice(0, 6);

  // Use savedSearches as prioritized recommendations
  const saved = (user.savedSearches || []).slice(0, 6);

  // Jobs: find recent jobs matching user's skills or saved searches
  const jobQuery = [];
  if (skills.length) jobQuery.push({ title: { $in: skills.map(s => new RegExp(s, 'i')) } });
  if (saved.length) jobQuery.push({ title: { $in: saved.map(s => new RegExp(s, 'i')) } });

  let jobs = [];
  if (jobQuery.length) {
    jobs = await Job.find({ $or: jobQuery }).select('title companyName location').sort({ createdAt: -1 }).limit(limit).lean();
  } else {
    jobs = await Job.find({}).select('title companyName location').sort({ createdAt: -1 }).limit(limit).lean();
  }

  // Companies: top companies from user's accepted jobs or companyName fields in user's network
  const companies = [];
  if (user.employeeOf) companies.push({ name: user.employeeOf });
  // add companies from user's connections (if any)
  if (Array.isArray(user.connections) && user.connections.length) {
    const connUsers = await User.find({ _id: { $in: user.connections } }).select('companyName').lean();
    connUsers.forEach((c) => { if (c.companyName) companies.push({ name: c.companyName }); });
  }

  // Deduplicate companies
  const uniqueCompanies = [];
  const seen = new Set();
  companies.forEach((c) => {
    const n = (c.name || '').trim();
    if (!n) return;
    if (!seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); uniqueCompanies.push({ name: n }); }
  });

  return { jobs, companies: uniqueCompanies.slice(0, limit), skills };
};

export const deleteUserService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await Promise.all([
    Post.deleteMany({ author: userId }),
    Resume.deleteMany({ jobseeker: userId }),
    Job.deleteMany({ createdBy: userId }),
    Post.updateMany({ likes: userId }, { $pull: { likes: userId } }),
    Job.updateMany(
      { $or: [{ views: userId }, { likes: userId }, { applicants: userId }] },
      { $pull: { views: userId, likes: userId, applicants: userId } }
    ),
  ]);

  await User.deleteOne({ _id: userId });
  return { message: 'User deleted successfully' };
};

export const getRecommendationsService = async (userId) => {
  if (!userId) throw new AppError('User id required', 400);

  const user = await User.findById(userId).lean();
  if (!user) throw new AppError('User not found', 404);

  const userSkills = Array.isArray(user.skills) ? user.skills.filter(Boolean).slice(0, 6) : [];
  const savedSearches = Array.isArray(user.savedSearches) ? user.savedSearches.filter(Boolean).slice(0, 6) : [];
  const recommendedSkills = userSkills.length ? [...userSkills] : (await User.aggregate([
    { $match: { 'skills.0': { $exists: true } } },
    { $unwind: '$skills' },
    { $group: { _id: '$skills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ])).map((s) => s._id);

  const locationCity = normalizeText(user.location?.city || user.location?.region || '');
  const topSearchKeywords = extractKeywords([user.bio, user.experience, user.education, ...userSkills, ...savedSearches].join(' '));

  let recommendedJobs = [];
  let recommendedCompanies = [];
  let recommendedCompaniesWithProfile = [];
  let recommendedProfiles = [];

  const activeJobFilter = {
    deletedAt: { $exists: false },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  };

  if (user.role !== 'employer') {
    const personalized = await getPersonalizedJobsService(user._id, 8, 0);
    recommendedJobs = Array.isArray(personalized.jobs) ? personalized.jobs : [];

    const companyCounts = new Map();
    recommendedJobs.forEach((job) => {
      const companyName = normalizeText(job.companyName || job.createdBy?.companyName || '');
      if (!companyName) return;
      const key = companyName.toLowerCase();
      const entry = companyCounts.get(key) || { name: job.companyName || job.createdBy?.companyName || '', logo: job.createdBy?.companyLogo || job.createdBy?.profilePicture || '', companyId: job.createdBy?._id || null, openPositions: 0 };
      entry.openPositions += 1;
      companyCounts.set(key, entry);
    });

    if (companyCounts.size) {
      recommendedCompaniesWithProfile = Array.from(companyCounts.values()).slice(0, 6);
      recommendedCompanies = recommendedCompaniesWithProfile.map((company) => company.name);
    } else {
      const popularCompanies = await Job.aggregate([
        { $match: activeJobFilter },
        { $group: { _id: '$companyName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]);
      recommendedCompanies = popularCompanies.map((item) => item._id).filter(Boolean).slice(0, 6);
      const companyProfiles = await User.find({
        companyName: { $in: recommendedCompanies },
        showProfileInSearch: { $ne: false },
      })
        .select('companyName companyLogo profilePicture role')
        .lean();

      const companyProfilesByName = new Map();
      companyProfiles.forEach((profile) => {
        const key = normalizeText(profile.companyName);
        if (!key) return;
        const existing = companyProfilesByName.get(key);
        if (!existing || profile.role === 'employer') {
          companyProfilesByName.set(key, profile);
        }
      });

      recommendedCompaniesWithProfile = recommendedCompanies.map((companyName) => {
        const key = normalizeText(companyName);
        const profile = companyProfilesByName.get(key);
        return {
          name: companyName,
          logo: profile?.companyLogo || profile?.profilePicture || '',
          companyId: profile?._id || null,
          openPositions: popularCompanies.find((item) => normalizeText(item._id) === key)?.count || 0,
        };
      });
    }
  }

  if (user.role === 'employer') {
    const employerJobs = await Job.find({ createdBy: user._id }).lean();
    const employerKeywords = extractKeywords(employerJobs.map((job) => [job.title, job.description, job.requirements].filter(Boolean).join(' ')).join(' '));
    const searchRegex = buildRegexArray(employerKeywords.length ? employerKeywords : [user.companyName, user.bio, user.location?.city, user.location?.region].filter(Boolean));

    const profileMatch = {
      role: 'jobseeker',
      showProfileInSearch: { $ne: false },
    };
    const orCriteria = [];

    if (searchRegex.length) {
      orCriteria.push({ skills: { $in: employerKeywords } });
      orCriteria.push({ experience: { $in: searchRegex } });
      orCriteria.push({ bio: { $in: searchRegex } });
      orCriteria.push({ education: { $in: searchRegex } });
    }

    if (locationCity) {
      const locationRegex = new RegExp(escapeRegex(locationCity), 'i');
      orCriteria.push({ 'location.city': locationRegex });
      orCriteria.push({ 'location.region': locationRegex });
    }

    if (orCriteria.length) {
      profileMatch.$or = orCriteria;
    }

    recommendedProfiles = await User.find(profileMatch)
      .select('firstName lastName profilePicture companyName role skills bio location')
      .sort({ premiumAIAccess: -1, lastActive: -1, createdAt: -1 })
      .limit(6)
      .lean();

    if (!recommendedProfiles.length) {
      recommendedProfiles = await User.find({ role: 'jobseeker', showProfileInSearch: { $ne: false } })
        .select('firstName lastName profilePicture companyName role skills bio location')
        .sort({ premiumAIAccess: -1, lastActive: -1, createdAt: -1 })
        .limit(6)
        .lean();
    }

    const candidateCompanyNames = employerJobs.map((job) => normalizeText(job.companyName)).filter(Boolean);
    recommendedCompanies = dedupeCompanies(candidateCompanyNames).slice(0, 6).map((company) => company.name);
    recommendedCompaniesWithProfile = [];
  }

  return {
    recommendedCompanies,
    recommendedCompaniesWithProfile,
    recommendedJobs,
    recommendedSkills,
    savedSearches,
    recommendedProfiles,
  };
};
