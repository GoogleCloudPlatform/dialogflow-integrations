# Slack Integration for Dialogflow CX

## Setup

### Prerequisites

- Follow the instructions on the [main README file](https://github.com/GoogleCloudPlatform/dialogflow-integrations#readme) in the root directory of this repository.
- Create and add your [GCP service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) to the current folder.

- Create a Slack APP
    
    - Create or sign in to your Slack account.

    - Go to https://api.slack.com/apps.

    - Click on the 'Create New App' button.

        - Choose 'From an app Manifest'.
        - Pick a workspace for the app.
        - Copy and paste the code in the __manifest.yaml__ file to the YAML section and edit the display_information as you like. Make sure to fill in the request_url in the event_subscription.
            - For more details on Slack App manifests and its use, please visit https://api.slack.com/reference/manifests.
        - Click next and then click create.
        - Install the app to your chosen Workspace.        
        - Copy the Signing Secret from 'Basic Information' and the Bot user OAuth Token from 'Intstall App'.
    
- Uncomment and fill in the variables on the top of the __server.js__ file.


### Deploying the Integration Using Cloud Run

In your local terminal, change the active directory to the repository’s root directory.

Run the following command to save the state of your repository into [GCP Container Registry](https://console.cloud.google.com/gcr/). Replace PROJECT-ID with your agent’s GCP Project ID and PLATFORM with the platform subdirectory name.

```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow-PLATFORM
```

Deploy your integration to live using the following command. Replace PROJECT-ID with your agent’s GCP project Id, PLATFORM with the platform subdirectory name, and YOUR_KEY_FILE with the name (not path) of your Service Account JSON key file.

```shell
gcloud beta run deploy --image gcr.io/PROJECT-ID/dialogflow-PLATFORM --update-env-vars GOOGLE_APPLICATION_CREDENTIALS=YOUR_KEY_FILE --memory 1Gi
```

- When prompted for a target platform, select a platform by entering the corresponding number (for example, ``1`` for ``Cloud Run (fully managed)``).
 - When prompted for a region, select a region (for example, ``us-central1``).
 - When prompted for a service name hit enter to accept the default.
 - When prompted to allow unauthenticated invocations press ``y``.
 - Copy the URL given to you, and use it according to the README file in the
 given integration's folder.

More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.

### 
**Testing the Integration**

*   You have now completed all the necessary steps and can test your integration.
*   To test rich messages you have to first input in the [custom payload](https://cloud.google.com/dialogflow/cx/docs/concept/fulfillment) for your agent:
    *   To do this first click "Add dialogue option" in a fulfillment editing panel.
    *   Then copy and paste the bottom code and edit it to include your chosen elements in the blocks.
        *   { "blocks": [ {...} ] }
    *   For more information on the layouts for Slack rich messages, please visit https://api.slack.com/messaging/composing/layouts.
*   There are two ways to test the integration:
    *   Directly instant message the integration through the Slack App you created.
    *   Install your Slack App on a channal and mention the name of the Slack App (Ex: @appName) in your message.
