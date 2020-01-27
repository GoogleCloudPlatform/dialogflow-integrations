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

const Connection = require("../lib/");

const execute = async () => {
    const conn = new Connection({ logLevel: "INFO" });
    await conn.login({
        username: "john@demo.com",
        password: "*******",
        security_token: "G6oNrdsw***********"
    });
    const queryResult = await conn.query("SELECT ID,NAME from ACCOUNT").run();
    console.log("Result : ", queryResult);
    await conn.logout();
};
execute();
