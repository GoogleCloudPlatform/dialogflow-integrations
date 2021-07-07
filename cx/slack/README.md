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
        - Copy and paste the code below to the YAML section and edit the display_information as you like. Make sure to fill in the request_url in the event_subscription. 
        ```shell
        _metadata:
        major_version: 1
        minor_version: 1
        display_information:
        name: Dialogflow CX
        description: Dialogflow CX Integration
        background_color: "#1148b8"
        features:
        app_home:
            home_tab_enabled: false
            messages_tab_enabled: true
            messages_tab_read_only_enabled: false
        bot_user:
            display_name: CX
            always_online: true
        oauth_config:
        scopes:
            bot:
            - incoming-webhook
            - im:read
            - im:write
            - chat:write
            - channels:history
            - groups:history
            - im:history
        settings:
        event_subscriptions:
            request_url: example.com/slack/event
            bot_events:
            - message.channels
            - message.groups
            - message.im
        org_deploy_enabled: false
        socket_mode_enabled: false
        ```
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