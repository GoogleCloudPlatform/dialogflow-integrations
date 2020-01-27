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

const helper = require("../lib/helper");
const expect = require("chai").expect;

describe("helper methods", () => {
    /**
     * parseJSON()
     */
    it("should parse json", () => {
        let testString = '{ "name":"John", "age":30, "city":"New York"}';

        expect(helper.parseJSON(testString)).to.eql(JSON.parse(testString));
    });

    /**
     * parse text
     */
    it("should return str", () => {
        expect(helper.parseText("test string")).to.eql("test string");
    });
    /**
     * esc()
     */
    it("should remove special chars", () => {
        let testString = "This & text < has > special characters";

        expect(helper.esc(testString)).to.eql("This &amp; text &lt; has &gt; special characters");
    });

    /**
     * parseXML
     */
    it("should parse string to xml", () => {
        let testString = "<root>Hello xml2js!</root>";
        expect(helper.parseXML(testString)).to.eql({ root: "Hello xml2js!" });
    });
    it("should return error for wrong xml", () => {
        let testString = "<root><parent>Hello xml2js!";
        try {
            helper.parseXML(testString);
        } catch (err){
            expect(err.message).equal("Unclosed root tag\nLine: 0\nColumn: 27\nChar: ");
        }
    });

    /**
     *  isArray check true/false condition
     */
    it("should check isArray successfully", () => {
        expect(helper.isArray([1, 2, 3, 4])).to.eql(true);
        expect(helper.isArray({
            "key": "value"
        })).to.eql(false);
    });

    /**
     * escape string
     */
    it("should escape string", () => {
        let testString = "this 'is' a 'test' string";
        expect(helper.escapeString(testString)).to.eql("this \\'is\\' a \\'test\\' string");
    });
});
