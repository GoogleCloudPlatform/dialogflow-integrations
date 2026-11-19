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

### Creating a Webhook Secret

The integration answers every message that is posted to its webhook, and each answer is sent, and billed, using your CM.com Product Token. CM.com has to be able to reach the webhook without Google credentials, so the service is deployed to accept unauthenticated invocations. To make sure that only CM.com can use it, the webhook URL contains a secret, and the server refuses to start without one.

Generate a secret and store it in [Secret Manager](https://cloud.google.com/run/docs/configuring/services/secrets):

```shell
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create cm-webhook-secret --data-file=-
```

The secret must be at least 32 characters long and may only contain letters, digits, `-` and `_`. The Service Account that runs the integration needs the `Secret Manager Secret Accessor` role on this secret.

### Deploying the Integration Using Cloud Run

In your local terminal, change the active directory to the repository’s root directory.

Run the following command to save the state of your repository into [GCP Container Registry](https://console.cloud.google.com/gcr/). Replace PROJECT-ID with your agent’s GCP Project ID.

```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow-cm
```

Deploy your integration to Cloud Run using the following command. Replace `PROJECT_ID` with your agent’s GCP project Id, and `DIALOGFLOW_SERIVCE_ACCOUNT` with the Service Account which you acquired in the Service Account Setup step of the [main README file](../readme.md).

```shell
gcloud beta run deploy --image gcr.io/PROJECT_ID/dialogflow-cm --service-account DIALOGFLOW_SERVICE_ACCOUNT --memory 1Gi --set-secrets CM_WEBHOOK_SECRET=cm-webhook-secret:latest
```

- When prompted for a target platform, select a platform by entering the corresponding number (for example, ``1`` for ``Cloud Run (fully managed)``).
- When prompted for a region, select a region (for example, ``europe-west1``).
- When prompted for a service name hit enter to accept the default,
- When prompted to allow unauthenticated invocations press ``y``,
- Copy the URL given to you at the end of the script.
- Append `/webhook/` and your webhook secret to it, for example `https://dialogflow-cm-abcdefghij-ew.a.run.app/webhook/YOUR_WEBHOOK_SECRET`.
- Open the [CM.com Channels page](https://www.cm.com/app/channels) and set this as the webhook URL in the channel page and choose type JSON. 

### Securing the Webhook

- **Treat the webhook URL as a secret.** Anyone who knows it can make the integration send messages on your account. The URL, including the secret, is written to the Cloud Run request logs, so limit who can read the logs of the project.
- **Rotating the secret.** Add a new version to the secret in Secret Manager, deploy a new revision, and update the webhook URL in the CM.com Channels page.
- **Restrict the numbers that are answered (optional).** Set the `CM_ALLOWED_SENDERS` environment variable to a comma separated list of your own CM.com numbers, written exactly as CM.com sends them in the `to.number` field of the webhook. Messages addressed to any other number are ignored.
- **Restrict the source addresses (optional).** CM.com publishes the [IP ranges](https://developers.cm.com/messaging/docs/incoming-messages) its webhooks are sent from. To only accept requests from these ranges, put the service behind an external Application Load Balancer with a [Cloud Armor](https://cloud.google.com/armor/docs/integrating-cloud-armor) policy and [restrict the ingress](https://cloud.google.com/run/docs/securing/ingress) of the service to the load balancer.

### Upgrading an Existing Deployment

Earlier versions of this integration accepted messages on the root path of the service without a secret. That path has been removed. After deploying this version, change the webhook URL in the CM.com Channels page to the new `/webhook/YOUR_WEBHOOK_SECRET` URL, otherwise incoming messages are rejected.


More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.
