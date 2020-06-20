# CM.com Integration for SMS and WhatsApp Business

## Feedback and Questions

As this integration is created and maintained by CM.com, the most direct way to find support is via [their fork of the project](https://github.com/CMTelecom/dialogflow-integrations).
In that same project, you can [open issues](https://github.com/CMTelecom/dialogflow-integrations/issues) that will be read by the CM.com team of developers.

Updates and fixes in the CM.com fork will be propagated to the mail Dialogflow branch upon approval by the Dialogflow team.

If you are in need of more direct support, you can always reach out directly to CM.com via [email](mailto:support@cm.com) or [WhatsApp](https://wa.me/31765727000).

## Setup

### Prerequisites

- Follow the instructions on the [main README file](../README.md) in the root directory of this repository.
- Register for a [CM.com account](https://www.cm.com/register/) and top-up.
- Replace the value of __projectId__ in the [server.js file](./server.js#L19) with your Dialogflow agent’s Project ID. (Click on the cog next to your project name and find the Google Project ID).

### Getting a CM.com Channel

- Log in to the CM.com Platform and go to the [Channels page](https://www.cm.com/app/channels).
- Acquire a channel by following the directions on screen.
- Replace the value of __cmProductToken__ in the [server.js file](./server.js#L18) with your [CM.com Product Token](https://www.cm.com/app/channels). (in the bottom of your channel detail page.)
- **Make sure you do not commit this secret token to any public repository!**

Currently both SMS and WhatsApp Business are supported. DialogFlow's response will be sent using the same channel as the original message was received on. As SenderID the receiving number will be used. Other channels might work, but are currently untested and unsupported. 

### Deploying the Integration Using Cloud Run

In your local terminal, change the active directory to the repository’s root directory.

Run the following command to save the state of your repository into [GCP Container Registry](https://console.cloud.google.com/gcr/). Replace PROJECT-ID with your agent’s GCP Project ID.

```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow-cm
```

Deploy your integration to live using the following command. Replace PROJECT-ID with your agent’s GCP project Id, and YOUR_KEY_FILE with the name (not path) of your Service Account JSON key file which you acquired in the Service Account Setup step of the [main README file](../readme.md).

```shell
gcloud beta run deploy --image gcr.io/PROJECT-ID/dialogflow-cm --update-env-vars GOOGLE_APPLICATION_CREDENTIALS=YOUR_KEY_FILE --memory 1Gi
```

- When prompted for a target platform, select a platform by entering the corresponding number (for example, ``1`` for ``Cloud Run (fully managed)``).
- When prompted for a region, select a region (for example, ``europe-west1``).
- When prompted for a service name hit enter to accept the default,
- When prompted to allow unauthenticated invocations press ``y``,
- Copy the URL given to you at the end of the script.
- Open the [CM.com Channels page](https://www.cm.com/app/channels) and set this as the webhook URL in the channel page and choose type JSON. 


More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.
