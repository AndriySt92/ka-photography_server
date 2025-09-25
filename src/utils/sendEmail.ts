import transporter from "../config/email";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: "Запит на бронювання фотосесії",
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error sending email:", error);
    }
    return false;
  }
};

export default sendEmail;
