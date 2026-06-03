import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

 
export const sendVerificationEmail = async (to, code) => {
 await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${code}`,
})
console.log(code)
return code;
};

export const sendForgotPasswordEmail = async (to, code) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'Your Password Reset Code',
        text: `Your password reset code is: ${code}`,
    });
    return code;
};

export const sendApplicantStatusEmail = async (to, status, jobTitle, employerName) => {
    const statusText = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : status;
    const subject = `Your application was ${statusText}`;
    const html = `
      <p>Hi there,</p>
      <p>Your application for <strong>${jobTitle}</strong> has been <strong>${statusText}</strong>.</p>
      ${employerName ? `<p>Employer: <strong>${employerName}</strong></p>` : ''}
      <p>Open Applica to see the latest status and next steps.</p>
      <p>Thank you for using Applica.</p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
    return true;
};

export const sendLoginNotificationEmail = async (to, deviceInfo, attemptedLocation) => {
    const subject = 'New login attempt detected';
    const html = `
      <p>Hi there,</p>
      <p>We detected a login attempt to your Applica account.</p>
            <p><strong>Attempted device:</strong> ${deviceInfo || 'Unknown device'}</p>
            ${attemptedLocation ? `<p><strong>Attempted location:</strong> ${attemptedLocation}</p>` : ''}
      <p>If this was not you, please secure your account immediately.</p>
      <p>Thank you,<br/>Applica Security Team</p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
    return true;
};

export default {sendVerificationEmail, sendForgotPasswordEmail, sendApplicantStatusEmail, sendLoginNotificationEmail};