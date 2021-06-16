const nodemailer = require("nodemailer");
require("dotenv").config();

const HttpError = require("../models/http-error");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    type: "OAuth2",
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

exports.feedback = async (req, res, next) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return next(new HttpError("email dan pesan harus diisi", 422));
  }
  const mailOptions = {
    from: "suaraunhas@gmail.com",
    to: "suaraunhas@gmail.com",
    subject: "Feeback Suara Unhas",
    html: `
    <h2>Feedaback dari ${email}</h2>
    <p>pesan ${message}</p>    
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    res.status(200).json({
      message: `Feedback kamu berhasil dikirim.`,
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Tidak bisa feedback, coba lagi nanti.", 500));
  }
};
