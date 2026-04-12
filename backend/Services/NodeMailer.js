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
    })
    return code;
};



export default {sendVerificationEmail, sendForgotPasswordEmail};