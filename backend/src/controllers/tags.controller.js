'use strict';

const tagsService = require('../services/tags.service');

async function list(req, res, next) {
  try {
    const result = await tagsService.list(req.user, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await tagsService.getById(req.user, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const result = await tagsService.create(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await tagsService.update(req.user, req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await tagsService.remove(req.user, req.params.id);
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
