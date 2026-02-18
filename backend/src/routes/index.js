'use strict';

const express = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const notebooksRoutes = require('./notebooks.routes');
const notesRoutes = require('./notes.routes');
const tagsRoutes = require('./tags.routes');
const entriesRoutes = require('./entries.routes');
const remindersRoutes = require('./reminders.routes');
const attachmentsRoutes = require('./attachments.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/notebooks', notebooksRoutes);
router.use('/notes', notesRoutes);
router.use('/tags', tagsRoutes);
router.use('/entries', entriesRoutes);
router.use('/reminders', remindersRoutes);
router.use('/attachments', attachmentsRoutes);

module.exports = router;
