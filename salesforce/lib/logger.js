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

/**
 * @class
 * @protected
 * @constructor
 * @param {String|Number} logLevel - Log level
 */
class Logger {
    constructor(logLevel) {
        this.LogLevels = {
            "DEBUG": 1,
            "INFO": 2,
            "WARN": 3,
            "ERROR": 4,
            "FATAL": 5
        };
        this._logLevel;
        if (!logLevel) {
            this._logLevel = this.LogLevels.INFO;
        }
        if (typeof logLevel === "string") {
            this._logLevel = this.LogLevels[logLevel];
        }
    }

    /**
     * Log message with defined debug level
     * @private
     * @param {String} level
     * @param {String|Object} message
     */
    log(level, message) {
        if (this._logLevel <= level) {
            if (level < this.LogLevels.ERROR) {
                console.log(message);
            } else {
                console.error(message);
            }
        }
    }

    /**
     * Log debug
     * @private
     * @param {String|Object} message
     */
    debug(message) {
        this.log(1, message);
    }

    /**
     * Log information messages
     * @private
     * @param {String|Object} message
     */
    info(message) {
        this.log(2, message);
    }

    /**
     * Log warning messages
     * @private
     * @param {String|Object} message
     */
    warn(message) {
        this.log(3, message);
    }

    /**
     * Log error messages
     * @private
     * @param {String|Object} message
     */
    error(message) {
        this.log(4, message);
    }

    /**
     * Logs fatal messages
     * @private
     * @param {String|Object} message
     */
    fatal(message) {
        this.log(5, message);
    }

}

module.exports = Logger;
