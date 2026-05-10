import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const createResumeService = async (resumeData) => {
  const {
    name,
    email,
    phone,
    education = [],
    experience = [],
    skills = [],
  } = resumeData;

  const htmlContent = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
        }

        h1 {
          color: #111827;
          margin-bottom: 5px;
        }

        h2 {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
          margin-top: 30px;
          color: #374151;
        }

        p {
          margin: 5px 0;
          line-height: 1.5;
        }

        .section {
          margin-bottom: 20px;
        }

        .skills {
          list-style: none;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .skills li {
          background: #f3f4f6;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
        }
      </style>
    </head>

    <body>
      <h1>${name}</h1>
      <p>${email}</p>
      <p>${phone}</p>

      <div class="section">
        <h2>Education</h2>

        ${education
          .map(
            (edu) => `
          <p>
            <strong>${edu.degree}</strong> -
            ${edu.institution} (${edu.year})
          </p>
        `
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Experience</h2>

        ${experience
          .map(
            (exp) => `
          <p>
            <strong>${exp.position}</strong> -
            ${exp.company} (${exp.years})
          </p>

          <p>${exp.description}</p>
        `
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Skills</h2>

        <ul class="skills">
          ${skills.map((skill) => `<li>${skill}</li>`).join("")}
        </ul>
      </div>
    </body>
  </html>
  `;

 
  const resumesDir = path.join(process.cwd(), "resumes");

  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir);
  }


  const fileName = `${name.replace(/\s+/g, "_")}_resume.pdf`;
  const filePath = path.join(resumesDir, fileName);


  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
  });

  
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });


  fs.writeFileSync(filePath, pdfBuffer);

  await browser.close();

  return {
    fileName,
    filePath,
    pdfBuffer,
  };
};