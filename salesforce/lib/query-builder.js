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
const SalesForceDate = require("./date");
const { escapeString, isArray } = require("./helper");

const opMap = {
    "=": "=",
    "$eq": "=",
    "!=": "!=",
    "$ne": "!=",
    ">": ">",
    "$gt": ">",
    "<": "<",
    "$lt": "<",
    ">=": ">=",
    "$gte": ">=",
    "<=": "<=",
    "$lte": "<=",
    "$like": "LIKE",
    "$nlike": "NOT LIKE",
    "$in": "IN",
    "$nin": "NOT IN",
    "$includes": "INCLUDES",
    "$excludes": "EXCLUDES",
    "$exists": "EXISTS"
};

/**
 * Class containing various method to build query string
 * @protected
 * @constructor
 */
module.exports = class {

    /**
     *Creates Query String
     * @private
     * @param {Object} query
     * @returns soql
     */
    createQuery(query) {
        let soql = [
            "SELECT ",
            this.createFieldsClause(query.fields, query.includes),
            " FROM ",
            query.table
        ].join("");
        let cond = this.createConditionClause(query.conditions);
        if (cond) {
            soql += " WHERE " + cond;
        }
        let orderby = this.createOrderByClause(query.sort);
        if (orderby) {
            soql += " ORDER BY " + orderby;
        }
        if (query.limit) {
            soql += " LIMIT " + query.limit;
        }
        if (query.offset) {
            soql += " OFFSET " + query.offset;
        }
        if (query.innerjoin) {
            soql += " WHERE " + query.table + "." + query.innerjoin.parent.field + " IN (SELECT " + query.innerjoin.child.table + "." + query.innerjoin.child.field + " FROM " + query.innerjoin.child.table + " )";
        }
        return soql;
    }

    /**
     *createFieldsClause Create fields string required in query
     * @private
     * @param {Array<Object>} fields
     * @param {Array<String>} childQueries
     * @returns string of concatinated fields
     */
    createFieldsClause(fields, childQueries) {
        childQueries = _.map(_.values(childQueries || {}), () => "(' + createSOQL(cquery) + ')");
        return (fields || ["Id"]).concat(childQueries).join(", ");
    }

    /**
     *createConditionClause - conditon string used in query
     * @private
     * @param {Array|String} conditions
     * @param {String} operator
     * @param {Number} depth
     * @returns conds - Array of condition
     */
    createConditionClause(conditions, operator, depth) {
        if (_.isString(conditions)) {
            return conditions;
        }
        conditions = conditions || [];
        operator = operator || "AND";
        depth = depth || 0;
        if (!isArray(conditions)) {
            conditions = _.keys(conditions).map((key) => ({
                key: key,
                value: conditions[key]
            }));
        } else {
            conditions = conditions.map((cond) => {
                let conds = [];
                for (let key in cond) {
                    conds.push({
                        key: key,
                        value: cond[key]
                    });
                }
                return conds.length > 1 ? conds : conds[0];
            });
        }

        conditions = conditions.map((cond) => {
            let d = depth + 1;
            let op;
            switch (cond.key) {
                case "$or":
                case "$and":
                case "$not":
                    if (operator !== "NOT" && conditions.length === 1) {
                        d = depth;
                    }
                    op = cond.key === "$or" ? "OR"
                        : cond.key === "$and" ? "AND"
                            : "NOT";
                    return this.createConditionClause(cond.value, op, d);
                default:
                    return this.createFieldExpression(cond.key, cond.value);
            }
        }).filter((expr) => expr);

        let paren;
        if (operator === "NOT") {
            paren = depth > 0;
            return (paren ? "(" : "") + "NOT " + conditions[0] + (paren ? ")" : "");
        } else {
            paren = depth > 0 && conditions.length > 1;
            return (paren ? "(" : "") + conditions.join(" " + operator + " ") + (paren ? ")" : "");
        }
    }

    /**
     *createFieldExpression - creates string from expression query
     * @private
     * @param {String} field
     * @param {Object|Array} value
     * @returns str
     */
    createFieldExpression(field, value) {
        let op = "$eq";

        // Assume the `$in` operator if value is an array and none was supplied.
        if (_.isArray(value)) {
            op = "$in";
        } else if (_.isObject(value)) {
            for (let k in value) {
                if (k[0] === "$") {
                    op = k;
                    value = value[k];
                    break;
                }
            }
        }
        let sfop = opMap[op];
        if (!sfop || _.isUndefined(value)) { return null; }
        let valueExpr = this.createValueExpression(value);
        if (_.isUndefined(valueExpr)) { return null; }
        switch (sfop) {
            case "NOT LIKE":
                return "(" + ["NOT", field, "LIKE", valueExpr].join(" ") + ")";
            case "EXISTS":
                return [field, value ? "!=" : "=", "null"].join(" ");
            default:
                return [field, sfop, valueExpr].join(" ");
        }
    }

    /**
     *createValueExpression
     * @private
     * @param {Array|String|Number} value
     * @returns {String} value- value expression
     */
    createValueExpression(value) {
        if (isArray(value)) {
            return value.length > 0
                ? "(" + value.map(this.createValueExpression).join(", ") + ")"
                : undefined;
        }
        if (value instanceof SalesForceDate) {
            return value._literal.toString();
        }
        if (_.isString(value)) {
            return "'" + escapeString(value) + "'";
        }
        if (_.isNumber(value)) {
            return (value).toString();
        }
        if (_.isNull(value)) {
            return "null";
        }
        return value;
    }

    /**
     *createOrderByClause
     * @private
     * @param {Array|String} sort
     * @returns stringfy value for orderby
     */
    createOrderByClause(sort) {
        sort = sort || [];
        if (_.isString(sort)) {
            if (/,|\s+(asc|desc)\s*$/.test(sort)) {
                return sort;
            }
            // sort order in "FieldA -FieldB" => "ORDER BY FieldA ASC, FieldB DESC".
            sort = sort.split(/\s+/).map((field) => {
                let dir = "ASC";
                let flag = field[0];
                if (flag === "-") {
                    dir = "DESC";
                    field = field.substring(1);
                } else if (flag === "+") {
                    field = field.substring(1);
                }
                return [field, dir];
            });
        } else if (!isArray(sort)) {
            sort = _.keys(sort).map((field) => {
                let dir = sort[field];
                return [field, dir];
            });
        }
        return sort.map((s) => {
            let field = s[0];
            let dir = s[1];
            switch (String(dir)) {
                case "DESC":
                case "desc":
                case "descending":
                case "-":
                case "-1":
                    dir = "DESC";
                    break;
                default:
                    dir = "ASC";
            }
            return field + " " + dir;
        }).join(", ");
    }
};
