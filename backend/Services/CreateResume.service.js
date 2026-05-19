import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import User from "../Model/UserSchema.js";

export const createResumeService = async (userId, resumeData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const firstName = user.firstName || "";
  const middleName = user.middleName || "";
  const lastName = user.lastName || "";

  const name = `${firstName} ${middleName} ${lastName}`
    .replace(/\s+/g, " ")
    .trim() || "User";

  const email = user.email || "no-email";

  const {
    phone = "",
    education = [],
    experience = [],
    skills = [],
    template = 'classic-professional',
    color = '#1e40af',
  } = resumeData;

  // fallbacks for experience/education if strings are stored in profile
  const educationItems = Array.isArray(education) && education.length ? education : (typeof education === 'string' && education.length ? education.split('\n') : []);
  const experienceItems = Array.isArray(experience) && experience.length ? experience : (typeof experience === 'string' && experience.length ? experience.split('\n') : []);
  const skillItems = Array.isArray(skills) ? skills : (typeof skills === 'string' && skills.length ? skills.split(',').map(s=>s.trim()) : []);

  const accent = color || '#1e40af';

  const profilePicHtml = user.profilePicture ? `<div class="photo"><img src="${user.profilePicture}" alt="profile"/></div>` : '';

  const htmlContent = `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { --accent: ${accent}; }
        html,body{margin:0;padding:0;font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111827}
        .container{max-width:900px;margin:24px auto;padding:28px;border-radius:8px;box-shadow:0 4px 18px rgba(16,24,40,0.06);background:#fff}
        .header{display:flex;align-items:center;gap:20px}
        .name{font-size:28px;font-weight:700;margin:0}
        .title{color:var(--accent);font-weight:600;margin-top:6px}
        .contact{margin-left:auto;text-align:right;font-size:13px;color:#374151}
        .photo img{width:96px;height:96px;border-radius:8px;object-fit:cover;border:3px solid rgba(0,0,0,0.06)}

        .summary{margin-top:18px;padding:14px 16px;background:#f8fafc;border-left:4px solid var(--accent);border-radius:6px;color:#374151}

        .columns{display:grid;grid-template-columns:1fr 340px;gap:20px;margin-top:20px}

        .section{margin-bottom:18px}
        .section h3{margin:0 0 8px 0;font-size:15px;color:#0f172a}
        .item{margin-bottom:10px}
        .muted{color:#6b7280;font-size:13px}

        .skill-pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#f1f5f9;margin:6px 6px 0 0;font-size:13px;color:#0f172a}

        .right-card{background:#f8fafc;padding:14px;border-radius:8px}
        .location{font-size:13px;color:#374151}

        @media (max-width:800px){
          .columns{grid-template-columns:1fr}
          .contact{text-align:left;margin-left:0}
          .header{flex-direction:column;align-items:flex-start}
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 class="name">${name}</h1>
            <div class="title">${user.role === 'jobseeker' ? 'Job Seeker' : ''}</div>
          </div>
          ${profilePicHtml}
          <div class="contact">
            <div>${email}</div>
            <div>${phone || ''}</div>
            <div class="muted">${user.phoneNumber || ''}</div>
            <div class="muted">${user.email || ''}</div>
          </div>
        </div>

        ${user.bio ? `<div class="summary">${user.bio}</div>` : ''}

        <div class="columns">
          <div>
            <div class="section">
              <h3>Experience</h3>
              ${experienceItems.length ? experienceItems.map(exp => `<div class="item">${exp}</div>`).join('') : '<div class="muted">No experience details provided</div>'}
            </div>

            <div class="section">
              <h3>Education</h3>
              ${educationItems.length ? educationItems.map(ed => `<div class="item">${ed}</div>`).join('') : '<div class="muted">No education provided</div>'}
            </div>

            <div class="section">
              <h3>Additional</h3>
              <div class="muted">Citizenship: ${user.citizenShip || 'Not specified'}</div>
              <div class="muted">Location: ${user.location?.region || ''}${user.location?.city ? ', ' + user.location.city : ''}${user.location?.barangay ? ', ' + user.location.barangay : ''}${user.location?.otherDetails ? ', ' + user.location.otherDetails : ''}</div>
            </div>
          </div>

          <div>
            <div class="right-card">
              <div class="section">
                <h3>Skills</h3>
                ${skillItems.length ? skillItems.map(s => `<span class="skill-pill">${s}</span>`).join('') : '<div class="muted">No skills provided</div>'}
              </div>

              <div class="section">
                <h3>Contact</h3>
                <div class="muted">Email: ${user.email || ''}</div>
                <div class="muted">Phone: ${user.phoneNumber || phone || ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

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