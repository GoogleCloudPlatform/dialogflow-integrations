// Copyright Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

const _ = require("lodash/core");
const pluralize = require("pluralize");
const QueryBuilder = require("./query-builder");
const queryBuilder = new QueryBuilder();
const ResponseTargets = {
    "QueryResult": "QueryResult",
    "Records": "Records",
    "SingleRecord": "SingleRecord",
    "Count": "Count"
};

/**
     * Query class to keep the API session information and manage requests
     * @public
     * @param {Object} [conn] - Connection Object
     * @param {Object|String} [config] - Query config
     * @param {Object} [options] - Query options
     */
module.exports = class {

    constructor(conn, config, options) {
        this._conn = conn;
        this._config = config || {};

        if (_.isString(config)) {
            this._soql = config;
            this._config = {};
        }
        this._options = _.defaults(options || {}, {
            maxFetch: 10000,
            scanAll: false,
            responseTarget: ResponseTargets.QueryResult
        });
    }

    /**
     * Return SOQL expression for the query
     * @private
     * @returns {Promise.<String>}
     */
    toSOQL() {
        return Promise.resolve(this._soql ? this._soql : queryBuilder.createQuery(this._config));
    }

    /**
     * Executes Query
     * @public
     * @param {Object} [options] - Query options
     * @param {Number} [options.maxFetch] - Max fetching records in auto fetch mode
     * @param {String} [options.responseTarget] - SingleRecord|Records|Count and Default (QueryResult)
     * @param {Object} [options.headers] - Additional HTTP request headers sent in query request
     * @returns {Promise<QueryResult>}
     */
    run(options) {
        options = options || {};
        let logger = this._conn.logger;
        let responseTarget = options.responseTarget || this._options.responseTarget;
        // let maxFetch = options.maxFetch || this._options.maxFetch;

        return Promise.resolve(
            this._locator ? this._conn.baseUrl() + "/query/" + this._locator
                : this.toSOQL()
                    .then((soql) => {
                        this.totalFetched = 0;
                        logger.debug("SOQL = " + soql);
                        return this._conn.baseUrl() + "/query?q=" + encodeURIComponent(soql);
                    })
        ).then((url) => this._conn.request({
            method: "GET",
            url: url,
            headers: options.headers || this._options.headers
        })).then((data) => {
            let response;
            switch (responseTarget) {
                case ResponseTargets.SingleRecord:
                    response = data.records && data.records.length > 0 ? data.records[0] : null;
                    break;
                case ResponseTargets.Records:
                    response = data.records;
                    break;
                case ResponseTargets.Count:
                    response = data.totalSize;
                    break;
                default:
                    response = data;
                    break;
            }
            if (data.nextRecordsUrl) {
                this._locator = data.nextRecordsUrl.split("/").pop();
            }
            return response;
        });
    }

    /**
     * Select fields to include in the returning result
     * @public
     * @param {Object|Array.<String>|String} fields - Fields to fetch. Format can be in JSON object (MongoDB-like), array of field names, or comma-separated field names.
     * @returns {Query.<T>}
     */
    select(fields) {
        if (this._soql) {
            throw Error("Cannot set select fields for the query which has already built SOQL.");
        }
        if (_.isString(fields)) {
            fields = fields.split(/\s*,\s*/);
        } else if (_.isObject(fields) && !_.isArray(fields)) {
            let tempFields = [];
            for (let k in fields) {
                if (fields[k]) { tempFields.push(k); }
            }
            fields = tempFields;
        }
        this._config.fields = fields;
        return this;
    }

    /**
     * Select all fields to include in the returning result
     * @public
     * @returns {Promise}
     */
    selectAll() {
        if (this._soql) {
            throw Error("Cannot set select fields for the query which has already built SOQL.");
        }
        return new Promise((resolve, reject) => {
            this._conn.getCollectionDetails(this._config.table).then(collection => {
                let fields = [];
                collection.fields.forEach(field => {
                    fields.push(field.name);
                });
                this._config.fields = fields;
                resolve(this);
            }).catch(err => reject(err));
        });
    }

    /**
     * Set query conditions to filter the result records
     * @public
     * @param {Object|String} conditions - Conditions in JSON object (MongoDB-like), or raw SOQL WHERE clause string.
     * @returns {Query.<T>}
     */
    where(conditions) {
        if (this._soql) {
            throw Error("Cannot set where conditions for the query which has already built SOQL.");
        }
        this._config.conditions = conditions;
        return this;
    }

    /**
     * Limit the returning result
     * @public
     * @param {Number} limit - Maximum number of records the query will return.
     * @returns {Query.<T>}
     */
    limit(limit) {
        if (this._soql) {
            throw Error("Cannot set limit for the query which has already built SOQL.");
        }
        this._config.limit = limit;
        return this;
    }

    /**
     * Skip the starting rows of the result
     * @public
     * @param {Number} rows - Number of rows to skip.
     * @returns {Query.<QueryResult>}
     */
    skip(rows) {
        if (this._soql) {
            throw Error("Cannot set offset for the query which has already built SOQL.");
        }
        this._config.offset = rows;
        return this;
    }

    /**
     * Set query conditions to sort the result records
     * @public
     * @param {Object|String} conditions - Conditions in JSON object (MongoDB-like), or raw SOQL ORDER BY clause string.
     * @returns {Query.<T>}
     */
    sortBy(conditions) {
        if (this._soql) {
            throw Error("Cannot write sort for the query which has already built SOQL.");
        }
        this._config.sort = conditions;
        return this;
    }

    /**
     * Set query conditions to create a new Record
     * @public
     * @param {Object} body - Request payload JSON object.
     * @returns {Promise} Returns request promise
     */
    create(body) {
        return this._conn.request({
            method: "POST",
            url: `${this._conn.baseUrl()}/sobjects/${this._config.table}`,
            headers: this._options.headers,
            body: body,
            json: true
        });
    }

    /**
     * Set query conditions to update a new Record
     * @public
     * @param {String} id - Unique ID of the record to be updated.
     * @param {Object} body - Request payload JSON object.
     * @returns {Promise} Returns request promise
     */
    update(id, body) {
        return this._conn.request({
            method: "PATCH",
            url: `${this._conn.baseUrl()}/sobjects/${this._config.table}/${id}`,
            headers: this._options.headers,
            body: body,
            json: true
        });
    }

    /**
     *Method delete
     * @public
     * @param {String} id - Id of the record to be deleted
     * @returns {Promise} - request method connection.js
     */
    delete(id) {
        return new Promise((resolve, reject) => {
            this.exists(id).then(result => {
                if (result) {
                    resolve(this._conn.request({
                        method: "DELETE",
                        url: `${this._conn.baseUrl()}/sobjects/${this._config.table}/${id}`,
                        headers: this._options.headers
                    }));
                } else {
                    reject("Entry to be deleted does not exist");
                }
            }).catch(error => reject(error));
        });
    }

    /**
    * Method upsert(Insert if record doesn"t exist and update if exists)
    * @public
    * @param {Object} body - Request payload JSON object.
    * @returns {Promise} Returns request promise
    */
    upsert(body) {
        return new Promise((resolve, reject) => {
            let id = body.Id;
            delete body.Id;
            if (id) {
                this.exists(id).then(result => {
                    if (result) {
                        resolve(this.update(id, body));
                    } else {
                        resolve(this.create(body));
                    }
                }).catch(error => reject(error));
            } else {
                resolve(this.create(body));
            }
        });
    }

    /**
     * Method to check if the record exists.
     * @public
     * @param {String} id - Id of the record to check whether there or not.
     * @returns {Promise} Returns request promise
     */
    exists(id) {
        return new Promise((resolve, reject) => {
            this.select("Id, Name").where({
                Id: id
            }).run().then(instance => {
                if (instance.records.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(error => reject(error));
        });
    }

    /**
     * Method to populate Child > Parent (Standard Object) field
     * @public
     * @param {String|Array} options The parent table to populate
     * @returns {Query.<QueryResult>}
     */
    populateChild(options) {
        if (_.isString(options)) {
            options = options.split(/\s*,\s*/);
        }
        let tempFields = [];
        options.forEach(option => {
            option += ".name";
            tempFields.push(option);
        });
        options = tempFields;
        this._config.fields = this._config.fields.concat(options);
        return this;
    }

    /**
     * Method to populate Parent > Child (Standard Object) field
     * @public
     * @param {Object} conditions
     * Format to be
     * { child: {table: "Table_Name", field: "Field1"}, parent: {field: "Field"}}
     * @returns {Query.<QueryResult>}
     */
    populateParent(conditions) {
        this._config.innerjoin = conditions;
        return this;
    }

    /**
     * Joining Two or more tables
     * @public
     * @param {Array} options
     * Format to be
     * [{table: "Table_Name", fields: ["Field1", "Field2"]|"Field1, Field2"}, condition: "SOQL String"(optional field)]
     * @returns {Query<QueryResult>}
     */
    joinTable(options) {
        let tempFields = [];
        options.forEach(option => {
            let condition = option.condition || "";
            tempFields.push("(Select " + option.fields.map(field => field = option.table + "." + field).join(",") + " FROM " + pluralize(option.table).toLowerCase() + " " + condition + " )");
        });
        this._config.fields = this._config.fields.concat(tempFields);
        return this;
    }
};
