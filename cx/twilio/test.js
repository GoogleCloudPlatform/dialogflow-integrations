const assert = require("assert");
const { twilioToDetectIntent, detectIntentToTwilio }= require("./server");
const MessagingResponse = require('twilio').twiml.MessagingResponse;

message1 = "the message";
message2 = "the greater picture";

const languageCode = 'en';
sampleDialogflowRequest = {
    session: "sessionPath",
    queryInput:
        {
            text: {
                text: message1
            },
            languageCode
        }
    };

const sampleDialogflowResponse = {
    queryResult: {
        responseMessages: [
            {
                text: {
                    text: message1
               } 
            }
        ]
    }
}

const sampleTwilioRequest = {
    body: {
        Body: message2
    }
}

const sampleTwiml = new MessagingResponse();
sampleTwiml.message(message1);

describe('Dialogflow Twilio integration', () => {
    describe('detectIntentToTwilio', () => {
        it('should convert detectIntent response to Twilio request', () => {
            assert.equal(detectIntentToTwilio(sampleDialogflowResponse).toString(), sampleTwiml.toString());   
        });
    });

    describe('twilioToDetectIntent', () => {
        it('should convert twilio request to detectIntent response', () => {
            assert.equal(twilioToDetectIntent(sampleTwilioRequest).queryInput.text.text, message2);
        });
    });

});
