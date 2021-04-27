const express = require('express');

const { create, list, read, remove } = require('../controllers/category');

const router = express.Router();

router.post('/category', create);
router.get('/categories', list);
router.get('/category/:slug', read);
router.delete('/category/:slug', remove);

module.exports = router;
