const express = require('express')
const mongoose = require('mongoose')

const app = express()

app.use('/', (req, res, next) => {
  res.status(200).json({ message: "bisami ini, test success " });
})

const url = 'mongodb://127.0.0.1:27017/unhasta';
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true}
  //  `mongodb+srv://${process.env.MONGGODB_USER_PASSWORD}@cluster0.enucz.mongodb.net/genbi?retryWrites=true&w=majority`
  )
  .then((result) => {
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => console.log(err));