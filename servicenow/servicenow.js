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

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {        

  var writer = response.getStreamWriter();
  hdrs = {};
  var requestData=request.body.data;
  var state='';
  var assigned_to='';
  var context='';
  var message='';
  data={};

//create a new ticket
  if(requestData.queryResult.intent.displayName=='incident.create.details') {                                
     var username=requestData.queryResult.parameters.username + "";
     var description=requestData.queryResult.parameters.description + "";
     var incidentData = new GlideRecord("incident");
     incidentData.initialize();
     incidentData.short_description = description; 
     incidentData.caller_id.setDisplayValue(username); 
     incidentData.insert();
                                        
     message="Ticket number "+incidentData.number+" has been created.";
     
     context='success';
  }
  
   //get status of ticket
   if(requestData.queryResult.intent.displayName=='incident.status.number'){                                
      var numbers=requestData.queryResult.parameters.number + "";
      var incidentData = new GlideRecord("incident");
      incidentData.addQuery("number",'ENDSWITH', numbers);
      incidentData.query();
         if (incidentData.next()) {
             if(incidentData.assigned_to!='') {
                assigned_to=incidentData.getDisplayValue('assigned_to');
             } else {
                assigned_to="no one";
              }
             message="Incident "+incidentData.number+" is currently assigned to "+assigned_to+". Current state of the incident is ''"+incidentData.getDisplayValue('state')+"''. This incident was last updated by "+incidentData.sys_updated_by+" on "+incidentData.sys_updated_on+". If you would like, you can ask for the update from "+assigned_to+" by updating additional comments.";
         
             context='success';
          }
    }
  hdrs['Content-Type'] = 'application/json';
  response.setStatus(200);
  response.setHeaders(hdrs);

  var response_body = {
    "fulfillmentText": message,
      "payload":{
        "google": {
        "expectUserResponse": true,
          "richResponse": {
            "items": [
            {
              "simpleResponse": {
              "textToSpeech": message
              }
            }
            ]
         }
      }
   }                                        
};

writer.writeString(global.JSON.stringify(response_body));

})(request,response);
