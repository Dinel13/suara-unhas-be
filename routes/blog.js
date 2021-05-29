const express = require('express');
const router = express.Router();

const {
    create,
    list,
    read,
    remove,
    update,
    comment,
    listRelated,
    listSearch,
    listByUser
} = require('../controllers/blog-controller');
const {authMiddleware} = require('../middleware/auth')
const fileUpload = require('../middleware/file-upload')



router.get('/blogs', list);
router.get('/blog/:slug', read);

router.use(authMiddleware)

router.post('/blog', fileUpload.single('imageBlog'), create);
router.delete('/blog/:slug', remove);
router.put('/blog/:slug', update);
router.post('/blog/:slug/comment', comment);
router.post('/blogs/related', listRelated);
router.get('/blogs/search', listSearch);

// auth user blog crud
router.post('/user/blog',  create);
router.get('/:username/blogs', listByUser);
router.put('/user/blog/:slug', update);

module.exports = router;
