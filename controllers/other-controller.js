const e = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const HttpError = require("../models/http-error");
const Newsletter = require("../models/newsletter");

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

exports.subNewsletter = async (req, res, next) => {
  let { name, email } = req.body;
  if (!name || !email) {
    return next(new HttpError("Nama atau email wajib disis", 422));
  }

  email = email.toLowerCase();
  let subsicriber;
  try {
    subsicriber = await Newsletter.findOne({ email });
  } catch (error) {
    return next(new HttpError("Tidak bisa berlanggan nensletter", 500));
  }

  if (subsicriber) {
    return next(new HttpError("Kamu sudah berlanggan newsletter ini", 422));
  }

  const newSubscr = new Newsletter({
    email,
    name,
  });

  try {
    const saveSubscr = await newSubscr.save();
    res.status(201).send({ message: "Kamu berhasil berlanggan newsletter" });
  } catch (error) {
    return next(new HttpError("Sedang tidak bisa berlanggan nwsletter", 500));
  }
};
