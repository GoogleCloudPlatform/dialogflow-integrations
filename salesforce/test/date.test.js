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

const SalesforceDate = require("../lib/date");
const expect = require("chai").expect;

describe("salesforce date methods", () => {
    let sfdt = new SalesforceDate();

    /**
     *  toJSON()
     */
    it("should convert to json", () => {
        let sfdtTemp = new SalesforceDate(3000);
        expect(sfdtTemp.toJSON()).eql(3000);
    });
    /**
     * toDateLiteral
     */
    it("should convert date to literal format", () => {
        let date = sfdt.toDateLiteral(1288958400000);
        expect(date instanceof SalesforceDate).to.eql(true);
        expect(date._literal).to.eql("2010-11-05");
        expect(sfdt.toDateLiteral("2010-11-05")._literal).to.eql("2010-11-05");
    });

    /**
     * toDateTimeLiteral
     */
    it("should convert string to date time literal", () => {
        let date = sfdt.toDateTimeLiteral("2010-11-02T04:45:04+09:00");
        let date1 = sfdt.toDateTimeLiteral("2010-11-02T04:45:04.123+09:00");
        expect(date instanceof SalesforceDate).to.eql(true);
        expect(date).to.eql({ _literal: "2010-11-01T19:45:04Z" });
    });
    it("should convert number to date time literal", () => {
        let date = sfdt.toDateTimeLiteral(1288958400000);
        expect(date instanceof SalesforceDate).to.eql(true);
        expect(date).to.eql({ _literal: "2010-11-05T12:00:00Z" });
    });
    /**
     * invalid format
     */
    it("should return error", () => {
        try {
            sfdt.parseDate("hello");
        } catch (error){
            expect(error.message).equal("Invalid date format is specified : hello");
        }
    });
});
