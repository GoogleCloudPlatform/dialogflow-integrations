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

const QueryBuilder = require("../lib/query-builder");
const SalesforceDate = require("../lib/date");
const assert = require("chai").assert;

/**
 *  Test Query Generation
 */
describe("query builder", () => {
    let queryBuilder = new QueryBuilder();

    /**
     *  Simple Query
     */
    describe("simple query", () => {
        let soql = queryBuilder.createQuery({
            table: "Account",
            fields: ["Id", "Name"],
            conditions: { AccountNumber: "CD656092" },
        });
        it("should build query", () => {
            assert.ok(soql === "SELECT Id, Name FROM Account WHERE AccountNumber = 'CD656092'");
        });
    });

    /**
     * query for null value
     */
    describe("query with null values", () => {
        let soql = queryBuilder.createQuery({
            table: "Account",
            fields: ["Id", "Name"],
            conditions: { AccountNumber: { $ne: null } }
        });
        it("should return soql", () => {
            assert.ok(soql === "SELECT Id, Name FROM Account WHERE AccountNumber != null");
        });
    });
    /**
     * query with or conditions
     */
    describe("query with OR operator", () => {
        let soql = queryBuilder.createQuery({
            fields: ["Id", "Name"],
            table: "Account",
            conditions: {
                $or: [
                { Id: "0011000000NPNrW" },
                { Id: "00110000005WlZd" }
                ]
            }
        });
        it("should equal to soql", () => {
            assert.ok(soql
              === "SELECT Id, Name FROM Account "
              + "WHERE Id = '0011000000NPNrW' OR Id = '00110000005WlZd'"
            );
        });
    });

    /**
     * With nested OR conditon
     */
    describe("query with nested OR operator", () => {
        let soql = queryBuilder.createQuery({
            fields: ["Id", "Name"],
            table: "Account",
            conditions: {
                Type: "Partner",
                $or: [
                    { Id: "0011000000NPNrW" },
                    { Id: "00110000005WlZd" }
                ]
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql
            === "SELECT Id, Name FROM Account "
            + "WHERE Type = 'Partner' AND (Id = '0011000000NPNrW' OR Id = '00110000005WlZd')"
          );
        });
    });

    /**
     *  Nested AND/OR query
     */
    describe("Query with nested OR/AND operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                $or: [
              { "Account.Type": "Partner" },
                    {
                        $and: [
                            { Amount: { $gte: 1000 } },
                            { Amount: { $lt: 2000 } }
                        ]
                    }
                ]
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql
            === "SELECT Id FROM Opportunity "
            + "WHERE Account.Type = 'Partner' OR (Amount >= 1000 AND Amount < 2000)"
          );
        });
    });

    describe("Query with nested NOT/AND operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                $not: {
                    $and: [
                        { Amount: { $gte: 1000 } },
                        { Amount: { $lt: 2000 } },
                        { "Account.Type": "Customer" }
                    ]
                }
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity " + "WHERE NOT (Amount >= 1000 AND Amount < 2000 AND Account.Type = 'Customer')");
        });
    });


    describe("Query with nested NOT operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                $not: {
                    Name: { $like: "Test%" }
                },
                Amount: { $gte: 1000 }
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity " + "WHERE (NOT Name LIKE 'Test%') AND Amount >= 1000");
        });
    });


    describe("Query with nested OR/NOT/AND operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                $or: [
                    { "Account.Type": "Partner" },
                    {
                        $not: {
                            $and: [
                                { Amount: { $gte: 1000 } },
                                { Amount: { $lt: 2000 } },
                                { "Account.Type": "Customer" }
                            ]
                        }
                    }
                ]
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity " + "WHERE Account.Type = 'Partner' OR (NOT (Amount >= 1000 AND Amount < 2000 AND Account.Type = 'Customer'))");
        });
    });

    describe("Query with String field using $like/$nlike operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Account",
            conditions: {
                Name: { $like: "John's%" },
                "Owner.Name": { $nlike: "%Test%" }
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Account " + "WHERE Name LIKE 'John\\'s%' AND (NOT Owner.Name LIKE '%Test%')");
        });
    });


    describe("Query using $in/$nin operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Contact",
            conditions: {
                "Id": { $in: [] },
                "Account.Id": { $in: ["0011000000NPNrW", "00110000005WlZd"] },
                "Owner.Id": { $nin: ["00510000000N2C2"] }
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Contact " + "WHERE Account.Id IN ('0011000000NPNrW', '00110000005WlZd') " + "AND Owner.Id NOT IN ('00510000000N2C2')");
        });
    });


    describe("Query using $exists operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Task",
            conditions: {
                WhatId: { $exists: true },
                WhoId: { $exists: false }
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Task " + "WHERE WhatId != null AND WhoId = null"
      );
        });
    });


    describe("Query using $includes/$excludes operator", () => {
        let soql = queryBuilder.createQuery({
            table: "Contact",
            conditions: {
                Languages__c: { $includes: ["English", "Japanese"] },
                Certifications__c: { $excludes: ["Oracle"] }
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Contact " + "WHERE Languages__c INCLUDES ('English', 'Japanese') " + "AND Certifications__c EXCLUDES ('Oracle')");
        });
    });


    describe("Query with undefined condition", () => {
        let soql = queryBuilder.createQuery({
            table: "Account",
            conditions: {
                Type: undefined
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Account");
        });
    });


    describe("Query with descending sort option", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            sort: "-CreatedDate",
            limit: 10,
            offset: 5
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity ORDER BY CreatedDate DESC LIMIT 10 OFFSET 5");
        });
    });

    describe("Query with ascending sort option", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            sort: "+CreatedDate",
            limit: 10
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity " + "ORDER BY CreatedDate ASC " + "LIMIT 10");
        });
    });

    describe("query with multiple sort in correct input format", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                "Owner.Name": { $like: "A%" }
            },
            sort: "CreatedDate DESC, Name ASC",
            limit: 5
        });

        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity " + "WHERE Owner.Name LIKE 'A%' " + "ORDER BY CreatedDate DESC, Name ASC " + "LIMIT 5");
        });
    });
    describe("Query with multiple sort option in hash", () => {
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                "Owner.Name": { $like: "A%" }
            },
            sort: {
                CreatedDate: -1,
                Name: 1
            },
            limit: 10
        });
        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Opportunity " + "WHERE Owner.Name LIKE 'A%' " + "ORDER BY CreatedDate DESC, Name ASC " + "LIMIT 10");
        });
    });

    describe("Query with Date field for date literal", () => {
        let sfdt = new SalesforceDate();
        let soql = queryBuilder.createQuery({
            table: "Opportunity",
            conditions: {
                $and: [
                    { CloseDate: { $gte: SalesforceDate.LAST_N_DAYS(10) } },
                    { CloseDate: { $lte: SalesforceDate.TOMORROW } },
                    { CloseDate: { $gt: sfdt.toDateLiteral(new Date(1288958400000)) } },
                    { CreatedDate: { $lt: sfdt.toDateTimeLiteral("2010-11-02T04:45:04+09:00") } }
                ]
            }
        });

        it("should equal to soql", () => {
            assert.ok(soql
            === "SELECT Id FROM Opportunity "
            + "WHERE CloseDate >= LAST_N_DAYS:10 AND CloseDate <= TOMORROW "
            + "AND CloseDate > 2010-11-05 AND CreatedDate < 2010-11-01T19:45:04Z"
          );
        });
    });
    describe("query for populate parent", () => {
        let soql = queryBuilder.createQuery({
            table: "Account",
            innerjoin: {
                child: {
                    table: "Contact",
                    field: "accountId"
                },
                parent: {
                    field: "Id"
                }
            }
        });
        it("should equal to soql", () => {
            assert.ok(soql === "SELECT Id FROM Account WHERE Account.Id IN (SELECT Contact.accountId FROM Contact )");
        });
    });

});
