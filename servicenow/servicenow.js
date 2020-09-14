/** Copyright 2020 Google LLC
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*    https://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {        


        var writer = response.getStreamWriter();


        hdrs = {};


                var x=request.body.data;
                var inc='';
                var priority='';
                var state='';
                var assigned_to='';
                var context='';
                var command='';
                var message='';
                var status ='';
                var desc='';
                var caller='';
                var content='';
                var summary='';
                var comments='';


        data={};


                        if(x.queryResult.intent.displayName=='incident.create.details')
                        //create a new ticket
                                {                                
                                var username=x.queryResult.parameters.username + "";
                                var description=x.queryResult.parameters.description + "";
                                        
                                var ci = new GlideRecord("incident");
                                ci.initialize();
                                ci.short_description = description; 
                                ci.caller_id.setDisplayValue(username); 
                                ci.insert();
                                        
                                        message="Ticket number "+ci.number+" has been created.";


                                        //summary={}


                                                context='success';


                                        }
                
                        if(x.queryResult.intent.displayName=='incident.status.number')
                        //get status of ticket
                                {                                
                                var numbers=x.queryResult.parameters.number + "";
                                var ci = new GlideRecord("incident");
                                ci.addQuery("number",'ENDSWITH', numbers);
                                ci.query();
                                
                                        if (ci.next()) {


                                        if(ci.assigned_to!='')


                                                assigned_to=ci.getDisplayValue('assigned_to');


                                        else


                                                assigned_to="no one";


                                        message="Incident "+ci.number+" is currently assigned to "+assigned_to+". Current state of the incident is ''"+ci.getDisplayValue('state')+"''. This incident was last updated by "+ci.sys_updated_by+" on "+ci.sys_updated_on+". If you would like, you can ask for the update from "+assigned_to+" by updating additional comments.";


                                        //summary={}


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


                                //return response_body;
                                })(request,response);
