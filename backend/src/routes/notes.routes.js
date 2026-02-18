'use strict';

const express = require('express');
const notesController = require('../controllers/notes.controller');

const router = express.Router();

router.get('/', notesController.list);
router.get('/:id', notesController.getById);
router.post('/', notesController.create);
router.patch('/:id', notesController.update);
router.delete('/:id', notesController.remove);

module.exports = router;
