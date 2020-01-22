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

/* eslint-disable no-unused-vars */
"use strict";

const _ = require("lodash/core");

/**
 * Chatter class to keep the API session information and manage requests
 * @public
 * @constructor
 * @param {Object} [conn] - Connection Object
 * @param {Object} [options] - Chatter options
 */
class Chatter {
    constructor(conn, options) {
        this._conn = conn || {};
        this.options = options || {};
        this.baseUrl = [this._conn.baseUrl(), "chatter"].join("/");
    }

    /**
     * Functionality to retrieve data
     * @public
     * @return {Promise}
     */
    retrieve() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this._conn.request({
                    method: "GET",
                    url: this.baseUrl
                }));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Method to make a POST Call
     * @public
     * @param {Object} payload Request payload to be sent to the API.(Same as mentioned in SalesForce)
     * @return {Promise}
     */
    create(payload) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this._conn.request({
                    method: "POST",
                    url: this.baseUrl,
                    body: payload,
                    json: true
                }));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Define Resource
     * @public
     * @param {String} url The end point to be hit
     * @param {Object} conditions The end point to be hit (Optional)
     * @param {Array} conditions.include Fields to be included to be shown(When in use cannot use exclude).
     * @param {Array} conditions.exclude Fields to be included to be shown(When in use cannot use include).
     * @param {String} conditions.filterGroup Type of response Body (Big|Medium|Small).
     * @returns {Chatter<ChatterResult>}
     */
    resource(url, conditions) {
        conditions = conditions || {};
        let query;
        if (_.isObject(conditions)) {
            let esc = encodeURIComponent;
            query = Object.keys(conditions)
                .map(i => ({
                    property: i,
                    value: conditions[i]
                }))
                .map(j => {
                    if (_.isString(j.value)) {
                        j.value = j.value.split();
                        return esc(j.property) + "=" + esc(j.value.join("|")).replace(/%2F/g, "/");
                    } else {
                        return esc(j.property) + "=" + esc(j.value.map(a => "/" + a).join("|")).replace(/%2F/g, "/");
                    }
                })
                .join("&&");
            if (Object.keys(conditions).length > 0) {
                url = url + "?" + query;
            }
        }
        this.baseUrl = [this.baseUrl, url].join("/");
        return this;
    }

    /**
     * Get feeds of the concerned user
     * @public
     * @param {Object} conditions The end point to be hit (Optional)
     * @param {Array} conditions.include Fields to be included to be shown(When in use cannot use exclude).
     * @param {Array} conditions.exclude Fields to be included to be shown(When in use cannot use include).
     * @param {String} conditions.filterGroup Type of response Body (Big|Medium|Small).
     * @returns Resource method which infact creates the base uri.
     */
    myFeeds(conditions) {
        conditions = conditions || {};
        return this.resource("feeds/news/me/feed-elements", conditions);
    }

    /**
     * Get feeds of the concerned user
     * @public
     * @param {String} id Id of the user feeds;
     * @param {Object} conditions The end point to be hit (Optional)
     * @param {Array} conditions.include Fields to be included to be shown(When in use cannot use exclude).
     * @param {Array} conditions.exclude Fields to be included to be shown(When in use cannot use include).
     * @param {String} conditions.filterGroup Type of response Body (Big|Medium|Small).
     * @returns Resource method which infact creates the base uri.
     */
    feeds(id, conditions) {
        conditions = conditions || {};
        // eslint-disable-next-line quotes
        return this.resource(`feeds/record/${id}/feed-elements`, conditions);
    }

    /**
     * Get user profile of the concerned user
     * @public
     * @param {String} id Id of the user feeds;
     * @param {Object} conditions The end point to be hit (Optional)
     * @param {Array} conditions.include Fields to be included to be shown(When in use cannot use exclude).
     * @param {Array} conditions.exclude Fields to be included to be shown(When in use cannot use include).
     * @param {String} conditions.filterGroup Type of response Body (Big|Medium|Small).
     * @returns Resource method which infact creates the base uri.
     */
    profile(id, conditions) {
        conditions = conditions || {};
        // eslint-disable-next-line quotes
        return this.resource(`feeds/user-profile/${id}/feed-elements`, conditions);
    }
}

module.exports = Chatter;
