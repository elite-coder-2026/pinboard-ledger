'use strict';

const express = require('express');
const notebooksController = require('../controllers/notebooks.controller');

const router = express.Router();

router.get('/', notebooksController.list);
router.get('/:id', notebooksController.getById);
router.post('/', notebooksController.create);
router.patch('/:id', notebooksController.update);
router.delete('/:id', notebooksController.remove);

module.exports = router;
