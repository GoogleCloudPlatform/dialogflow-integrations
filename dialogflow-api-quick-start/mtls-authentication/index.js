
/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()

app.get('/', (req, res) => res.send('online'))
app.post('/fulfillment', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome () {
    agent.add('Welcome to my mTLS secured agent!')
  }

  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 3000)
