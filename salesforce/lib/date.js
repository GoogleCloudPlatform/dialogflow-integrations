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

const dateLiterals = {
    YESTERDAY: 1,
    TODAY: 1,
    TOMORROW: 1,
    LAST_WEEK: 1,
    THIS_WEEK: 1,
    NEXT_WEEK: 1,
    LAST_MONTH: 1,
    THIS_MONTH: 1,
    NEXT_MONTH: 1,
    LAST_90_DAYS: 1,
    NEXT_90_DAYS: 1,
    LAST_N_DAYS: 2,
    NEXT_N_DAYS: 2,
    NEXT_N_WEEKS: 2,
    LAST_N_WEEKS: 2,
    NEXT_N_MONTHS: 2,
    LAST_N_MONTHS: 2,
    THIS_QUARTER: 1,
    LAST_QUARTER: 1,
    NEXT_QUARTER: 1,
    NEXT_N_QUARTERS: 2,
    LAST_N_QUARTERS: 2,
    THIS_YEAR: 1,
    LAST_YEAR: 1,
    NEXT_YEAR: 1,
    NEXT_N_YEARS: 2,
    LAST_N_YEARS: 2,
    THIS_FISCAL_QUARTER: 1,
    LAST_FISCAL_QUARTER: 1,
    NEXT_FISCAL_QUARTER: 1,
    NEXT_N_FISCAL_QUARTERS: 2,
    LAST_N_FISCAL_QUARTERS: 2,
    THIS_FISCAL_YEAR: 1,
    LAST_FISCAL_YEAR: 1,
    NEXT_FISCAL_YEAR: 1,
    NEXT_N_FISCAL_YEARS: 2,
    LAST_N_FISCAL_YEARS: 2
};

/**
 * Saleforce Date Helper
 * @constructor
 * @protected
 * @param {Number} literal - Number based on dateLiterals Array
 */
class SalesforceDate {

    constructor(literal) {
        this._literal = literal;
    }

    toJSON() { return this._literal; }

  /**
   * zeropad - Prefixes with "0" for single digit numbers
   * @private
   * @param {Number} n
   * @returns
   * @memberof salesforceDate
   */
    zeropad(n) { return (n < 10 ? "0" : "") + n; }

  /**
   *toDateLiteral - converts date to the literal format accepted by constructor
   * @private
   * @param {Number|String} date
   * @returns date in literal format
   * @memberof salesforceDate
   */
    toDateLiteral(date) {
        if (_.isNumber(date)) {
            date = new Date(date);
        } else if (_.isString(date)) {
            date = this.parseDate(date);
        }
        let yy = date.getFullYear();
        let mm = date.getMonth() + 1;
        let dd = date.getDate();
        let dstr = [yy, this.zeropad(mm), this.zeropad(dd)].join("-");
        return new SalesforceDate(dstr);
    }

  /**
   *toDateTimeLiteral - converts date to date and time format
   * @private
   * @param {Number|String} date
   * @returns contructor callback
   * @memberof salesforceDate
   */
    toDateTimeLiteral(date) {
        if (_.isNumber(date)) {
            date = new Date(date);
        } else if (_.isString(date)) {
            date = this.parseDate(date);
        }
        let yy = date.getUTCFullYear();
        let mm = date.getUTCMonth() + 1;
        let dd = date.getUTCDate();
        let hh = date.getUTCHours();
        let mi = date.getUTCMinutes();
        let ss = date.getUTCSeconds();
        let dtstr
      = [yy, this.zeropad(mm), this.zeropad(dd)].join("-") + "T"
      + [this.zeropad(hh), this.zeropad(mi), this.zeropad(ss)].join(":") + "Z";
        return new SalesforceDate(dtstr);
    }

  /**
   *parseDate - checks for the validity of the date and parse it in the required format
   * @private
   * @param {String} str
   * @returns Date
   * @memberof salesforceDate
   */
    parseDate(str) {
        let d = new Date();
        let regexp = /^([\d]{4})-?([\d]{2})-?([\d]{2})(T([\d]{2}):?([\d]{2}):?([\d]{2})(.([\d]{3}))?(Z|([\+\-])([\d]{2}):?([\d]{2})))?$/;
        let m = str.match(regexp);
        if (m) {
            d = new Date(0);
            if (!m[4]) {
                d.setFullYear(parseInt(m[1], 10));
                d.setDate(parseInt(m[3], 10));
                d.setMonth(parseInt(m[2], 10) - 1);
                d.setHours(0);
                d.setMinutes(0);
                d.setSeconds(0);
                d.setMilliseconds(0);
            } else {
                d.setUTCFullYear(parseInt(m[1], 10));
                d.setUTCDate(parseInt(m[3], 10));
                d.setUTCMonth(parseInt(m[2], 10) - 1);
                d.setUTCHours(parseInt(m[5], 10));
                d.setUTCMinutes(parseInt(m[6], 10));
                d.setUTCSeconds(parseInt(m[7], 10));
                d.setUTCMilliseconds(parseInt(m[9] || "0", 10));
                if (m[10] && m[10] !== "Z") {
                    let offset = parseInt(m[12], 10) * 60 + parseInt(m[13], 10);
                    d.setTime((m[11] === "+" ? -1 : 1) * offset * 60 * 1000 + d.getTime());
                }
            }
            return d;
        } else {
            throw new Error("Invalid date format is specified : " + str);
        }
    }
}

/**
 *createLiteralBuilder - Calls contructor with literal : num params
 * @private
 * @param {Number} literal
 * @returns
 */
function createLiteralBuilder(literal) {
    return function(num) { return new SalesforceDate(literal + ":" + num); };
}

for (let literal in dateLiterals) {
    SalesforceDate[literal] = dateLiterals[literal] === 1
    ? new SalesforceDate(literal) : createLiteralBuilder(literal);
}

module.exports = SalesforceDate;
