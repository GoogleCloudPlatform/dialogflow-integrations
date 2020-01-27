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

const Connection = require("./mock-request");
const _ = require("lodash/core");
const assert = require("chai").assert;
const expect = require("chai").expect;

let conn = new Connection({ logLevel: "INFO" });

before(async () => {
    await conn.login({
        username: "aseem.rohilla@quantiphi.com",
        password: "Quant1ph1",
        security_token: "G6oNrdswKsKwQRODdCPR1HA3s"
    });
});

/**
 * base url https://instance_name/services/data/v47.0/chatter/
 */
describe("chatter api info", () => {
    it("should get chatter api info", async () => {
        let response = await conn.chatter().resource().retrieve();
        assert.ok(_.isString(response.users));
        assert.ok(_.isString(response.groups));
        assert.ok(_.isString(response.feeds));
        assert.ok(_.isString(response.streams));
        assert.ok(_.isString(response.extensions));
    });
});

/**
 * get users info https://instance_name/services/data/v47.0/chatter/users
 */
describe("users", () => {
    it("should get users list", async () => {
        let response = await conn.chatter().resource("users").retrieve();
        assert.ok(_.isString(response.currentPageUrl));
        assert.ok(_.isArray(response.users));
        _.forEach(response.users, (user) => {
            assert.ok(_.isString(user.id));
            assert.ok(_.isString(user.url) && user.url[0] === "/");
            assert.ok(_.isString(user.username));
        });
    });

    it("should get current user info", async () => {
        let response = await conn.chatter().resource("users/me").retrieve();
        assert.ok(_.isString(response.id));
        assert.ok(_.isString(response.url) && response.url[0] === "/");
        assert.ok(_.isString(response.username));
    });
});

/**
 * query feed elements
 */
describe("feed-elements", () => {
    it("should return feed-elements", async () => {

        const response = await conn.chatter().resource("feed-elements", {
            q: "chat*"
        }).retrieve();
        assert.ok(_.isArray(response.elements));
        assert.property(response, "currentPageToken");
        assert.property(response, "currentPageUrl");
        assert.property(response, "isModifiedToken");
        assert.property(response, "isModifiedUrl");
        assert.property(response, "nextPageUrl");
        assert.property(response, "updatesToken");
        assert.property(response, "updatesUrl");
    });

    it("should include specific properties", async () => {
        const response = await conn.chatter().resource("users/me", {
            include: ["aboutMe", "address"]
        }).retrieve();
        expect(Object.keys(response).length).to.equal(2);
        assert.property(response, "aboutMe");
        assert.property(response, "address");
    });
});

/**
 *  get user profile by id
 */
describe("profile", () => {
    it("should return another users feed", async () => {
        const response = await conn.chatter().profile("0052v00000eUPATAA4").retrieve();
        response.elements.forEach(element => assert.ok(_.isString(element.feedElementType)));
    });
});

/**
 * get my feeds
 */
describe("myFeeds", () => {
    it("should return my news feed", async () => {
        let response = await conn.chatter().myFeeds().retrieve();
        assert.ok(_.isArray(response.elements));
        assert.property(response, "currentPageToken");
        assert.property(response, "currentPageUrl");
        assert.property(response, "isModifiedToken");
        assert.property(response, "isModifiedUrl");
        assert.property(response, "nextPageUrl");
        assert.property(response, "updatesToken");
        assert.property(response, "updatesUrl");
    });
});
/**
 * get feeds of user
 */
describe("feeds", () => {
    it("should return feeds of user", async () => {
        let response = await conn.chatter().feeds("0052v00000eUPATAA4").retrieve();
        assert.ok(_.isArray(response.elements));
        assert.property(response, "currentPageToken");
        assert.property(response, "currentPageUrl");
        assert.property(response, "isModifiedToken");
        assert.property(response, "isModifiedUrl");
        assert.property(response, "nextPageUrl");
        assert.property(response, "updatesToken");
        assert.property(response, "updatesUrl");
    });
});

/**
 * create new feed item
 */
describe("create", () => {
    it("should post new feed item", async () => {
        const response = await conn.chatter().resource("feed-elements").create({
            "body": {
                "messageSegments": [
                    {
                        "type": "Text",
                        "text": "When should we meet for release planning? "
                    }]
            },
            "feedElementType": "FeedItem",
            "subjectId": "0F92v000000YRsYCAW"
        });
        expect(response.parent.id).to.equal("0F92v000000YRsYCAW");
    });
});
