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

const Logger = require("../lib/logger");
const expect = require("chai").expect;

describe("logger", () => {
    it("should set default log level", () => {
        let logger = new Logger();
        expect(logger._logLevel).to.eql(2);
    });

    let logLevels = [
        "DEBUG", "INFO", "WARN", "ERROR", "FATAL"
    ];
    logLevels.forEach((logLevel, idx) => {
        let logger = new Logger(logLevel);

        it(`should set correct level for ${logLevel}`, () => {
            expect(logger._logLevel).to.eql(idx + 1);
        });

        it(`should log message for ${logLevel}`, () => {
            logger.log(idx + 1, `Message for ${logLevel}`);
        });

        it(`should call correct function for loglevel ${idx + 1}`, () => {
            switch (idx + 1){
                case 1:
                    logger.debug("Some Message");
                    break;
                case 2:
                    logger.info("Some Message");
                    break;
                case 3:
                    logger.warn("Some Message");
                    break;
                case 4:
                    logger.error("Some Message");
                    break;
                case 5:
                    logger.fatal("Some Message");
                    break;
            }
        });
    });

});
