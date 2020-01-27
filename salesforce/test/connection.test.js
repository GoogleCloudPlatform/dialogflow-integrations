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

// const Connection = require("../lib/");
const Connection = require("./mock-request");
const _ = require("lodash/core");
const assert = require("chai").assert;
const expect = require("chai").expect;

/**
 * using query methods
 */
describe("query and collection method", () => {
    let conn = new Connection({ logLevel: "INFO" });

    const sObjects = [
        {
            "name": "Account",
            "fields": "Id,Name"
        },
        {
            "name": "Opportunity",
            "fields": "AccountId,Amount"
        },
        {
            "name": "Lead",
            "fields": "AnnualRevenue,City"
        }
    ];

    /**
     *  Query Objects
     */
    describe("query objects", () => {
        _.forEach(sObjects, (sObject) => {
            it(`${sObject.name} should return records`, async () => {
                let result = await conn.query(`SELECT ${sObject.fields} FROM ${sObject.name}`).run();
                assert.ok(_.isNumber(result.totalSize));
            });
        });
    });

    /**
     *  Query Objects using callback
     */
    describe("query objects using callback", () => {
        _.forEach(sObjects, (sObject) => {
            it(`${sObject.name} should return records`, async () => await conn.query(`SELECT ${sObject.fields} FROM ${sObject.name}`, (err, result) => {
                if (err) throw err;
                assert.ok(_.isNumber(result.totalSize));
            }));
        });
    });
    /**
     * get collection
     */
    describe("get collection", () => {
        it("should return collection object", () => {
            let response = conn.collection("Account");
            // eslint-disable-next-line no-underscore-dangle
            assert.ok(response._conn.collectionObjects["Account"]);
        });
    });
    /**
     * get collection details
     */
    describe("collection details", () => {
        it("should get collection details", () => {
            conn.getCollectionDetails("Account").then(response => {
                assert.ok(response.fields);
            });
        });
    });

    after(async () => {
    });
});

/**
 *  Login
 */
describe("login", () => {
    let conn;
    it("throw error wrong username,password,security token", async () => {
        conn = new Connection();
        try {
            await conn.login({
                username: "aseem.rohilla@quantiphi.com",
                password: "Quant1ph1",
                security_token: "G6oNrdswKsKwQRODdCPR1HA3s"
            });
        } catch (err){
            expect(err.message).equal("LOGIN_MUST_USE_SECURITY_TOKEN: Invalid username, password, security token; or user locked out. Are you at a new location? When accessing Salesforce--either via a desktop client or the API--from outside of your company’s trusted networks, you must add a security token to your password to log in. To get your new security token, log in to Salesforce. From your personal settings, enter Reset My Security Token in the Quick Find box, then select Reset My Security Token.");
        }
    });

    it("should login by username and password", () => {
        conn = new Connection();
        conn.login({
            username: "aseem.rohilla@quantiphi.com",
            password: "Quant1ph1",
            security_token: "G6oNrdswKsKwQRODdCPR1HA3s" }
            ).then(userInfo => {
                assert.ok(_.isString(conn.accessToken));
                assert.ok(_.isString(userInfo.id));
                assert.ok(_.isString(userInfo.organizationId));
                assert.ok(_.isString(userInfo.url));
            });
    });
});

/**
 *  Logout
 */

describe("logout", () => {
    let sessionInfo;
    it("should logout", () => {
        let conn = new Connection();
        conn.login({
            username: "aseem.rohilla@quantiphi.com",
            password: "Quant1ph1",
            security_token: "G6oNrdswKsKwQRODdCPR1HA3s" }
            ).then(userInfo => {
                sessionInfo = {
                    sessionId: conn.accessToken,
                    serverUrl: conn.instanceUrl,
                    userInfo: userInfo
                };
                conn.logout().then(() => {
                    assert.ok(_.isNull(sessionInfo.accessToken));
                    assert.ok(_.isNull(sessionInfo.userInfo));
                    assert.ok(_.isNull(sessionInfo.instanceUrl));
                });
            });
    });
});
