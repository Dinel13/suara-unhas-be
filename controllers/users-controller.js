const path = require("path");
const fs = require("fs");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const User = require("../models/user");
const HttpError = require("../models/http-error");

const signup = async (req, res, next) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new HttpError("Semua field harus diisi", 422));
  }

  email = email.toLowerCase();
  const emailToSearch = /\bunhas.ac.id\b/i;

  if (!emailToSearch.test(email)) {
    return next(new HttpError("Harus mengunakan email domain unhas", 422));
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Gagal mendaftar, coba lagi nanti", 500));
  }

  if (existingUser) {
    return next(new HttpError("User sudah ada, silahkan masuk", 422));
  }

  let HasPassword;
  try {
    HasPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Gagal mendaftar, coba lagi nati", 500);
    return next(error);
  }

  const nickName = name.split(" ")[0] || name;
  const publicId =
    email.split("@")[0] + "-" + nickName + "-" + Date.now().toString(36);

  const createuser = new User({
    publicId,
    name,
    email,
    password: HasPassword,
    nickName,
  });

  let result;
  try {
    result = await createuser.save();
  } catch (err) {
    return next(new HttpError("Gagal mendaftar, coba lagi nanti", 500));
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createuser.id,
        email: createuser.email,
        name: createuser.name,
      },
      process.env.JWT_KEY,
      { expiresIn: "10d" }
    );
  } catch (error) {
    return next(new HttpError("Gagal mendaftar, coba lagi nanti", 500));
  }

  res.status(201).json({
    userId: createuser.id,
    publicId: createuser.publicId,
    name: createuser.name,
    nickName: createuser.nickName,
    token: token,
  });
};

const login = async (req, res, next) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return next(new HttpError("Semua field harus diisi", 422));
  }

  email = email.toLowerCase();
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Gagal masuk, coba lagi nanti.", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Email tidak ditemukan, silahkan mendaftar dulu.",
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    console.log(err);
    const error = new HttpError("Tidak bisa masuk, coba lagi nanti.", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Tidak bisa masuk, Pastikan password kamu betul.",
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
      },
      process.env.JWT_KEY,
      { expiresIn: "10d" }
    );
  } catch (err) {
    const error = new HttpError("Tidak bisa masuk, coba lagi nanti.", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    name: existingUser.name,
    token: token,
    publicId: existingUser.publicId,
    nickName: existingUser.nickName,
  });
};

const forgotPassword = async (req, res, next) => {
  let { email } = req.body;

  if (!email) {
    return next(new HttpError("Email field harus diisi", 422));
  }

  console.log(email);
  email = email.toLowerCase();

  let user;
  try {
    user = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError("Gagal menemukan email, coba lagi nanti.", 500);
    return next(error);
  }

  if (!user) {
    return next(
      new HttpError("Email tidak ditemukan, silahkan mendaftar.", 404)
    );
  }

  let token;
  try {
    token = await jwt.sign({ id: user.id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "10h",
    });
  } catch (error) {
    return next(
      new HttpError("Tidak bisa membuat token, coba lagi nanti.", 500)
    );
  }
  // test without email
  // res.status(200).json({ ds: { token } });

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

  const mailOptions = {
    from: "fadullah2021@gmail.com",
    to: email,
    subject: "Suara Unhas || Password reset",
    html: `
    <h2>Hi, ${user.name}</h2>
    <h4>Kamu telah meminta untuk mereset password</h4>
    <p>Klik tombol dibawah untuk membuat password baru.</p>
    <a
      href="http://localhost:3000/reset/${token}"
      style="
        padding: 8px 10px;
        text-decoration: none;
        color: black;
        font-weight: 700;
        background-color: #278a27;
        border-radius: 8px;
      "
    >
      reset password
    </a>
    <p>jika link diatas tidak berfunsi, maka gunakan link dibawah ini</p>

    <a href="http://localhost:3000/reset/${token}"
      >http://localhost:3000/reset/${token}</a
    >
    <br />
    <h4>Terima kasih</h4>
    <p>Team Manut || B21-CAP1099</p>p>
    `,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return next(
        new HttpError("Tidak bisa mengirim email, coba lagi nanti.", 500)
      );
    } else {
      return res.status(201).json({
        message: `Email untuk mereset telah dikirim ke alamat ${email}. Link akan kadarluarsa dalam 10 menit.`,
        // token: token,
      });
    }
  });
};

