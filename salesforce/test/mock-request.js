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

const Logger = require("./../lib/logger");
// const { parseJSON, parseXML, parseText } = require("./../lib/helper");
const Query = require("./../lib/query");
const Chatter = require("../lib/chatter");

const defaults = {
    loginUrl: "https://login.salesforce.com",
    instanceUrl: "",
    version: "42.0"
};

class MockConnection {
    constructor(options) {
        this.options = options || {};
        this.logger = new Logger(this.options.logLevel);
        this.loginUrl = this.options.loginUrl || defaults.loginUrl;
        this.version = this.options.version || defaults.version;
        this.maxRequest = this.options.maxRequest || this.maxRequest || 10;
        this.initialize(this.options);
    }
    initialize(options) {
        if (!options.instanceUrl && options.serverUrl) {
            options.instanceUrl = options.serverUrl.split("/").slice(0, 3).join("/");
        }
        if (options.userInfo) {
            this.userInfo = options.userInfo;
        }
        this.instanceUrl = options.instanceUrl || options.serverUrl || this.instanceUrl || defaults.instanceUrl;
        this.accessToken = options.sessionId || this.accessToken;
        this.collectionObjects = {};
    }
    login(options){
        options = { "id": "0052v00000eUPATAA4", "organizationId": "00D2v000002F1U7EAK", "url": "https://login.salesforce.com/id/00D2v000002F1U7EAK/0052v00000eUPATAA4" };
        return Promise.resolve(options);
    }
    logout(options){
        return Promise.resolve(options);
    }
    getCollectionDetails(name) {
        return this.request({
            url: `${this.baseUrl()}/sobjects/${name}/describe`,
            method: "GET",
            json: true
        });
    }

    baseUrl() {
        return [this.instanceUrl, "services/data", "v" + this.version].join("/");
    }

