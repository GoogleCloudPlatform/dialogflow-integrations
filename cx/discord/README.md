# Discord Integration for Dialogflow CX.

## Setup

### Prerequisites

- Follow the instructions on the [main README file](https://github.com/GoogleCloudPlatform/dialogflow-integrations#readme) in the root directory of this repository.
- Create and add your [GCP service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) to the current folder.
- Sign into or setup a account on [Discord](https://discord.com/).
- Follow this [guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) to setup a bot.
    - Copy the Token string provided and paste it into the veriable __discordToken__ in __server.js__ file.
    - Select "bot" in __OAuth2 SCOPES__
    - Select "Send Messages" and "Read Message history" in __BOT PEMISSIONS__
    
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
*   First [invite](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links) the bot you created to a server.
*   To test rich messages you have to first input in the [custom payload](https://cloud.google.com/dialogflow/cx/docs/concept/fulfillment) for your agent:
    *   To do this first click "Add dialogue option" in a fulfillment editing panel.
    *   Then copy and paste one of the bottom codes and edit it to fit your needs.
        *   { "files": ["http://example.com/image.jpg]" } for [images](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=send).
        *   { "files": ["http://example.com/audio.mp3]" } for [audio](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=send).
        *   For buttons follow this [guide](https://discord.com/developers/docs/interactions/message-components#buttons) for formating your button message correctly.
*   There are two ways to test the integration:
    *   Directly message your bot.
    *   Mention the name of your bot (Ex: @botName) in your message.
