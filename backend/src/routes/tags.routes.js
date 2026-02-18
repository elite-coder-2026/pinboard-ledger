'use strict';

const express = require('express');
const tagsController = require('../controllers/tags.controller');

const router = express.Router();

router.get('/', tagsController.list);
router.get('/:id', tagsController.getById);
router.post('/', tagsController.create);
router.patch('/:id', tagsController.update);
router.delete('/:id', tagsController.remove);

module.exports = router;
