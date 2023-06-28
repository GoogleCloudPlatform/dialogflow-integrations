# Telegram Integration for Dialogflow CX.

## Setup

### Prerequisites

- Follow the instructions on the [main README file](https://github.com/GoogleCloudPlatform/dialogflow-integrations#readme) in the root directory of this repository.
- Create and add your [GCP service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) to the current folder.
- Set up a Telegram account through the app on your mobile device or on [Telegram Web](https://web.telegram.org/k/).
- Set up a [bot account](https://core.telegram.org/bots#6-botfather).
    - Copy the Token string provided and paste it into the veriable __TELEGRAM_TOKEN__ in __server.js__ file.
- Uncomment and fill in the variables on the top of the __server.js__ file.


### Deploying the Integration Using Cloud Run

In your local terminal, change the active directory to the repository’s root directory.

Run the following command to save the state of your repository into [GCP Container Registry](https://console.cloud.google.com/gcr/). Replace PROJECT-ID with your agent’s GCP Project ID.

```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow-telegram
```

Deploy your integration to Cloud Run using the following command. Replace `PROJECT_ID` with your agent’s GCP project Id, and `DIALOGFLOW_SERIVCE_ACCOUNT` with the Service Account which you acquired in the Service Account Setup step of the [main README file](../readme.md).

```shell
gcloud beta run deploy --image gcr.io/PROJECT_ID/dialogflow-telegram --service-account DIALOGFLOW_SERVICE_ACCOUNT --memory 1Gi
```

- When prompted for a target platform, select a platform by entering the corresponding number (for example, ``1`` for ``Cloud Run (fully managed)``).
 - When prompted for a region, select a region (for example, ``us-central1``).
 - When prompted for a service name hit enter to accept the default.
 - When prompted to allow unauthenticated invocations press ``y``.
 - Copy the URL given to you, and use it according to the README file in the
 given integration's folder.

Take the value for the server URL printed in the console after the completion of the execution of the above command and replace the value for __SERVER_URL__ in the __server.js__ file.

Redeploy the integration with the updated change by rerunning the above two commands. 

More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.

### 
**Testing the Integration**

*   You have now completed all the necessary steps and can test your integration.
*   To test rich messages you have to first input in the [custom payload](https://cloud.google.com/dialogflow/cx/docs/concept/fulfillment) for your agent:
    *   To do this first click "Add dialogue option" in a fulfillment editing panel.
    *   Then copy and paste one of the bottom codes and edit it to fit your needs.
        *   { "photo": "http://example.com/image.jpg" } to [send photos](https://core.telegram.org/bots/api#sendphoto).
        *   { "voice": "http://example.com/voice.mp3" } to [send voice audios](https://core.telegram.org/bots/api#sendvoice).
        *   { "text": "Test Text", "reply_markup": {"inline_keyboard": [ [ { ... } ] ] } to [send buttons](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
*   To test the the integration, you have to direct message the bot you created.
