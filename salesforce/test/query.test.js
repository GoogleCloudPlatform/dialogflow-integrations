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

/* eslint-disable no-underscore-dangle */
"use strict";

const Query = require("../lib/query");
const Connection = require("./mock-request");
const _ = require("lodash/core");
const assert = require("chai").assert;
const expect = require("chai").expect;

let conn = new Connection({ logLevel: "INFO" });
let query = new Query(conn);

before(async () => {
});

/**
 *  select fields
 */
describe("select fields", () => {

    it("should throw error", async () => {
        try {
            await conn.query("SELECT * FROM Account").select("Id");
        } catch (err){
            expect(err.message).equal("Cannot set select fields for the query which has already built SOQL.");
        }
    });

    let inputFormats = ["Id,Name", ["Id", "Name"], { Id: 1, Name: 1 }];
    it("should store fields in config", () => {
        inputFormats.forEach(input => {
            let object = query.select(input);
            expect(object._config.fields).to.eql(["Id", "Name"]);
        });
    });
});

/**
 * selectAll fields
 */
describe("select all fields", () => {
    it("should throw error", async () => {
        try {
            await conn.query("SELECT Id,Name FROM Account").selectAll();
        } catch (err){
            expect(err.message).equal("Cannot set select fields for the query which has already built SOQL.");
        }
    });
    it("should return all fields", async () => {
        conn.collection("Account").selectAll().then(async response => {
            let result = await response.run();
            result["records"].forEach(record => {
                expect(Object.keys(record).length - 1).to.eql(65);
            });
        });
    });
});
/**
 *  where() - query conditions
 */
describe("query conditions", () => {
    it("should throw error", async () => {
        try {
            await conn.query("SELECT * FROM Account").where("Id=5645767");
        } catch (err){
            expect(err.message).equal("Cannot set where conditions for the query which has already built SOQL.");
        }
    });

    let inputFormats = ["Id=5645767", { "Id": 5645767 }];
    inputFormats.forEach(input => {
        it("should store conditons", () => {
            let object = query.where(input);
            expect(object._config.conditions).to.eql(input);
        });
    });
});

/**
 *  limit
 */
describe("limit", () => {
    it("should throw error", async () => {
        try {
            await conn.query("SELECT * FROM Account").limit(5);
        } catch (err){
            expect(err.message).equal("Cannot set limit for the query which has already built SOQL.");
        }
    });
    it("should set limit", () => {
        let object = query.limit(5);
        expect(object._config.limit).to.eql(5);
    });
});

/**
 * skip
 */
describe("skip", () => {
    it("should throw error", async () => {
        try {
            await conn.query("SELECT * FROM Account").skip(5);
        } catch (err){
            expect(err.message).equal("Cannot set offset for the query which has already built SOQL.");
        }
    });
    it("should set offset", () => {
        let object = query.skip(5);
        expect(object._config.offset).to.eql(5);
    });
});
/**
 * sort
 */
describe("sort by fields", () => {
    it("should throw error", async () => {
        try {
            await conn.query("SELECT * FROM Account").sortBy({ Name: -1 });
        } catch (err){
            expect(err.message).equal("Cannot write sort for the query which has already built SOQL.");
        }
    });
    it("single sort condition", () => {
        let sortByCondition = { Name: -1 };
        let object = query.sortBy(sortByCondition);
        expect(object._config.sort).to.eql(sortByCondition);
    });
});

/**
 * create
 */
describe("create new record", () => {

    it("should create new accounts", () => {
        conn.collection("Account").create(
            { Name: "My Account #5" }).then(response => {
                assert.ok(response.success);
            });
    });
});

/**
 * Update Record
 */
describe("update record", () => {
    let accountId = "0012v00002ZnNntAAF";
    let body = {
        Name: "Shibayan Computing New",
        Phone: "(415)555-1212",
        NumberOfEmployees: 50,
        BillingCity: "San Francisco"
    };
    it("should update record", async () => {
        let response = await conn.collection("Account").update(accountId, body);
        expect(response).eql("NO_CONTENT_RESPONSE");
    });
});

/**
 * Delete Record
 */
describe("delete record", () => {
    it("should throw error", async () => {
        try {
            await conn.collection("Account").delete("0012v00002YyUSQUP3");
        } catch (error){
            expect(error).equal("Entry to be deleted does not exist");
        }
    });
    it("should delete record", async () => {
        let accountId = "0012v00002ZnNpaAAF";
        let response = await conn.collection("Account").delete(accountId);
        expect(response).eql("NO_CONTENT_RESPONSE");
    });
    it("should reject promise", async () => {
        try {
            await conn.collection("Account").delete("error");
        } catch (error){
            console.log(error, "+++");
            expect(error.message).to.eql("Invalid query operator");
        }
    });
});

