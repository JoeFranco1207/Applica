import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import AppError from '../Middleware/AppError.js';
import User from "../Model/UserSchema.js";

// Template generators for each resume style
const templateGenerators = {
  'classic-professional': generateClassicProfessional,
  'creative-minimal': generateCreativeMinimal,
  'modern-tech': generateModernTech,
  'executive-premium': generateExecutivePremium,
  'academic-scholar': generateAcademicScholar,
  'creative-vibrant': generateCreativeVibrant,
};

export const createResumeService = async (userId, resumeData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Premium check: if the frontend requested AI-assisted resume generation
  // via `resumeData.useAI === true`, require the user to have `premiumAIAccess`.
  // Premium users may generate unlimited AI-assisted resumes.
  if (resumeData && resumeData.useAI) {
    if (!user.premiumAIAccess) {
      throw new AppError('AI-generated resumes require Applica AI Premium access', 403);
    }
    // Note: here is where real AI-enhanced resume generation code would run.
    // This project currently renders HTML templates; integrating an LLM
    // should be done here and must remain behind this premium guard.
  }

  const firstName = user.firstName || "";
  const middleName = user.middleName || "";
  const lastName = user.lastName || "";

  const name = `${firstName} ${middleName} ${lastName}`
    .replace(/\s+/g, " ")
    .trim() || "User";

  const email = user.email || "no-email";
  const phone = user.phoneNumber || "";

  const {
    education = [],
    experience = [],
    skills = [],
    references = [],
    extracurricular = [],
    template = 'classic-professional',
    color = '#1e40af',
  } = resumeData;

  // Parse education/experience/skills data
  const educationItems = Array.isArray(education) && education.length ? education : (typeof education === 'string' && education.length ? education.split('\n').filter(e => e.trim()) : []);
  const experienceItems = Array.isArray(experience) && experience.length ? experience : (typeof experience === 'string' && experience.length ? experience.split('\n').filter(e => e.trim()) : []);
  const skillItems = Array.isArray(skills) ? skills : (typeof skills === 'string' && skills.length ? skills.split(',').map(s=>s.trim()).filter(s => s) : []);
  
  // Parse references data - filter out empty entries
  const referenceItems = Array.isArray(references) 
    ? references.filter(r => r && (r.name || r.contact))
    : [];
  
  // Parse extracurricular data - filter out empty entries
  const extracurricularItems = Array.isArray(extracurricular)
    ? extracurricular.filter(e => e && typeof e === 'string' && e.trim().length > 0)
    : [];

  // Extract location information
  const locationParts = [];
  if (user.location?.barangay) locationParts.push(user.location.barangay);
  if (user.location?.city) locationParts.push(user.location.city);
  if (user.location?.region) locationParts.push(user.location.region);
  const location = locationParts.join(', ');

  const profileData = {
    name,
    email,
    phone,
    bio: user.bio || '',
    profilePicture: user.profilePicture || '',
    location,
    citizenship: user.citizenShip || 'Not specified',
    education: educationItems,
    experience: experienceItems,
    skills: skillItems,
    references: referenceItems,
    extracurricular: extracurricularItems,
    color: color || '#1e40af',
  };

  // Get the template generator function
  const templateGenerator = templateGenerators[template] || generateClassicProfessional;
  const htmlContent = templateGenerator(profileData);

  const resumeDir = path.join(process.cwd(), "uploads", "resumes");

  if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
  }

  const safeName = name.replace(/\s+/g, "_");
  const timestamp = Date.now();
  const fileName = `${safeName}_resume_${timestamp}.pdf`;
  const filePath = path.join(resumeDir, fileName);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    fs.writeFileSync(filePath, pdfBuffer);

    // Save a public URL to the user's profile (served from /uploads)
    const publicUrlBase = process.env.BACKEND_URL || 'http://localhost:8000';
    const publicPath = `/uploads/resumes/${fileName}`;
    user.resume = `${publicUrlBase}${publicPath}`;

    await user.save();
    return {
      fileName,
      filePath,
      publicUrl: user.resume,
      pdfBuffer,
    };

  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// TEMPLATE 1: CLASSIC PROFESSIONAL - Clean, traditional, corporate
