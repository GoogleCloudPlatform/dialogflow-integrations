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

/**
 * Convert string to JSON Object
 * @private
 * @param {string} str
 */
function parseJSON(str) {
    return JSON.parse(str);
}

/**
 * Parse string to XML file
 * @private
 * @param {string} str
 */
function parseXML(str) {
    let ret = {};
    require("xml2js")
        .parseString(str, { explicitArray: false }, (err, result) => {
            ret = { error: err, result: result };
        });
    if (ret.error) {
        throw ret.error;
    }
    return ret.result;
}

/**
 * Parse string to Text
 * @private
 * @param {string} str
 */
function parseText(str) {
    return str;
}

/**
 * Remove special characters with ASCI values
 * @private
 * @param {string} str
 */
function esc(str) {
    return str && String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Helper function to verify if object is Array
 * @private
 * @param {Object|Array} a
 */
function isArray(a) {
    return _.isObject(a) && _.isFunction(a.pop);
}

/**
 * Escape String
 * @private
 * @param {string} str
 */
function escapeString(str) {
    return String(str || "").replace(/'/g, "\\'");
}

module.exports = {
    parseJSON,
    parseXML,
    parseText,
    esc,
    isArray,
    escapeString
};
