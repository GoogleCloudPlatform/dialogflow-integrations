/**
 * TODO(developer): 
 * Add your service key to the current folder.
 * Uncomment and fill in these variables.
 */
// const slackSigningSecret = '...';
// const slackToken = 'xoxb-...';
// const projectId = 'my-project';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en';

const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');

const slackEvents = createEventAdapter(slackSigningSecret);
const slackClient = new WebClient(slackToken);

// Imports the Google Cloud Some API library
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
/**
 * Example for regional endpoint:
 *   const locationId = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient({apiEndpoint: locationId + '-dialogflow.googleapis.com'});

/**
 * Converts Slack request to a detectIntent request.
 */
function slackToDetectIntent(slackRequest, sessionPath){
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: slackRequest.text,
            },
            languageCode,
        },
    };

    return request;
}

/**
 * Converts detectIntent response to a Slack message request. 
 */
function detectIntentToSlackMessage(response, channel_id){
    var agentResponse = '';
    
    for (const message of response.queryResult.responseMessages) {
        if (message.text) {
            agentResponse += `${message.text.text}\n`;
        };
    };
    
    if(agentResponse.length != ''){
        const request = {
            channel: channel_id,
            text: agentResponse
        };
        return request;
    };
};

/**
 * Takes as input a request from Slack and converts the request to
 * detectIntent request which is used to call the detectIntent() function
 * and finally output the response given by detectIntent().
 */
async function detectIntentResponse(slackRequest) {
    const sessionId = slackRequest.channel;
    const sessionPath = client.projectLocationAgentSessionPath(
        projectId,
        locationId,
        agentId,
        sessionId
    );
    console.info(sessionPath);
    
    request = slackToDetectIntent(slackRequest, sessionPath);
    const [response] = await client.detectIntent(request);

    return response;
};

/**
 * Checks if the request is coming from a bot and if it is not 
 * it will call detectIntentResponse() with the request as the input
 * and outputs the response. The initial check to make
 * sure the request is not from a bot is there to prevent the Integration
 * from replying to its own messages.
 */
async function eventToRequest(event, channel_id) {
    if(event.bot_id == '' || event.bot_id == null){
        const response = await detectIntentResponse(event);
        var request = detectIntentToSlackMessage(response, channel_id);
        try {
            await slackClient.chat.postMessage(request)
        } catch (error) {
            console.log(error.data)
        }
    };
};

// Listens for messages posted in instant messages.
slackEvents.on('message', (event) => {
    (async () => {
        await eventToRequest(event, event.user);
    })();
    
});

// Listens for messages that mention the Slack App in channals
slackEvents.on('app_mention', (event) => {
    (async () => {
        await eventToRequest(event, event.channel);
    })();
});

slackEvents.on('error', console.error);

slackEvents.start(process.env.PORT).then(() => {
    console.log(`Server started on port ${process.env.PORT}`)
});

module.exports = {slackToDetectIntent, detectIntentToSlackMessage};
