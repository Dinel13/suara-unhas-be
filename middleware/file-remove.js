const path = require("path");
const fs = require("fs");

// remove image coming
exports.removeImage = (img) => {
  if (img) {
    const filePath = path.join(__dirname, "..", img.path);
    fs.unlink(filePath, (err) => console.log(err));
  }
};

//remove if current image not default image
exports.removeNotDefaultImage = (img, defaultImg) => {
  if (img !== defaultImg) {
    const filePath = path.join(__dirname, "..", img);
    fs.unlink(filePath, (err) => console.log(err));
  }
};

//fn to check if image is defult or need to replace by img coming
exports.checkRemoveImage = (imgNow, imgComing, defaultImg) => {
  let image;
  if (!imgComing) {
    image = imgNow;
  } else {
    if (imgNow !== defaultImg) {
      const filePath = path.join(__dirname, "..", imgNow);
      fs.unlink(filePath, (err) => console.log(err));
    }
    image = imgComing.path;
  }
  return image;
};