function generateClassicProfessional(data) {
  const profilePicHtml = data.profilePicture ? `<div class="photo"><img src="${data.profilePicture}" alt="profile"/></div>` : '';
  
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${data.color}; }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{font-family:'Segoe UI','Roboto','Helvetica','Arial',sans-serif;color:#2c3e50;line-height:1.6}
        .container{max-width:850px;margin:30px auto;padding:40px;background:#fff}
        .header{display:flex;align-items:center;gap:25px;margin-bottom:35px;border-bottom:3px solid var(--accent);padding-bottom:25px}
        .header-content h1{font-size:32px;font-weight:700;color:#1a1a1a;margin:0 0 5px 0;letter-spacing:-0.5px}
        .header-content p{color:var(--accent);font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0}
        .header-contact{margin-left:auto;text-align:right;font-size:12px;color:#555;line-height:1.8}
        .photo img{width:100px;height:100px;border-radius:50%;object-fit:cover;border:4px solid var(--accent)}
        
        .summary{margin:30px 0;padding:20px;background:#f5f7fa;border-left:5px solid var(--accent);font-size:14px;color:#444;line-height:1.7}
        
        .section{margin:28px 0}
        .section-title{font-size:13px;font-weight:700;text-transform:uppercase;color:var(--accent);margin:0 0 15px 0;letter-spacing:1.5px;padding-bottom:8px;border-bottom:2px solid #e0e0e0}
        .section-content{padding:0}
        
        .item{margin-bottom:14px;font-size:13px}
        .item-title{font-weight:700;color:#1a1a1a}
        .item-subtitle{color:var(--accent);font-weight:600;font-size:12px}
        .item-detail{color:#666;font-size:12px;margin-top:3px}
        
        .skills-container{display:flex;flex-wrap:wrap;gap:8px}
        .skill-badge{display:inline-block;padding:6px 12px;background:var(--accent);color:#fff;border-radius:4px;font-size:12px;font-weight:600}
        
        .two-column{display:grid;grid-template-columns:1fr 320px;gap:30px;margin-top:30px}
        .sidebar{background:#f5f7fa;padding:20px;border-radius:4px}
        .sidebar .section-title{color:var(--accent);border-bottom:2px solid #e0e0e0}
        
        @media (max-width:800px){.two-column{grid-template-columns:1fr}.header{flex-direction:column;text-align:center}.header-contact{text-align:center;margin-left:0}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <h1>${data.name}</h1>
            <p>Professional Resume</p>
          </div>
          ${profilePicHtml}
          <div class="header-contact">
            <div>${data.email}</div>
            ${data.phone ? `<div>${data.phone}</div>` : ''}
            ${data.location ? `<div>${data.location}</div>` : ''}
          </div>
        </div>

        ${data.bio ? `<div class="summary">${data.bio}</div>` : ''}

        <div class="two-column">
          <div>
            ${data.experience.length ? `
            <div class="section">
              <div class="section-title">Experience</div>
              <div class="section-content">
                ${data.experience.map(exp => `<div class="item"><div class="item-title">${exp}</div></div>`).join('')}
              </div>
            </div>
            ` : ''}

            ${data.education.length ? `
            <div class="section">
              <div class="section-title">Education</div>
              <div class="section-content">
                ${data.education.map(edu => `<div class="item"><div class="item-title">${edu}</div></div>`).join('')}
              </div>
            </div>
            ` : ''}

            ${data.extracurricular.length ? `
            <div class="section">
              <div class="section-title">Extracurricular Activities</div>
              <div class="section-content">
                ${data.extracurricular.map(activity => `<div class="item"><div class="item-title">• ${activity}</div></div>`).join('')}
              </div>
            </div>
            ` : ''}

            ${data.references.length ? `
            <div class="section">
              <div class="section-title">References</div>
              <div class="section-content">
                ${data.references.map(ref => `
                <div class="item">
                  <div class="item-title">${ref.name}</div>
                  ${ref.contact ? `<div class="item-detail">${ref.contact}</div>` : ''}
                </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>

          <div class="sidebar">
            ${data.skills.length ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-container">
                ${data.skills.map(skill => `<div class="skill-badge">${skill}</div>`).join('')}
              </div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Contact</div>
              <div class="item" style="font-size:12px">
                <div><strong>Email:</strong> ${data.email}</div>
                ${data.phone ? `<div style="margin-top:6px"><strong>Phone:</strong> ${data.phone}</div>` : ''}
                ${data.location ? `<div style="margin-top:6px"><strong>Location:</strong> ${data.location}</div>` : ''}
              </div>
            </div>

            ${data.citizenship ? `
            <div class="section">
              <div class="section-title">Additional</div>
              <div class="item" style="font-size:12px">
                <div><strong>Citizenship:</strong> ${data.citizenship}</div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

// TEMPLATE 2: CREATIVE MINIMAL - Modern, clean, spacious
function generateCreativeMinimal(data) {
  const profilePicHtml = data.profilePicture ? `<img src="${data.profilePicture}" alt="profile"/>` : '';
  
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${data.color}; }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{font-family:'Roboto','Segoe UI','Helvetica',sans-serif;color:#2d3748;background:#fafbfc}
        .container{max-width:900px;margin:40px auto;padding:0}
        .header{background:#fff;padding:50px 40px;display:grid;grid-template-columns:auto 1fr auto;gap:40px;align-items:start}
        .photo{width:110px;height:110px;border-radius:12px;overflow:hidden;flex-shrink:0}
        .photo img{width:100%;height:100%;object-fit:cover}
        .header-content h1{font-size:36px;font-weight:300;color:#1a202c;margin:0 0 8px 0;letter-spacing:-1px}
        .header-content p{color:var(--accent);font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:2px;margin:0}
        .header-contact{text-align:right;font-size:12px;line-height:1.8;color:#718096}
        
        .body{padding:40px;background:#fff;margin-top:1px}
        .summary{margin:0 0 40px 0;font-size:15px;color:#4a5568;line-height:1.8;max-width:80%;font-weight:300}
        
        .sections{display:grid;grid-template-columns:1fr 280px;gap:40px}
        
        .section{margin:0 0 35px 0}
        .section-title{font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);margin:0 0 20px 0;letter-spacing:2px}
        
        .item{margin-bottom:20px;font-size:13px}
        .item-title{font-weight:600;color:#2d3748;margin-bottom:4px}
        .item-detail{color:#718096;font-size:12px}
        
        .skills-container{display:flex;flex-wrap:wrap;gap:10px}
        .skill{padding:8px 14px;background:#edf2f7;color:var(--accent);border-radius:6px;font-size:12px;font-weight:500}
        
        .sidebar{padding:30px;background:#f7fafc;border-radius:8px}
        .sidebar .section-title{color:var(--accent)}
        
        @media (max-width:800px){.header{grid-template-columns:1fr}.sections{grid-template-columns:1fr}.header-contact{text-align:left}}
      </style>
    </head>
    <body>
      <div class="header">
        ${profilePicHtml ? `<div class="photo">${profilePicHtml}</div>` : ''}
        <div class="header-content">
          <h1>${data.name}</h1>
          <p>Resume</p>
        </div>
        <div class="header-contact">
          <div>${data.email}</div>
          ${data.phone ? `<div>${data.phone}</div>` : ''}
          ${data.location ? `<div>${data.location}</div>` : ''}
        </div>
      </div>

      <div class="body">
        ${data.bio ? `<div class="summary">${data.bio}</div>` : ''}

        <div class="sections">
          <div>
            ${data.experience.length ? `
            <div class="section">
              <div class="section-title">Experience</div>
              ${data.experience.map(exp => `<div class="item"><div class="item-title">${exp}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.education.length ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${data.education.map(edu => `<div class="item"><div class="item-title">${edu}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.extracurricular.length ? `
            <div class="section">
              <div class="section-title">Extracurricular Activities</div>
              ${data.extracurricular.map(activity => `<div class="item"><div class="item-title">• ${activity}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.references.length ? `
            <div class="section">
              <div class="section-title">References</div>
              ${data.references.map(ref => `
              <div class="item">
                <div class="item-title">${ref.name}</div>
                ${ref.contact ? `<div class="item-detail">${ref.contact}</div>` : ''}
              </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="sidebar">
            ${data.skills.length ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-container">
                ${data.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            ${data.citizenship || data.location ? `
            <div class="section">
              <div class="section-title">Information</div>
              <div class="item" style="font-size:12px">
                ${data.citizenship ? `<div><strong>Citizenship:</strong> ${data.citizenship}</div>` : ''}
                ${data.location ? `<div style="margin-top:8px"><strong>Location:</strong> ${data.location}</div>` : ''}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

// TEMPLATE 3: MODERN TECH - Contemporary, tech-focused, with visual indicators
function generateModernTech(data) {
  const profilePicHtml = data.profilePicture ? `<img src="${data.profilePicture}" alt="profile"/>` : '';
  
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${data.color}; }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{font-family:'Inter','Segoe UI','Roboto',sans-serif;color:#1f2937;background:#ffffff}
        .container{max-width:880px;margin:35px auto;padding:0}
        
        .header{background:linear-gradient(135deg, var(--accent) 0%, ${adjustColor(data.color, 20)} 100%);color:#fff;padding:45px;border-radius:12px 12px 0 0;display:flex;gap:30px;align-items:center}
        .photo{width:120px;height:120px;border-radius:8px;overflow:hidden;flex-shrink:0;border:4px solid rgba(255,255,255,0.3)}
        .photo img{width:100%;height:100%;object-fit:cover}
        .header-content h1{font-size:34px;font-weight:700;margin:0 0 6px 0}
        .header-content p{font-size:13px;opacity:0.95;letter-spacing:1px}
        .header-contact{margin-left:auto;text-align:right;font-size:12px;opacity:0.9;line-height:1.8}
        
        .body{padding:45px;background:#fff;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
        .summary{margin:0 0 40px 0;font-size:14px;color:#4b5563;line-height:1.8;padding:0}
        
        .sections{display:grid;grid-template-columns:1fr 300px;gap:45px}
        
        .section{margin:0 0 40px 0}
        .section-title{font-size:12px;font-weight:700;color:#fff;background:var(--accent);padding:8px 12px;margin:0 0 18px 0;border-radius:4px;letter-spacing:1px;text-transform:uppercase;display:inline-block}
        
        .item{margin-bottom:18px;font-size:13px;border-left:3px solid transparent;padding-left:12px;transition:all 0.2s}
        .item:hover{border-left-color:var(--accent)}
        .item-title{font-weight:700;color:#1a202c;margin-bottom:3px}
        .item-detail{color:#6b7280;font-size:12px}
        
        .skills-container{display:flex;flex-wrap:wrap;gap:8px}
        .skill-tag{padding:6px 12px;background:var(--accent);color:#fff;border-radius:20px;font-size:12px;font-weight:600}
        
        .sidebar{background:#f3f4f6;padding:28px;border-radius:8px}
        .sidebar .section-title{background:var(--accent);color:#fff}
        
        @media (max-width:800px){.header{flex-direction:column;text-align:center}.header-contact{text-align:center;margin-left:0}.sections{grid-template-columns:1fr}.header{border-radius:12px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${profilePicHtml ? `<div class="photo">${profilePicHtml}</div>` : ''}
          <div class="header-content">
            <h1>${data.name}</h1>
            <p>DEVELOPER RESUME</p>
          </div>
          <div class="header-contact">
            <div>${data.email}</div>
            ${data.phone ? `<div>${data.phone}</div>` : ''}
            ${data.location ? `<div>${data.location}</div>` : ''}
          </div>
        </div>

        <div class="body">
          ${data.bio ? `<div class="summary">${data.bio}</div>` : ''}

          <div class="sections">
            <div>
              ${data.experience.length ? `
              <div class="section">
                <div class="section-title">💼 Experience</div>
                ${data.experience.map(exp => `<div class="item"><div class="item-title">${exp}</div></div>`).join('')}
              </div>
              ` : ''}

              ${data.education.length ? `
              <div class="section">
                <div class="section-title">🎓 Education</div>
                ${data.education.map(edu => `<div class="item"><div class="item-title">${edu}</div></div>`).join('')}
              </div>
              ` : ''}

              ${data.extracurricular.length ? `
              <div class="section">
                <div class="section-title">🎯 Extracurricular</div>
                ${data.extracurricular.map(activity => `<div class="item"><div class="item-title">• ${activity}</div></div>`).join('')}
              </div>
              ` : ''}

              ${data.references.length ? `
              <div class="section">
                <div class="section-title">👥 References</div>
                ${data.references.map(ref => `
                <div class="item">
                  <div class="item-title">${ref.name}</div>
                  ${ref.contact ? `<div class="item-detail">${ref.contact}</div>` : ''}
                </div>
                `).join('')}
              </div>
              ` : ''}
            </div>

            <div class="sidebar">
              ${data.skills.length ? `
              <div class="section">
                <div class="section-title">⚡ Skills</div>
                <div class="skills-container">
                  ${data.skills.map(skill => `<div class="skill-tag">${skill}</div>`).join('')}
                </div>
              </div>
              ` : ''}

              <div class="section">
                <div class="section-title">📋 Profile</div>
                <div style="font-size:12px;color:#4b5563;line-height:1.8">
                  ${data.email ? `<div><strong>Email:</strong><br/>${data.email}</div>` : ''}
                  ${data.phone ? `<div style="margin-top:10px"><strong>Phone:</strong><br/>${data.phone}</div>` : ''}
                  ${data.location ? `<div style="margin-top:10px"><strong>Location:</strong><br/>${data.location}</div>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

// Helper function to adjust color brightness
function adjustColor(color, percent) {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);
  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);
  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;
  let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
  return "#"+RR+GG+BB;
}

// TEMPLATE 4: EXECUTIVE PREMIUM - Sophisticated, leadership-focused
function generateExecutivePremium(data) {
  const profilePicHtml = data.profilePicture ? `<img src="${data.profilePicture}" alt="profile"/>` : '';
  
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${data.color}; }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{font-family:'Garamond','Georgia','Times New Roman',serif;color:#3a3a3a;background:#f9f8f6;line-height:1.7}
        .container{max-width:920px;margin:50px auto;padding:60px;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,0.1)}
        
        .masthead{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid var(--accent);padding-bottom:40px;margin-bottom:40px}
        .masthead-content h1{font-size:38px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;letter-spacing:-0.5px}
        .masthead-content p{font-size:12px;text-transform:uppercase;letter-spacing:3px;color:var(--accent);font-weight:600;margin:0}
        .masthead-photo{width:130px;height:130px;border-radius:4px;overflow:hidden;flex-shrink:0;border:2px solid var(--accent)}
        .masthead-photo img{width:100%;height:100%;object-fit:cover}
        
        .two-tier{display:grid;grid-template-columns:1fr 320px;gap:50px;margin-top:40px}
        
        .section{margin:0 0 45px 0}
        .section-title{font-size:11px;font-weight:900;text-transform:uppercase;color:var(--accent);margin:0 0 20px 0;letter-spacing:3px;padding-bottom:12px;border-bottom:1px solid var(--accent)}
        
        .item{margin-bottom:22px;font-size:13px}
        .item-title{font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:5px}
        .item-meta{font-size:12px;color:var(--accent);font-style:italic;margin-bottom:4px}
        .item-detail{font-size:12px;color:#666;line-height:1.6}
        
        .summary{font-style:italic;color:#555;font-size:13px;line-height:1.8;margin:0 0 40px 0}
        
        .skill-list{display:flex;flex-wrap:wrap;gap:12px}
        .skill-item{padding:6px 14px;background:var(--accent);color:#fff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-radius:2px}
        
        .sidebar{background:#fafaf8;padding:35px;border:1px solid #e0e0e0}
        .sidebar .section-title{color:var(--accent);border-bottom:1px solid var(--accent)}
        
        @media (max-width:800px){.two-tier{grid-template-columns:1fr}.masthead{flex-direction:column}.masthead-photo{margin-top:20px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="masthead">
          <div class="masthead-content">
            <h1>${data.name}</h1>
            <p>Executive Profile</p>
          </div>
          ${profilePicHtml ? `<div class="masthead-photo">${profilePicHtml}</div>` : ''}
        </div>

        ${data.bio ? `<div class="summary">${data.bio}</div>` : ''}

        <div class="two-tier">
          <div>
            ${data.experience.length ? `
            <div class="section">
              <div class="section-title">Professional Experience</div>
              ${data.experience.map(exp => `<div class="item"><div class="item-title">${exp}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.education.length ? `
            <div class="section">
              <div class="section-title">Education & Credentials</div>
              ${data.education.map(edu => `<div class="item"><div class="item-title">${edu}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.extracurricular.length ? `
            <div class="section">
              <div class="section-title">Extracurricular Activities</div>
              ${data.extracurricular.map(activity => `<div class="item"><div class="item-title">• ${activity}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.references.length ? `
            <div class="section">
              <div class="section-title">References</div>
              ${data.references.map(ref => `
              <div class="item">
                <div class="item-title">${ref.name}</div>
                ${ref.contact ? `<div class="item-detail">${ref.contact}</div>` : ''}
              </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="sidebar">
            ${data.skills.length ? `
            <div class="section">
              <div class="section-title">Expertise</div>
              <div class="skill-list">
                ${data.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
              </div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Contact Information</div>
              <div style="font-size:12px;color:#555;line-height:1.9">
                <div><strong>Email</strong></div>
                <div>${data.email}</div>
                ${data.phone ? `<div style="margin-top:12px"><strong>Phone</strong></div><div>${data.phone}</div>` : ''}
                ${data.location ? `<div style="margin-top:12px"><strong>Location</strong></div><div>${data.location}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

// TEMPLATE 5: ACADEMIC SCHOLAR - Publication-focused, research-oriented
function generateAcademicScholar(data) {
  const profilePicHtml = data.profilePicture ? `<img src="${data.profilePicture}" alt="profile"/>` : '';
  
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${data.color}; }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{font-family:'Cambria','Garamond','Times New Roman',serif;color:#333;background:#fff;line-height:1.8}
        .container{max-width:900px;margin:40px auto;padding:45px}
        
        .title-section{margin-bottom:35px;border-bottom:2px solid var(--accent);padding-bottom:20px}
        .name{font-size:32px;font-weight:700;color:#000;margin:0 0 4px 0}
        .tagline{font-size:12px;text-transform:uppercase;color:var(--accent);letter-spacing:2px;font-weight:600}
        
        .contact-bar{margin-top:15px;font-size:11px;color:#666}
        .contact-bar span{margin-right:20px}
        
        .summary-box{background:#f5f5f5;padding:18px;margin:30px 0;border-left:4px solid var(--accent);font-size:13px;color:#444;line-height:1.8;font-style:italic}
        
        .main-content{display:grid;grid-template-columns:1fr 320px;gap:40px}
        
        .section{margin:0 0 35px 0}
        .section-title{font-size:13px;font-weight:700;color:var(--accent);text-transform:uppercase;margin:0 0 16px 0;letter-spacing:1.5px;padding-bottom:8px;border-bottom:1px solid #ddd}
        
        .item{margin-bottom:16px;font-size:12.5px}
        .item-title{font-weight:700;color:#222;margin-bottom:4px}
        .item-meta{color:var(--accent);font-size:11px;font-weight:600;margin-bottom:3px}
        .item-text{color:#666;font-size:12px}
        
        .skills-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .skill{padding:6px 10px;background:var(--accent);color:#fff;border-radius:3px;font-size:11px;font-weight:600;text-align:center}
        
        .sidebar{background:#fafafa;padding:25px;border:1px solid #e0e0e0}
        .sidebar .section-title{color:var(--accent)}
        
        @media (max-width:800px){.main-content{grid-template-columns:1fr}.skills-grid{grid-template-columns:1fr}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title-section">
          <div class="name">${data.name}</div>
          <div class="tagline">Academic Resume</div>
          <div class="contact-bar">
            <span>${data.email}</span>
            ${data.phone ? `<span>${data.phone}</span>` : ''}
            ${data.location ? `<span>${data.location}</span>` : ''}
          </div>
        </div>

        ${data.bio ? `<div class="summary-box">${data.bio}</div>` : ''}

        <div class="main-content">
          <div>
            ${data.experience.length ? `
            <div class="section">
              <div class="section-title">Research & Experience</div>
              ${data.experience.map(exp => `<div class="item"><div class="item-title">▸ ${exp}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.education.length ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${data.education.map(edu => `<div class="item"><div class="item-title">▪ ${edu}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.extracurricular.length ? `
            <div class="section">
              <div class="section-title">Extracurricular Activities</div>
              ${data.extracurricular.map(activity => `<div class="item"><div class="item-title">▸ ${activity}</div></div>`).join('')}
            </div>
            ` : ''}

            ${data.references.length ? `
            <div class="section">
              <div class="section-title">References</div>
              ${data.references.map(ref => `
              <div class="item">
                <div class="item-title">▪ ${ref.name}</div>
                ${ref.contact ? `<div class="item-detail">${ref.contact}</div>` : ''}
              </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="sidebar">
            ${data.skills.length ? `
            <div class="section">
              <div class="section-title">Research Areas</div>
              <div class="skills-grid">
                ${data.skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
              </div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Contact</div>
              <div style="font-size:11px;color:#666;line-height:1.8">
                <div>${data.email}</div>
                ${data.phone ? `<div style="margin-top:8px">${data.phone}</div>` : ''}
                ${data.location ? `<div style="margin-top:8px">${data.location}</div>` : ''}
                ${data.citizenship ? `<div style="margin-top:12px"><strong>Citizenship:</strong> ${data.citizenship}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

// TEMPLATE 6: CREATIVE VIBRANT - Colorful, design-focused, portfolio-style
function generateCreativeVibrant(data) {
  const profilePicHtml = data.profilePicture ? `<img src="${data.profilePicture}" alt="profile"/>` : '';
  const accentLight = adjustColor(data.color, 40);
  
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${data.color}; --accent-light: ${accentLight}; }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{font-family:'Inter','Segoe UI','Roboto',sans-serif;color:#2d3748;background:linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)}
        .container{max-width:900px;margin:30px auto;padding:0}
        
        .header{background:linear-gradient(120deg, var(--accent) 0%, ${adjustColor(data.color, 15)} 100%);color:#fff;padding:50px;border-radius:16px 16px 0 0;display:flex;gap:35px;align-items:center}
        .photo{width:130px;height:130px;border-radius:16px;overflow:hidden;flex-shrink:0;border:5px solid rgba(255,255,255,0.3)}
        .photo img{width:100%;height:100%;object-fit:cover}
        .header-text h1{font-size:36px;font-weight:800;margin:0 0 6px 0;letter-spacing:-1px}
        .header-text p{font-size:13px;opacity:0.9;letter-spacing:1px;text-transform:uppercase;font-weight:600}
        .header-contact{margin-left:auto;text-align:right;font-size:12px;opacity:0.95;line-height:2}
        
        .body{background:#fff;padding:50px;border-radius:0 0 16px 16px}
        .summary{font-size:14px;color:#4a5568;line-height:1.8;margin:0 0 45px 0;font-weight:300}
        
        .content-grid{display:grid;grid-template-columns:1fr 300px;gap:50px}
        
        .section{margin:0 0 45px 0}
        .section-title{display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;color:#fff;background:var(--accent);padding:8px 16px;margin:0 0 22px 0;letter-spacing:1.5px;border-radius:6px}
        
        .item{margin-bottom:20px;padding-left:16px;border-left:4px solid var(--accent-light)}
        .item-title{font-weight:700;color:#1a202c;margin-bottom:4px;font-size:13px}
        .item-detail{font-size:12px;color:#718096}
        
        .skills-wrap{display:flex;flex-wrap:wrap;gap:10px}
        .skill-chip{padding:8px 16px;background:var(--accent);color:#fff;border-radius:20px;font-size:12px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        
        .sidebar{background:linear-gradient(135deg, var(--accent-light) 0%, rgba(255,255,255,0.5) 100%);padding:32px;border-radius:12px}
        .sidebar .section-title{background:var(--accent);color:#fff}
        
        .info-box{background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid var(--accent-light)}
        .info-label{font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
        .info-value{font-size:12px;color:#2d3748}
        
        @media (max-width:800px){.header{flex-direction:column;text-align:center}.header-contact{text-align:center;margin-left:0}.content-grid{grid-template-columns:1fr}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${profilePicHtml ? `<div class="photo">${profilePicHtml}</div>` : ''}
          <div class="header-text">
            <h1>${data.name}</h1>
            <p>Creative Professional</p>
          </div>
          <div class="header-contact">
            <div>${data.email}</div>
            ${data.phone ? `<div>${data.phone}</div>` : ''}
            ${data.location ? `<div>${data.location}</div>` : ''}
          </div>
        </div>

        <div class="body">
          ${data.bio ? `<div class="summary">${data.bio}</div>` : ''}

          <div class="content-grid">
            <div>
              ${data.experience.length ? `
              <div class="section">
                <div class="section-title">🎨 Experience</div>
                ${data.experience.map(exp => `<div class="item"><div class="item-title">${exp}</div></div>`).join('')}
              </div>
              ` : ''}

              ${data.education.length ? `
              <div class="section">
                <div class="section-title">📚 Education</div>
                ${data.education.map(edu => `<div class="item"><div class="item-title">${edu}</div></div>`).join('')}
              </div>
              ` : ''}

              ${data.extracurricular.length ? `
              <div class="section">
                <div class="section-title">🎯 Extracurricular</div>
                ${data.extracurricular.map(activity => `<div class="item"><div class="item-title">• ${activity}</div></div>`).join('')}
              </div>
              ` : ''}

              ${data.references.length ? `
              <div class="section">
                <div class="section-title">👥 References</div>
                ${data.references.map(ref => `
                <div class="item">
                  <div class="item-title">${ref.name}</div>
                  ${ref.contact ? `<div class="item-detail">${ref.contact}</div>` : ''}
                </div>
                `).join('')}
              </div>
              ` : ''}
            </div>

            <div class="sidebar">
              ${data.skills.length ? `
              <div class="section">
                <div class="section-title">⭐ Skills</div>
                <div class="skills-wrap">
                  ${data.skills.map(skill => `<div class="skill-chip">${skill}</div>`).join('')}
                </div>
              </div>
              ` : ''}

              <div class="info-box">
                <div class="info-label">Email</div>
                <div class="info-value">${data.email}</div>
              </div>

              ${data.phone ? `
              <div class="info-box">
                <div class="info-label">Phone</div>
                <div class="info-value">${data.phone}</div>
              </div>
              ` : ''}

              ${data.location ? `
              <div class="info-box">
                <div class="info-label">Location</div>
                <div class="info-value">${data.location}</div>
              </div>
              ` : ''}

              ${data.citizenship ? `
              <div class="info-box">
                <div class="info-label">Citizenship</div>
                <div class="info-value">${data.citizenship}</div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}