const resetPassword = async (req, res, next) => {
  const token = req.params.token;
  const { newPassword, newPasswordConf } = req.body;

  if (!token) {
    return next(
      new HttpError("Token tidak tersedia, pastikan link anda betul", 404)
    );
  }

  if (!newPassword || !newPasswordConf) {
    return next(
      new HttpError("Gagal mereset password, pastikan semua field terisi", 422)
    );
  }

  if (newPassword !== newPasswordConf) {
    return next(
      new HttpError("Passoword harus sama dengan konfirmasi password", 422)
    );
  }

  let decodedToken;
  try {
    decodedToken = await jwt.verify(
      token.toString(),
      process.env.JWT_RESET_PASSWORD
    );
  } catch (error) {
    return next(
      new HttpError(
        "Tidak bisa memverifikasi token, token hanya berumur 10 menit setelah digenerate.",
        500
      )
    );
  }

  if (!decodedToken) {
    return next(
      new HttpError(
        "Token sudah expire, token hanya berumur 10 menit setelah digenerate.",
        404
      )
    );
  }

  let user;
  try {
    user = await User.findById(decodedToken.id);
  } catch (error) {
    return next(new HttpError("Tidak bisa menemukan user.", 404));
  }

  let HasPassword;
  try {
    HasPassword = await bcrypt.hash(newPassword, 12);
  } catch (err) {
    return next(
      new HttpError("Gagal mengengrisi password baru, coba lagi nati", 500)
    );
  }

  try {
    user.password = HasPassword;
    userNew = await user.save();
  } catch (error) {
    return next(
      new HttpError(
        "Tidak bisa mengupdate password baru, coba lagi nanti.",
        500
      )
    );
  }
  res.status(201).json({
    message: "berhasil mereset password",
  });
};

const updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { name, nickName, fakultas, bio, motto, alamat, medsos } = req.body;
  let { publicId } = req.body;
  if (!name || !nickName) {
    return next(
      new HttpError(
        "Nama lengkap, nama pangilan dan nama akun wajib diisi",
        422
      )
    );
  }

  publicId = publicId.split(" ")[0];
  if (!publicId) {
    return next(
      new HttpError(
        "Nama akun wajib diisi dan tidak boleh mengandung spasi",
        422
      )
    );
  }

  let exisUser;
  try {
    exisUser = await User.findOne({ publicId });
  } catch (error) {
    return next(new HttpError("Tidak bisa mencari user", 500));
  }
  if (exisUser && exisUser._id.toString() !== req.userData.userId) {
    return next(
      new HttpError("Nama akun sudah digunakan, cari yang lain", 422)
    );
  }

  let upUser;
  try {
    upUser = await User.findById(id);
  } catch (error) {
    return next(new HttpError("Tidak bisa mencari user", 500));
  }

  if (!upUser) {
    return next(new HttpError("Tidak bisa menemukan user", 404));
  }

  if (upUser.id.toString() !== req.userData.userId) {
    return next(new HttpError("Kamu tidak diijinkan untuk mengedit", 401));
  }

  let image;
  //cek if image emty, coming emty or currently emty
  if (!req.file) {
    if (!upUser.image) {
      image = "uploads/users/default.png";
    } else {
      image = upUser.image;
    }
  } else {
    if (upUser.image) {
      filePath = path.join(__dirname, "..", upUser.image);
      fs.unlink(filePath, (err) => console.log(err));
    }

    image = req.file.path;
  }

  upUser.name = name;
  upUser.nickName = nickName;
  upUser.bio = bio;
  upUser.publicId = publicId;
  upUser.image = image;
  upUser.fakultas = fakultas;
  upUser.motto = motto;
  upUser.medsos = medsos;
  upUser.alamat = alamat;

  try {
    await upUser.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError(err.message || "Tidak dapat mengupdate data", 500)
    );
  }

  res.status(200).json({ message: "Berhasil" }); // upUser.toObject({ getters: true })
};

const populer = async (req, res, next) => {
  try {
    const data = await User.find()
      .sort({ blog: -1 })
      .select("name image fakultas publicId blog ")
      .limit(6);
    res.status(200).json({ user: data });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Gagal mendapatkan penulis populer", 500));
  }
};

const getUserData = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await User.findOne({ publicId: id })
      .populate("blog", "_id slug title")
      .select(
        "name nickName publicId motto email fakultas blog bio image alamat medsos"
      )
      .exec();
    res.status(200).json({ user: data });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal mendapatkan data penulis", 500));
  }
};

const getUserbyId = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await User.findById(id)
      .populate("blog", "_id slug title")
      .select(
        "name nickName publicId motto email fakultas blog bio image alamat medsos"
      )
      .exec();
    res.status(200).json({ user: data });
  } catch (error) {
    console.log(error);
    return next(new HttpError("gagal mendapatkan data penulis", 500));
  }
};

// const getAllUserData = async (req, res, next) => {
//   const id = req.params.id;
//   try {
//     const data = await User.findById(id)
//       .select("name nickName publicId fakultas bio image motto alamat medsos ")
//       .exec();
//     res.status(200).json({ user: data });
//   } catch (error) {
//     console.log(error);
//     return next(new HttpError("gagal mendapatkan data penulis", 500));
//   }
// };

exports.login = login;
exports.signup = signup;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.populer = populer;
exports.getUserData = getUserData;
exports.getUserById = getUserbyId;
// exports.getAllUserData = getAllUserData;
exports.updateUser = updateUser;
