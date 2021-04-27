const express = require('express');

const { create, list, read, remove } = require('../controllers/tag');

const router = express.Router();

router.post('/tag', create);
router.get('/tags', list);
router.get('/tag/:slug', read);
router.delete('/tag/:slug',remove);

module.exports = router; 
