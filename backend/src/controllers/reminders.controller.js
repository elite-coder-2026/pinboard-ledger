'use strict';

const remindersService = require('../services/reminders.service');

async function list(req, res, next) {
  try {
    const result = await remindersService.list(req.user, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await remindersService.getById(req.user, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const result = await remindersService.create(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await remindersService.update(req.user, req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await remindersService.remove(req.user, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
