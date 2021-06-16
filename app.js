const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/user-route");
const blogRoutes = require("./routes/blog");
const otherRoutes = require("./routes/other");
const HttpError = require("./models/http-error");

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

app.use(cors("*"));

app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use("/uploads/users", express.static(path.join("uploads", "users")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // semua url disinkan
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  next();
});

app.use("/api", userRoutes);
app.use("/api", blogRoutes);
app.use("/api", otherRoutes);

//midleware sebagai defaul jika route tidak ditemukan
app.use((req, res, next) => {
  const error = new HttpError("Route Tidak ditemukan", 404);
  throw error;
});

//midleware jika ada error yang dikirim dari model httperror
app.use((error, req, res, next) => {
  res
    .status(error.code || 500)
    .json({ message: error.message || "error tidak diketahui" });
});

const url = "mongodb://127.0.0.1:27017/unhasta";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  })
  .then((result) => {
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => console.log(err));
