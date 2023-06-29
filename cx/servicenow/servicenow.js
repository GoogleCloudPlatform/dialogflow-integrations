/**
 * Copyright 2023 Google Inc. All Rights Reserved.
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

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var requestData = request.body.data;
  var tag = requestData.fulfillmentInfo.tag;
  var parameters = requestData.sessionInfo.parameters;

  var responseMessage = '';

  // create a new ticket
  if (tag == 'create') {
    var username = parameters.username + '';
    var description = parameters.description + '';

    var incidentData = new GlideRecord('incident');
    incidentData.initialize();
    incidentData.short_description = description;
    incidentData.caller_id.setDisplayValue(username);
    incidentData.insert();

    responseMessage = 'Ticket number ' + incidentData.number + ' has been created.';
  }

  // get status of ticket
  if (tag == 'status') {
    var incidentNumber = parameters.number + '';

    var incidentData = new GlideRecord('incident');
    incidentData.addQuery('number', 'ENDSWITH', incidentNumber);
    incidentData.query();
    if (incidentData.next()) {
      var assigned_to;
      if (incidentData.assigned_to) {
        assigned_to = incidentData.getDisplayValue('assigned_to');
      } else {
        assigned_to = 'no one';
      }
      responseMessage = 'Incident ' + incidentData.number + ' is currently assigned to ' + assigned_to + '. Current state of the incident is "' + incidentData.getDisplayValue('state') + '". This incident was last updated by ' + incidentData.sys_updated_by + ' on ' + incidentData.sys_updated_on + '. If you would like, you can ask for the update from ' + assigned_to + ' by updating additional comments.';
    } else {
      responseMessage = 'Could not find an incident with the number ' + incidentNumber;
    }
  }

  response.setContentType('application/json');
  response.setStatus(200);

  // https://cloud.google.com/dialogflow/cx/docs/reference/rest/v3/Fulfillment#ResponseMessage
  var response_body = {
    'fulfillmentResponse': {
      'messages': [
        {
          'text': {
            'text': [
              responseMessage
            ]
          }
        }
      ]
    }
  };

  var writer = response.getStreamWriter();
  writer.writeString(JSON.stringify(response_body));
})(request, response);
