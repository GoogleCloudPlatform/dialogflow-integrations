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

const request = require("request-promise");
const Logger = require("./logger");
const Query = require("./query");
const Chatter = require("./chatter");
const { parseJSON, parseXML, parseText, esc } = require("./helper");

const defaults = {
    loginUrl: "https://login.salesforce.com",
    instanceUrl: "",
    version: "42.0"
};

/**
 * Connection class to cache the session info of the logged-in user
 * @public
 * @constructor
 * @param {Object} [options] - Connection options
 * @param {String} [options.logLevel] - Output logging level (DEBUG|INFO|WARN|ERROR|FATAL)
 * @param {String} [options.version] - Salesforce API Version (without "v" prefix)
 * @param {Number} [options.maxRequest] - Max number of requests allowed in parallel call
 * @param {String} [options.loginUrl] - Salesforce Login Server URL (e.g. https://login.salesforce.com/)
 * @param {String} [options.instanceUrl] - Salesforce Instance URL (instance of your Salesforce organization is on e.g. https://na1.salesforce.com/)
 * @param {String} [options.serverUrl] - Salesforce SOAP service endpoint URL (e.g. https://na1.salesforce.com/services/Soap/u/28.0)
 * @param {String} [options.sessionId] - Salesforce session ID
 */
class Connection {

    constructor(options) {
        this.options = options || {};
        this.logger = new Logger(this.options.logLevel);
        this.loginUrl = this.options.loginUrl || defaults.loginUrl;
        this.version = this.options.version || defaults.version;
        this.maxRequest = this.options.maxRequest || this.maxRequest || 10;
        this.initialize(this.options);
    }

    /**
     * Initialize connection.
     *
     * @protected
     * @param {Object} options - Initialization options
     * @param {String} [options.instanceUrl] - Salesforce Instance URL (e.g. https://na1.salesforce.com/)
     * @param {String} [options.serverUrl] - Salesforce SOAP service endpoint URL (e.g. https://na1.salesforce.com/services/Soap/u/28.0)
     * @param {String} [options.sessionId] - Salesforce session ID
     * @param {UserInfo} [options.userInfo] - Logged in user information
     */
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

    /**
     * Parse response body
     *  @protected
     */
    parseResponseBody(response) {
        let contentType = response.headers && response.headers["content-type"];
        let parseBody = /^(text|application)\/xml(;|$)/.test(contentType) ? parseXML
            : /^application\/json(;|$)/.test(contentType) ? parseJSON : parseText;
        try {
            return parseBody(response.body);
        } catch (e) {
            return response.body;
        }
    }

    /**
     * Get response body
     * @protected
     */
    getResponseBody(response) {
        if (response.statusCode === 204) {
            return "NO_CONTENT_RESPONSE";
        }
        let body = this.parseResponseBody(response);
        if (response.statusCode === 300) {
            let err = new Error("Multiple records found");
            err.name = "MULTIPLE_CHOICES";
            err.content = body;
            throw err;
        }
        return body;
    }

    /**
     * Gives base url
     * @public
     */
    baseUrl() {
        return [this.instanceUrl, "services/data", "v" + this.version].join("/");
    }

    /**
     * Make HTTP Request call with authorization scopes of the current logged-in session
     * @public
     * @param {String|Object} options - HTTP request object or URL to GET request
     * @param {String} options.method - HTTP method URL to send HTTP request
     * @param {String} options.url - URL to send HTTP request
     * @param {Object} [options.headers] - HTTP request headers in hash object (key-value)
     * @returns {Promise.<Object>}
     */
    request(options) {
        if (typeof (options) === "string") {
            options = { method: "GET", url: request };
        }
        if (options.url[0] === "/") {
            if (options.url.indexOf("/services/") === 0) {
                options.url = this.instanceUrl + options.url;
            } else {
                options.url = this.baseUrl() + options.url;
            }
        }
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
        let requestTime = Date.now();

        return request(options)
            .then((response) => {
                let responseTime = Date.now();
                this.logger.debug("elappsed time : " + (responseTime - requestTime) + "msec");
                this.logger.debug("<response> status=" + response.statusCode + ", url=" + request.url);
                return this.getResponseBody(response);
            })
            .catch((error) => {
                let responseTime = Date.now();
                this.logger.debug("elappsed time : " + (responseTime - requestTime) + "msec");
                this.logger.error(error);
                let err = new Error(error.message);
                err.name = error.errorCode;
                for (let key in error) { err[key] = error[key]; }
                throw err;
            });
    }

