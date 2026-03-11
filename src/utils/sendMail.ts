import nodemailer from "nodemailer";

export async function sendMail(emailTo: string, emailSubject: string, emailText: string) {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
      console.error("Missing ENV variables");
      throw new Error("Missing ENV variables");
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: emailTo,
      subject: emailSubject,
      html: emailText,
    };

    const response = await transporter.sendMail(mailOptions);
    // console.log("Response", response);

    return response.messageId;
  } catch (error) {
    console.log("MailErr:", error);
  }
}
