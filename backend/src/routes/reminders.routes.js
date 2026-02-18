'use strict';

const express = require('express');
const remindersController = require('../controllers/reminders.controller');

const router = express.Router();

router.get('/', remindersController.list);
router.get('/:id', remindersController.getById);
router.post('/', remindersController.create);
router.patch('/:id', remindersController.update);
router.delete('/:id', remindersController.remove);

module.exports = router;