    /**
    * Login by SOAP web service API
    * @public
    * @param {Object} options - Salesforce connection object
    * @param {String} options.username - Salesforce password (and security token, if required)
    * @param {String} options.password - Salesforce password (and security token, if required)
    * @param {String} options.security_token - Salesforce Security Token
    * @returns {Promise.<UserInfo>}
    */
    login(options) {
        let body = [
            "<se:Envelope xmlns:se='http://schemas.xmlsoap.org/soap/envelope/'>",
            "<se:Header/>",
            "<se:Body>",
            "<login xmlns='urn:partner.soap.sforce.com'>",
            "<username>" + esc(options.username) + "</username>",
            "<password>" + esc([options.password, options.security_token].join("")) + "</password>",
            "</login>",
            "</se:Body>",
            "</se:Envelope>"
        ].join("");

        let soapLoginEndpoint = [this.loginUrl, "services/Soap/u", this.version].join("/");

        return request({
            method: "POST",
            url: soapLoginEndpoint,
            body: body,
            headers: {
                "Content-Type": "text/xml",
                "SOAPAction": '""'
            },
            resolveWithFullResponse: true
        }).then((response) => {
            this.logger.debug("SOAP response = " + response.body);
            let parsedResponse = parseXML(response.body);
            let responseBody = parsedResponse["soapenv:Envelope"]["soapenv:Body"];
            let { serverUrl, sessionId, userId, userInfo: { organizationId } } = responseBody.loginResponse.result;
            let idUrl = soapLoginEndpoint.split("/").slice(0, 3).join("/") + "/id/" + organizationId + "/" + userId;
            let userInfo = {
                id: userId,
                organizationId: organizationId,
                url: idUrl
            };
            this.initialize({
                serverUrl: serverUrl.split("/").slice(0, 3).join("/"),
                sessionId: sessionId,
                userInfo: userInfo
            });
            this.logger.debug("<login> completed. user id = " + userId + ", org id = " + organizationId);
            return userInfo;

        })
            .catch(err => {
                this.logger.debug("<login> error. error details = " + err);
                const error = err.error.match(/<faultstring>([^<]+)<\/faultstring>/);
                const faultstring = error && error[1];
                throw new Error(faultstring || err.message);
            });
    }

    /**
     * Logout the session by using SOAP web service API
     * @public
     * @returns {Promise}
     */
    logout() {
        let body = [
            "<se:Envelope xmlns:se='http://schemas.xmlsoap.org/soap/envelope/'>",
            "<se:Header>",
            "<SessionHeader xmlns='urn:partner.soap.sforce.com'>",
            "<sessionId>" + esc(this.accessToken) + "</sessionId>",
            "</SessionHeader>",
            "</se:Header>",
            "<se:Body>",
            "<logout xmlns='urn:partner.soap.sforce.com'/>",
            "</se:Body>",
            "</se:Envelope>"
        ].join("");

        return request({
            method: "POST",
            url: [this.instanceUrl, "services/Soap/u", this.version].join("/"),
            body: body,
            headers: {
                "Content-Type": "text/xml",
                "SOAPAction": '""'
            },
            resolveWithFullResponse: true
        }).then((response) => {
            this.logger.debug("SOAP statusCode = " + response.statusCode + ", response = " + response.body);

            this.accessToken = null;
            this.userInfo = null;
            this.instanceUrl = null;

            return undefined;

        }).catch(err => { throw new Error(err); });
    }

    /**
     * Execute query by using SOQL
     * @public
     * @param {String} soql - SOQL string
     * @param {Object} [options] - Query options
     * @param {Object} [options.headers] - Additional HTTP request headers sent in query request
     * @param {Callback.<QueryResult>} [callback] - Callback function
     * @returns {Query.<QueryResult>}
     */
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

    /**Collection - Accepts table name as input and passses it on to Query as config.table
     * @public
     * @param {String} name
     */
    collection(name) {
        if (!this.collectionObjects[name]) {
            this.collectionObjects[name] = new Query(this, { table: name }, {});
        }
        return this.collectionObjects[name];
    }

    /**
     * Return the definition of the collection.
     * @public
     * @param {String} name Name of the table/collection.
     * @returns {Object} Collection Instance.
     */
    getCollectionDetails(name) {
        return this.request({
            url: `${this.baseUrl()}/sobjects/${name}/describe`,
            method: "GET",
            json: true
        });
    }

    /**
     * Chatter- Passes the instance of connection to chatter
     * @public
     */
    chatter() {
        return new Chatter(this, {});
    }
}

module.exports = Connection;

