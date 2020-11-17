'use strict';

const deepMerge = require('deepmerge');
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
    async findById(id, options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findByPk(id, options)
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
    async count(options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .count(options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async sum(column, options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .sum(column, options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async create(values = {}, options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .create(values, options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async bulkCreate(values = [], options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .bulkCreate(values, options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async update(id, values = {}, options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .findByPk(id)
          .then(model => {
            return model.update(values, deepMerge({ individualHooks: true }, options));
          })
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async bulkUpdate(values = {}, options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .update(values, deepMerge({ individualHooks: true }, options))
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async delete(id, options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .destroy(deepMerge({ where: { id: id } }, options))
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    async bulkDelete(options = {}) {
      return new Promise((resolve, reject) => {
        this.db[this.model]
          .destroy(options)
          .then(resolve)
          .catch(error => {
            reject(wrapORMErrors(error));
          });
      });
    },
    toJSON(model) {
      return model ? model.toJSON() : null;
    },
    getItemsAndCountResult([count, items] = []) {
      return {
        count: Number(count),
        items,
      };
    },
    /**
     * Convert a query result to a count
     *
     * @param {Array} result
     * @returns the count as a number
     */
    queryResultToCount(result) {
      return result.length ? Number(result[0].count) : 0;
    },
  };
};

module.exports = { createDAL };
