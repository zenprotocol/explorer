'use strict';

const db = require('../db/sequelize/models');
const wrapORMErrors = require('./wrapORMErrors');

const createDAL = modelName => {
  return {
    model: modelName,
    db: db,
    async findAll(options) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findAll(options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async findAllWithFK(foreignKeys = []) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findAll({ include: foreignKeys })
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async findById(id) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findById(id)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async findByIdWithFK(id, foreignKeys = []) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findById(id, { include: foreignKeys })
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async findOne(options) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findOne(options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async count(where = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .count(where)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async create(values = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .create(values)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async update(id, values = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findById(id)
          .then((model) => {
            return model.update(values, {individualHooks: true });
          })
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async delete(id) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .destroy({ where: { id: id } })
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
  };
};

module.exports = { createDAL };
