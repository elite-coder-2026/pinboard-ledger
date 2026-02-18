'use strict';

const express = require('express');
const attachmentsController = require('../controllers/attachments.controller');

const router = express.Router();

router.get('/', attachmentsController.list);
router.get('/:id', attachmentsController.getById);
router.post('/', attachmentsController.create);
router.patch('/:id', attachmentsController.update);
router.delete('/:id', attachmentsController.remove);

module.exports = router;
