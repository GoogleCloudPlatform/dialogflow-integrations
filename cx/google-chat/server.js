/**
 * TODO(developer):
 * Uncomment and fill in these variables.
 */
 const projectId = 'my-project-id';
 const location = 'my-location';
 const agentId = 'my-agent-id'

exports.bot = async (req, res) => {
  if (!(req.method === 'POST' && req.body)) {
      res.status(400).send('')
  }
  const event = req.body;
  let reply = {};
  if (event.type === 'MESSAGE') {

    const {SessionsClient} = require('@google-cloud/dialogflow-cx');
    const uuid = require('uuid');

    const client = new SessionsClient();

    const sessionPath = client.projectLocationAgentSessionPath(projectId, location, agentId, uuid.v4());

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: event.message.argumentText
        },
        languageCode : 'en',
      },
    };

    const agentResponse= await client.detectIntent(request)
    console.log((agentResponse[0].queryResult.responseMessages[0].text.text[0]))
    reply = {
      text: agentResponse[0].queryResult.responseMessages[0].text.text[0]
  };
  }
  res.json(reply)
}