import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use Gmail App Password (not your main password)
    },
});

export const sendPasswordResetEmail = async (toEmail: string, token: string): Promise<void> => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password?token=${token}`;

    const mailOptions = {
        from: `"CampusBite 🍔" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '🔐 Reset Your CampusBite Password',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
                body { margin: 0; padding: 0; background-color: #0D0C0B; font-family: 'Inter', Arial, sans-serif; }
                .container { max-width: 560px; margin: 40px auto; background: #1A1916; border-radius: 20px; overflow: hidden; border: 1px solid #2A2825; }
                .header { background: linear-gradient(135deg, #0070FF, #1d4ed8); padding: 40px 40px 32px; text-align: center; }
                .logo { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 16px; font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -2px; margin-bottom: 16px; }
                .header h1 { color: #fff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.04em; }
                .header p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 6px 0 0; }
                .body { padding: 36px 40px; }
                .body p { color: #A09890; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
                .token-box { background: #0D0C0B; border: 1.5px solid #2A2825; border-radius: 12px; padding: 18px 20px; margin: 20px 0; font-family: monospace; font-size: 14px; color: #F0EDEA; word-break: break-all; letter-spacing: 0.02em; }
                .btn { display: block; text-align: center; background: #0070FF; color: #fff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 16px 32px; border-radius: 12px; margin: 24px 0; letter-spacing: 0.04em; text-transform: uppercase; }
                .note { font-size: 13px !important; color: #6B6460 !important; }
                .footer { text-align: center; padding: 20px 40px 28px; border-top: 1px solid #2A2825; }
                .footer p { color: #6B6460; font-size: 12px; margin: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CB</div>
                    <h1>Reset Your Password</h1>
                    <p>CampusBite — Campus Food Ordering</p>
                </div>
                <div class="body">
                    <p>Hey there 👋,</p>
                    <p>We received a request to reset your CampusBite account password. Use the token below on the reset page, or click the button to go directly.</p>
                    
                    <p style="color:#F0EDEA; font-weight:600; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">Your Reset Token</p>
                    <div class="token-box">${token}</div>
                    
                    <a href="${resetLink}" class="btn">Open Reset Page →</a>

                    <p class="note">⏱ This token expires in <strong style="color:#F0EDEA">30 minutes</strong>. If you didn't request this, you can safely ignore this email — your password won't change.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} CampusBite · Bennett University · All rights to your appetite.</p>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendSignupOTPEmail = async (toEmail: string, otp: string): Promise<void> => {
    const mailOptions = {
        from: `"CampusBite 🍔" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '🔐 Verify Your CampusBite Account',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
                body { margin: 0; padding: 0; background-color: #0D0C0B; font-family: 'Inter', Arial, sans-serif; }
                .container { max-width: 560px; margin: 40px auto; background: #1A1916; border-radius: 20px; overflow: hidden; border: 1px solid #2A2825; }
                .header { background: linear-gradient(135deg, #0070FF, #1d4ed8); padding: 40px 40px 32px; text-align: center; }
                .logo { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 16px; font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -2px; margin-bottom: 16px; }
                .header h1 { color: #fff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.04em; }
                .header p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 6px 0 0; }
                .body { padding: 36px 40px; text-align: center; }
                .body p { color: #A09890; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
                .otp-code { display: inline-block; background: #0D0C0B; border: 2px solid #0070FF; border-radius: 16px; padding: 24px 40px; margin: 20px 0; font-family: 'JetBrains Mono', monospace; font-size: 42px; font-weight: 800; color: #fff; letter-spacing: 12px; text-shadow: 0 0 20px rgba(0,112,255,0.3); }
                .note { font-size: 13px !important; color: #6B6460 !important; }
                .footer { text-align: center; padding: 20px 40px 28px; border-top: 1px solid #2A2825; }
                .footer p { color: #6B6460; font-size: 12px; margin: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CB</div>
                    <h1>Verify Your Email</h1>
                    <p>CampusBite — Campus Food Ordering</p>
                </div>
                <div class="body">
                    <p>Welcome to the campus food revolution! 🍔</p>
                    <p>To complete your registration and start ordering, please use the 6-digit verification code below:</p>
                    
                    <div class="otp-code">${otp}</div>
                    
                    <p class="note">This code is valid for <strong style="color:#F0EDEA">10 minutes</strong>. If you didn't create an account, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} CampusBite · Bennett University · Skipped queues await!</p>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    await transporter.sendMail(mailOptions);
};