    request(options) {
        // if options is simple string, regard it as url in GET method
        if (typeof (options) === "string") {
            // options = { method: "GET", url: request };
        }
        // if url is given in relative path, prepend base url or instance url before.
        if (options.url[0] === "/") {
            if (options.url.indexOf("/services/") === 0) {
                options.url = this.instanceUrl + options.url;
            } else {
                options.url = this.baseUrl() + options.url;
            }
        }
        // set headers & add authorization token
        options.headers = options.headers || {};
        if (this.accessToken) {
            options.headers.Authorization = "Bearer " + this.accessToken;
        }
        if (this.callOptions) {
            let callOptions = [];
            for (let name in this.callOptions) {
                callOptions.push(name + "=" + this.callOptions[name]);
            }
            options.headers["Sforce-Call-Options"] = callOptions.join(", ");
        }
        options.resolveWithFullResponse = true;

        this.logger.debug("<request> method=" + options.method + ", url=" + options.url);
        return Promise.resolve(this.mockResponseGenerator(options));
    }
    query(soql, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = undefined;
        }
        const query = new Query(this, soql, options);
        if (callback) {
            return query.run({})
                .then((response) => {
                    callback(null, response);
                });
        }
        return query;
    }
    collection(name) {
        if (!this.collectionObjects[name]) {
            this.collectionObjects[name] = new Query(this, { table: name }, {});
        }
        return this.collectionObjects[name];
    }

    chatter() {
        return new Chatter(this, {});
    }

    mockResponseGenerator(options) {
        let resObj = {};
        let url = options.url.split("/");
        let temp = url[url.length - 1].split("?");
        temp = temp[0];
        url[url.length - 1] = temp;
        switch (options.method){
            case "GET":{
                if (url.includes("chatter")) {
                    if (url[url.length - 1] === ""){
                        // chatter info
                        resObj = { extensions: "/services/data/v42.0/chatter/extensions",
                            feeds: "/services/data/v42.0/chatter/feeds",
                            groups: "/services/data/v42.0/chatter/groups",
                            streams: "/services/data/v42.0/chatter/streams",
                            users: "/services/data/v42.0/chatter/users"
                        };
                    } else if (url.includes("users")) {
                        if (options.url.includes("include=")){
                            resObj = {
                                "aboutMe": "Salesforce Administrator and Citizen Developer",
                                "address": {
                                    "city": "San Francisco",
                                    "country": "US",
                                    "formattedAddress": "1 Market St\nSan Francisco, CA 94105\nUS",
                                    "state": "CA",
                                    "street": "1 Market St",
                                    "zip": "94105"
                                }
                            };
                        } else if (url.includes("me")){
                            resObj = { aboutMe: null,
                                additionalLabel: null,
                                address:
                                { city: null,
                                    country: "IN",
                                    formattedAddress: "IN",
                                    state: null,
                                    street: null,
                                    zip: null },
                                bannerPhoto:
                                { bannerPhotoUrl: "https://c.ap15.content.force.com/profilephoto/005/B",
                                    bannerPhotoVersionId: null,
                                    url:
                                    "/services/data/v42.0/connect/user-profiles/0052v00000eUPATAA4/banner-photo" },
                                chatterActivity:
                                { commentCount: 12,
                                    commentReceivedCount: 0,
                                    likeReceivedCount: 0,
                                    postCount: 28 },
                                chatterInfluence: { percentile: "0.0", rank: 1 },
                                communityNickname: "aseem.rohilla",
                                companyName: "aseem rohilla",
                                displayName: "Aseem Rohilla",
                                email: "aseem.rohilla@quantiphi.com",
                                firstName: "Aseem",
                                followersCount: 0,
                                followingCounts: { people: 0, records: 0, total: 0 },
                                groupCount: 1,
                                hasChatter: true,
                                id: "0052v00000eUPATAA4",
                                isActive: true,
                                isInThisCommunity: true,
                                lastName: "Rohilla",
                                mySubscription: null,
                                name: "Aseem Rohilla",
                                outOfOffice: { message: "" },
                                phoneNumbers:
                                [{ label: "Mobile",
                                    phoneNumber: "+91 8097669594",
                                    phoneType: "Mobile" }],
                                photo: { },
                                reputation: null,
                                stamps: [],
                                thanksReceived: null,
                                title: null,
                                type: "User",
                                url: "/services/data/v42.0/chatter/users/0052v00000eUPATAA4",
                                userType: "Internal",
                                username: "aseem.rohilla@quantiphi.com" };
                        } else {
                            resObj = { currentPageToken: 0,
                                currentPageUrl: "/services/data/v42.0/chatter/users",
                                nextPageToken: null,
                                nextPageUrl: null,
                                previousPageToken: null,
                                previousPageUrl: null,
                                users:
                                [{ aboutMe: null,
                                    additionalLabel: null,
                                    address: [Object],
                                    bannerPhoto: [Object],
                                    chatterActivity: [Object],
                                    chatterInfluence: [Object],
                                    communityNickname: "aseem.rohilla",
                                    companyName: "aseem rohilla",
                                    displayName: "Aseem Rohilla",
                                    email: "aseem.rohilla@quantiphi.com",
                                    firstName: "Aseem",
                                    followersCount: 0,
                                    followingCounts: [Object],
                                    groupCount: 1,
                                    hasChatter: true,
                                    id: "0052v00000eUPATAA4",
                                    isActive: true,
                                    isInThisCommunity: true,
                                    lastName: "Rohilla",
                                    managerId: null,
                                    managerName: null,
                                    motif: [Object],
                                    mySubscription: null,
                                    name: "Aseem Rohilla",
                                    outOfOffice: [Object],
                                    phoneNumbers: [Array],
                                    photo: [Object],
                                    reputation: null,
                                    stamps: [],
                                    thanksReceived: null,
                                    title: null,
                                    type: "User",
                                    url: "/services/data/v42.0/chatter/users/0052v00000eUPATAA4",
                                    userType: "Internal",
                                    username: "aseem.rohilla@quantiphi.com" },
                                ] };
                        }

                    } else {
                        resObj = {
                            currentPageToken: null,
                            currentPageUrl:
                             "/services/data/v42.0/chatter/feeds/record/0052v00000eUPATAA4/feed-elements",
                            elements:
                            [{ actor: [Object],
                                body: [Object],
                                capabilities: [Object],
                                clientInfo: null,
                                createdDate: "2019-10-22T10:03:41.000Z",
                                event: false,
                                feedElementType: "FeedItem",
                                hasVerifiedComment: false,
                                header: [Object],
                                id: "0D52v00008bhunjCAA",
                                isDeleteRestricted: true,
                                isSharable: true,
                                modifiedDate: "2019-10-22T10:03:41.000Z",
                                originalFeedItem: null,
                                originalFeedItemActor: null,
                                parent: [Object],
                                photoUrl: "https://c.ap15.content.force.com/profilephoto/005/T",
                                relativeCreatedDate: "1h ago",
                                type: "CollaborationGroupCreated",
                                url:
                                  "/services/data/v42.0/chatter/feed-elements/0D52v00008bhunjCAA",
                                visibility: "AllUsers" },
                            ],
                            isModifiedToken: null,
                            isModifiedUrl: null,
                            nextPageToken: null,
                            nextPageUrl: null,
                            updatesToken: "2:1571738621000",
                            updatesUrl:
                             "/services/data/v42.0/chatter/feeds/record/0052v00000eUPATAA4/feed-elements?updatedSince=2%3A1571738621000"
                        };
                    }
                } else {
                    if (url.includes("query")) {
                        let id = options.url.split("\'")[1];
                        if (id == ""){
                            throw new Error("No such Id exists");
                        } else if (id == "0012v00002YyUSQUP3"){
                            // exists false condition
                            resObj = {
                                totalSize: 0,
                                done: true,
                                fields: [{
                                    name: "Id"
                                }, {
                                    name: "Name"
                                }],
                                records: []
                            };
                        } else if (id === "error"){
                            throw new Error("Invalid query operator");
                        } else {
                            resObj = {
                                totalSize: 1,
                                done: true,
                                fields: [{
                                    name: "Id"
                                }, {
                                    name: "Name"
                                }],
                                records: [{ attributes:
                                { type: "Account",
                                    url: "/services/data/v42.0/sobjects/Account/0012v00002ZpRoiAAF" },
                                    Id: "0012v00002ZpRoiAAF",
                                    IsDeleted: false,
                                    MasterRecordId: null,
                                    Name: "Upsert Computing",
                                    Type: null,
                                    ParentId: null,
                                    BillingStreet: null,
                                    BillingCity: null,
                                    BillingState: null,
                                    BillingPostalCode: null,
                                    BillingCountry: null,
                                    BillingLatitude: null,
                                    BillingLongitude: null,
                                    BillingGeocodeAccuracy: null,
                                    BillingAddress: null,
                                    ShippingStreet: null,
                                    ShippingCity: null,
                                    ShippingState: null,
                                    ShippingPostalCode: null,
                                    ShippingCountry: null,
                                    ShippingLatitude: null,
                                    ShippingLongitude: null,
                                    ShippingGeocodeAccuracy: null,
                                    ShippingAddress: null,
                                    Phone: null,
                                    Fax: null,
                                    AccountNumber: null,
                                    Website: null,
                                    PhotoUrl: "/services/images/photo/0012v00002ZpRoiAAF",
                                    Sic: null,
                                    Industry: null,
                                    AnnualRevenue: null,
                                    NumberOfEmployees: 100,
                                    Ownership: null,
                                    TickerSymbol: null,
                                    Description: null,
                                    Rating: null,
                                    Site: null,
                                    OwnerId: "0052v00000eUPATAA4",
                                    CreatedDate: "2019-10-18T12:35:02.000+0000",
                                    CreatedById: "0052v00000eUPATAA4",
                                    LastModifiedDate: "2019-10-18T13:20:53.000+0000",
                                    LastModifiedById: "0052v00000eUPATAA4",
                                    SystemModstamp: "2019-10-18T13:20:53.000+0000",
                                    LastActivityDate: null,
                                    LastViewedDate: "2019-10-18T13:20:53.000+0000",
                                    LastReferencedDate: "2019-10-18T13:20:53.000+0000",
                                    Jigsaw: null,
                                    JigsawCompanyId: null,
                                    CleanStatus: "Pending",
                                    AccountSource: null,
                                    DunsNumber: null,
                                    Tradestyle: null,
                                    NaicsCode: null,
                                    NaicsDesc: null,
                                    YearStarted: null,
                                    SicDesc: null,
                                    DandbCompanyId: null,
                                    CustomerPriority__c: null,
                                    SLA__c: null,
                                    Active__c: null,
                                    NumberofLocations__c: null,
                                    UpsellOpportunity__c: null,
                                    SLASerialNumber__c: null,
                                    SLAExpirationDate__c: null },
                                { attributes:
                                { type: "Account",
                                    url: "/services/data/v42.0/sobjects/Account/0012v00002Zr4uPAAR" },
                                    Id: "0012v00002Zr4uPAAR",
                                    IsDeleted: false,
                                    MasterRecordId: null,
                                    Name: "Test",
                                    Type: null,
                                    ParentId: null,
                                    BillingStreet: null,
                                    BillingCity: "San Francisco",
                                    BillingState: null,
                                    BillingPostalCode: null,
                                    BillingCountry: null,
                                    BillingLatitude: null,
                                    BillingLongitude: null,
                                    BillingGeocodeAccuracy: null,
                                    BillingAddress:
                                    { city: "San Francisco",
                                        country: null,
                                        geocodeAccuracy: null,
                                        latitude: null,
                                        longitude: null,
                                        postalCode: null,
                                        state: null,
                                        street: null },
                                    ShippingStreet: null,
                                    ShippingCity: null,
                                    ShippingState: null,
                                    ShippingPostalCode: null,
                                    ShippingCountry: null,
                                    ShippingLatitude: null,
                                    ShippingLongitude: null,
                                    ShippingGeocodeAccuracy: null,
                                    ShippingAddress: null,
                                    Phone: "(415)555-1212",
                                    Fax: null,
                                    AccountNumber: null,
                                    Website: null,
                                    PhotoUrl: "/services/images/photo/0012v00002Zr4uPAAR",
                                    Sic: null,
                                    Industry: null,
                                    AnnualRevenue: null,
                                    NumberOfEmployees: 50,
                                    Ownership: null,
                                    TickerSymbol: null,
                                    Description: null,
                                    Rating: null,
                                    Site: null,
                                    OwnerId: "0052v00000eUPATAA4",
                                    CreatedDate: "2019-10-22T07:18:33.000+0000",
                                    CreatedById: "0052v00000eUPATAA4",
                                    LastModifiedDate: "2019-10-22T07:18:33.000+0000",
                                    LastModifiedById: "0052v00000eUPATAA4",
                                    SystemModstamp: "2019-10-22T07:18:33.000+0000",
                                    LastActivityDate: null,
                                    LastViewedDate: "2019-10-22T09:27:52.000+0000",
                                    LastReferencedDate: "2019-10-22T09:27:52.000+0000",
                                    Jigsaw: null,
                                    JigsawCompanyId: null,
                                    CleanStatus: "Pending",
                                    AccountSource: null,
                                    DunsNumber: null,
                                    Tradestyle: null,
                                    NaicsCode: null,
                                    NaicsDesc: null,
                                    YearStarted: null,
                                    SicDesc: null,
                                    DandbCompanyId: null,
                                    CustomerPriority__c: null,
                                    SLA__c: null,
                                    Active__c: null,
                                    NumberofLocations__c: null,
                                    UpsellOpportunity__c: null,
                                    SLASerialNumber__c: null,
                                    SLAExpirationDate__c: null }]
                            };
                        }

                    }
                }
                break;
            }
            case "POST":{
                if (url.includes("chatter")) {
                    resObj = { actor: {
                        additionalLabel: null,
                        communityNickname: "aseem.rohilla",
                        companyName: "aseem rohilla",
                        displayName: "Aseem Rohilla",
                        firstName: "Aseem",
                        id: "0052v00000eUPATAA4",
                        isActive: true,
                        isInThisCommunity: true,
                        lastName: "Rohilla",
                        mySubscription: null,
                        name: "Aseem Rohilla",
                        outOfOffice: { message: "" }
                    },
                        body:
                        { isRichText: false,
                            messageSegments: [[Object]],
                            text: "When should we meet for release planning?" },
                        capabilities: {},
                        parent:
                        { additionalLabel: null,
                            announcement: null,
                            canHaveChatterGuests: false,
                            community: null,
                            description: null,
                            emailToChatterAddress:
                           "0F92v000000YRsYCAW@post.2v-2f1u7eak.ap15.chatter.salesforce.com",
                            id: "0F92v000000YRsYCAW",
                            isArchived: false,
                            isAutoArchiveDisabled: false,
                            isBroadcast: false,
                            lastFeedElementPostDate: "2019-10-23T05:53:15.000Z",
                            memberCount: 1,
                            mySubscription:
                            { id: "0FB2v000002yJm1GAE",
                                url:
                              "/services/data/v42.0/chatter/group-memberships/0FB2v000002yJm1GAE" },
                            name: "Test Group",
                            type: "CollaborationGroup",
                            url: "/services/data/v42.0/chatter/groups/0F92v000000YRsYCAW",
                            visibility: "PublicAccess" },
                        photoUrl: "https://c.ap15.content.force.com/profilephoto/005/T",
                        relativeCreatedDate: "Just now",
                        type: "TextPost",
                        url:
                        "/services/data/v42.0/chatter/feed-elements/0D52v00008biuyLCAQ",
                        visibility: "AllUsers"
                    };
                } else {
                    resObj = { id: "0012v00002ZpMLvAAN", success: true, errors: [] };
                }
                break;
            }
            case "PATCH":{
                resObj = "NO_CONTENT_RESPONSE";
                break;
            } case "DELETE":{
                resObj = "NO_CONTENT_RESPONSE";
                break;
            }
            default:
                throw new Error("request error");
        }
        return resObj;
    }
}
module.exports = MockConnection;
