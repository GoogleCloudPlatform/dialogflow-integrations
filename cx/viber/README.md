# Viber Integration for Dialogflow CX

## Setup

### Prerequisites

- Follow the instructions on the [main README file](https://github.com/GoogleCloudPlatform/dialogflow-integrations#readme) in the root directory of this repository.
- Download the Viber app on your mobile device and set up account on that device.
- Set up a [bot account](https://partners.viber.com).
- Create and add your [GCP service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) to the current folder.
- Uncomment and fill in the variables on the top of the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/beff4b43b8a7545ea6187735480b91e7f57000ee/cx/viber/server.js#L15) 

### Obtaining Viber Credentials

- Log in to your [bot account](https://partners.viber.com). 
- On the main
screen, take the values for __Token__, the URL for your bot’s avatar, and __Account Name__ and replace the values for __viberToken__, __botAvatarLink__, and __botName__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/beff4b43b8a7545ea6187735480b91e7f57000ee/cx/viber/server.js#L18-L20) respectively. 

![alt text](images/viber-obtain-viber-credentials.png)

### Deploying the Integration Using Cloud Run

In your local terminal, change the active directory to the repository’s root directory.

Run the following command to save the state of your repository into [GCP Container Registry](https://console.cloud.google.com/gcr/). Replace PROJECT-ID with your agent’s GCP Project ID and PLATFORM with the platform subdirectory name.

```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow-PLATFORM
```

Deploy your integration to Cloud Run using the following command. Replace `PROJECT_ID` with your agent’s GCP project Id, and `DIALOGFLOW_SERIVCE_ACCOUNT` with the Service Account which you acquired in the Service Account Setup step of the [main README file](../readme.md).

```shell
gcloud beta run deploy --image gcr.io/PROJECT_ID/dialogflow-cm --service--acount DIALOGFLOW_SERVICE_ACCOUNT --memory 1Gi
```

- When prompted for a target platform, select a platform by entering the corresponding number (for example, ``1`` for ``Cloud Run (fully managed)``).
 - When prompted for a region, select a region (for example, ``us-central1``).
 - When prompted for a service name hit enter to accept the default.
 - When prompted to allow unauthenticated invocations press ``y``.
 - Copy the URL given to you, and use it according to the README file in the
 given integration's folder.

Take the value for the server URL printed in the console after the completion of the execution of the above command and replace the value for __webhookUrl__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/beff4b43b8a7545ea6187735480b91e7f57000ee/cx/viber/server.js#L16). 

Redeploy the integration with the updated change by rerunning the above two commands. 

More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.

### Testing the Integration

In order to test [VIBER_WELCOME](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/beff4b43b8a7545ea6187735480b91e7f57000ee/cx/viber/server.js#L65) message follow these steps
* On the start page of your agent add an [event handler](https://cloud.google.com/dialogflow/cx/docs/concept/handler#event)
* Click "Use custom event" and add the event name (VIBER_WELCOME)
* Under fulfillment edit the agent's response
* To test the welcome message simply start a converstion with the bot 

In order to test rich response messages follow these steps
* To add rich response navigate to the fulfillment editing panel of the agent
* Click "Add dialogue option" and select [custom payload](https://cloud.google.com/dialogflow/cx/docs/concept/fulfillment#payload)
* Then add the corresponding parameters for the specific message type according to [Viber's layout](https://developers.viber.com/docs/api/rest-bot-api/#message-types)
    * For example, to send a picture message add these required parameters
        * { "type": "picture", "text": "Photo description", "media": "http://www.images.com/img.jpg" }
