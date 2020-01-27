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
    // Create new feed
    const chatterResult = await conn.chatter().resource("feed-elements", {}).create({
        "body": {
            "messageSegments": [{
                "type": "Text",
                "text": "This is new post 2"
            }]
        },
        "feedElementType": "FeedItem",
        "subjectId": "me"
    });

    // Post a comment to a feed
    const result = await conn.chatter().resource("feed-elements/0D52v00008aAF4RCAW/capabilities/comments/items").create({
        "body": {
            "messageSegments": [{
                "type": "Text",
                "text": "Comment for post 2"
            }]
        }
    });

    // Get All feeds
    const chatterResult = await conn.chatter().resource("feeds/news/me/feed-elements").retrieve();
    chatterResult.elements.forEach(element => {
        console.log(element.body, element.id, "==");
    });
    console.log("result: ", chatterResult, result);
};
execute();
