const express = require('express');
const router = express.Router();

const {
    create,
    list,
    listAllBlogsCategoriesTags,
    read,
    remove,
    update,
    photo,
    listRelated,
    listSearch,
    listByUser
} = require('../controllers/blog');

const { requireSignin, adminMiddleware, authMiddleware, canUpdateDeleteBlog } = require('../middleware/auth');

router.post('/blog',  create);
router.get('/blogs', list);
router.post('/blogs-categories-tags', listAllBlogsCategoriesTags);
router.get('/blog/:slug', read);
router.delete('/blog/:slug', remove);
router.put('/blog/:slug', update);
router.get('/blog/photo/:slug', photo);
router.post('/blogs/related', listRelated);
router.get('/blogs/search', listSearch);

// auth user blog crud
router.post('/user/blog',  create);
router.get('/:username/blogs', listByUser);
router.put('/user/blog/:slug', update);

module.exports = router;
