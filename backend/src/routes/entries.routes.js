'use strict';

const express = require('express');
const entriesController = require('../controllers/entries.controller');

const router = express.Router();

router.get('/', entriesController.list);
router.get('/:id', entriesController.getById);
router.post('/', entriesController.create);
router.patch('/:id', entriesController.update);
router.delete('/:id', entriesController.remove);

module.exports = router;