/**
 * upsert record
 */
describe("upsert record", () => {
    let existingRecord = {
        Id: "0012v00002ZpRoiAAF",
        Name: "Upsert Computing",
        NumberOfEmployees: 100,
    };
    let createRecord = {
        Id: "0012v00002YyUSQUP3",
        Name: "New Record"
    };
    let newRecord = {
        Name: "Computing Upsert ",
        NumberOfEmployees: 80,
        Phone: "(415)555-1212",
        BillingCity: "Atlanta"
    };
    it("should throw error", async () => {
        try {
            await conn.collection("Account").upsert({
                Id: "0012v00002YySSSB3",
                Name: "Test Computing New",
                BillingCity: "San Francisco"
            });
        } catch (err){
            expect(err.message).to.equal("No such Id exists");
        }
    });
    it("should create new record with given Id", async () => {
        let response = await conn.collection("Account").upsert(createRecord);
        assert.ok(response.success);
    });
    it("should create new record without Id", async () => {
        let response = await conn.collection("Account").upsert(newRecord);
        assert.ok(response.success);
    });
    it("should update existing record", async () => {
        let response = await conn.collection("Account").upsert(existingRecord);
        expect(response).eql("NO_CONTENT_RESPONSE");
    });
    it("should reject promise", async () => {
        try {
            await conn.collection("Account").upsert({
                Id: "error"
            });
        } catch (error){
            expect(error.message).to.eql("Invalid query operator");
        }
    });
});

/**
 * check if record exists
 */
describe("exists", () => {
    let existingRecord = "0012v00002YyUSPAA3";
    it("should return true", async () => {
        let response = await conn.collection("Account").exists(existingRecord);
        expect(response).eql(true);
    });
    it("shoculd return false", async () => {
        conn.collection("Account").exists("0012v00002YyUSQUP3").then(response => {
            expect(response).eql(false);
        });
    });
    it("should reject promise", async () => {
        try {
            await conn.collection("Account").exists("error");
        } catch (error){
            expect(error.message).to.eql("Invalid query operator");
        }
    });
});

/**
 * populateChild
 */
describe("populuate child", () => {
    let options = [
        [
            "Contact",
            "User"
        ],
        "Contact,User"
    ];
    it("should populate child > parent field", () => {

        options.forEach(option => {

            let object = conn.collection("Account").select("Id,Name").where("Site='Mumbai'").populateChild(option);

            expect(object._config.fields).to.eql(["Id", "Name", "Contact.name", "User.name"]);
        });
    });
});
/**
 * populateParent
 */
describe("populate parent", () => {
    it("should populate parent > child field", () => {
        let conditions = {
            child: {
                table: "Contact",
                field: "accountId"
            },
            parent: {
                field: "Id"
            }
        };
        let object = conn.collection("Account").select("Account.Name").joinTable([{ table: "Contact", fields: ["Name"] }]).populateParent(conditions);
        expect(object._config.innerjoin).to.eql(conditions);
    });
});

/**
 * joinTable
 */
describe("join table", () => {
    it("should populate fields", () => {
        let object = conn.collection("Contact").select("Id, Name").joinTable([{
            table: "Opportunity",
            fields: ["Id", "Amount"],
            condition: "where Opportunity.IsClosed=true"
        },
        ]).populateChild("Account");
        expect(object._config.fields).to.eql(["Id",
            "Name",
            "(Select Opportunity.Id,Opportunity.Amount FROM opportunities where Opportunity.IsClosed=true )",
            "Account.name"]);
    });
});

/**
 * run
 */
describe("run", () => {
    it("should return single record", async () => {
        let response = await conn.query("SELECT Id, Name FROM Account", {
            responseTarget: "SingleRecord"
        }).run();
        assert.ok(_.isObject(response));
    });

    it("should return multiple records", async () => {
        let response = await conn.query("SELECT Id, Name FROM Account", {
            responseTarget: "Records"
        }).run();
        assert.ok(response.length > 1);
        assert.ok(_.isObject(response));
    });


    it("should return count", async () => {
        let response = await conn.query("SELECT Id, Name FROM Account", {
            responseTarget: "Count"
        }).run();
        assert.ok(_.isNumber(response));
    });
});

after(async () => {
    await conn.logout();
});
