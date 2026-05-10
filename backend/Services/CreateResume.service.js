import puppeteer from "puppeteer";

export const createResumeService = async (resumeData) => {
  const { name, email, phone, education, experience, skills } = resumeData;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(`
      <html>
        <head>