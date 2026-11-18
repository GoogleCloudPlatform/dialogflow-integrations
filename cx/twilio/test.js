const assert = require("assert");
const crypto = require("crypto");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const {
    app,
    twilioToDetectIntent,
    detectIntentToTwilio,
    requireTwilioSignature
} = require("./server");
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

const AUTH_TOKEN = 'test-auth-token';
const HOST = 'dialogflow-twilio-abc123-uc.a.run.app';
const WEBHOOK_URL = 'https://' + HOST + '/';
const sampleTwilioParams = {
    Body: message2,
    From: '+15550001111',
    To: '+15550002222'
};

/*
*  Signs a request the way Twilio does, independently of the twilio library:
*  https://www.twilio.com/docs/usage/security#validating-requests
*/
const sign = (authToken, url, params) => {
    const data = Object.keys(params).sort()
        .reduce((acc, key) => acc + key + params[key], url);
    return crypto.createHmac('sha1', authToken)
        .update(Buffer.from(data, 'utf-8')).digest('base64');
};

/*
*  Sends a form-encoded POST to "/" on a locally listening server, as if it
*  had arrived through an HTTPS proxy for HOST.
*/
const post = (server, params, headers = {}) => {
    const body = new URLSearchParams(params).toString();
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: '127.0.0.1',
            port: server.address().port,
            method: 'POST',
            path: '/',
            agent: false,
            headers: Object.assign({
                'Host': HOST,
                'X-Forwarded-Proto': 'https',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }, headers)
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({status: res.statusCode, body: data}));
        });
        req.on('error', reject);
        req.end(body);
    });
};

const listen = (expressApp) => new Promise((resolve) => {
    const server = expressApp.listen(0, '127.0.0.1', () => resolve(server));
});

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

    describe('requireTwilioSignature', () => {
        const savedEnv = {};
        let server;
        let handled;

        before(async () => {
            const testApp = express();
            testApp.set('trust proxy', true);
            testApp.use(bodyParser.urlencoded({ extended: true }));
            testApp.post('/', requireTwilioSignature, (req, res) => {
                handled++;
                res.send('handled');
            });
            server = await listen(testApp);
        });

        after((done) => {
            server.close(done);
        });

        beforeEach(() => {
            for (const name of ['TWILIO_AUTH_TOKEN', 'TWILIO_WEBHOOK_URL']) {
                savedEnv[name] = process.env[name];
                delete process.env[name];
            }
            process.env.TWILIO_AUTH_TOKEN = AUTH_TOKEN;
            handled = 0;
        });

        afterEach(() => {
            for (const name of Object.keys(savedEnv)) {
                if (savedEnv[name] === undefined) {
                    delete process.env[name];
                } else {
                    process.env[name] = savedEnv[name];
                }
            }
        });

        it('should accept a request signed with the auth token', async () => {
            const signature = sign(AUTH_TOKEN, WEBHOOK_URL, sampleTwilioParams);
            const res = await post(server, sampleTwilioParams,
                {'X-Twilio-Signature': signature});
            assert.equal(res.status, 200);
            assert.equal(handled, 1);
        });

        it('should validate against TWILIO_WEBHOOK_URL when it is set', async () => {
            const publicUrl = 'https://bot.example.com/twilio';
            process.env.TWILIO_WEBHOOK_URL = publicUrl;
            const accepted = await post(server, sampleTwilioParams,
                {'X-Twilio-Signature': sign(AUTH_TOKEN, publicUrl, sampleTwilioParams)});
            assert.equal(accepted.status, 200);
            const rejected = await post(server, sampleTwilioParams,
                {'X-Twilio-Signature': sign(AUTH_TOKEN, WEBHOOK_URL, sampleTwilioParams)});
            assert.equal(rejected.status, 403);
            assert.equal(handled, 1);
        });

        it('should reject a request without a signature', async () => {
            const res = await post(server, sampleTwilioParams);
            assert.equal(res.status, 403);
            assert.equal(handled, 0);
        });

        it('should reject a request signed with another auth token', async () => {
            const signature = sign('another-auth-token', WEBHOOK_URL, sampleTwilioParams);
            const res = await post(server, sampleTwilioParams,
                {'X-Twilio-Signature': signature});
            assert.equal(res.status, 403);
            assert.equal(handled, 0);
        });

        it('should reject a request whose sender was changed after signing', async () => {
            const signature = sign(AUTH_TOKEN, WEBHOOK_URL, sampleTwilioParams);
            const forged = Object.assign({}, sampleTwilioParams, {From: '+15550003333'});
            const res = await post(server, forged,
                {'X-Twilio-Signature': signature});
            assert.equal(res.status, 403);
            assert.equal(handled, 0);
        });

        it('should reject every request when no auth token is configured', async () => {
            delete process.env.TWILIO_AUTH_TOKEN;
            const signature = sign('', WEBHOOK_URL, sampleTwilioParams);
            const res = await post(server, sampleTwilioParams,
                {'X-Twilio-Signature': signature});
            assert.equal(res.status, 403);
            assert.equal(handled, 0);
        });
    });

    describe('POST /', () => {
        let server;

        before(async () => {
            server = await listen(app);
        });

        after((done) => {
            server.close(done);
        });

        it('should reject an unsigned request before calling Dialogflow', async () => {
            const res = await post(server, sampleTwilioParams);
            assert.equal(res.status, 403);
            assert.ok(!res.body.includes('<Response>'));
        });
    });

});
