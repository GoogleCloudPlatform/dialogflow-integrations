# Spark Integration

## Setup

### Prerequisites

- Follow the instructions on the [main README file](https://github.com/GoogleCloudPlatform/dialogflow-integrations#readme) in the root directory of this repository.
- Create a [Spark account](https://teams.webex.com/signin).
- Replace the value of __projectId__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/spark/server.js#L36) with your Dialogflow agent’s Project ID.

### Creating a Spark Bot

- Log in to Spark and go to the [New Bot page](https://developer.webex.com/my-apps/new/bot).
- Fill in the required fields and click the "Add Bot" button. 

![alt text](images/spark-create-the-spark-bot.png)

- On the next screen, take the value for your bot’s __access Token__ and replace the value for __sparkAccessToken__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/spark/server.js#L34).
- Generate a random webhook secret (for example with `openssl rand -hex 32`) and replace the value for __sparkWebhookSecret__ in `server.js` (or configure the `SPARK_WEBHOOK_SECRET` environment variable on Cloud Run).

### Deploying the Integration Using Cloud Run

In your local terminal, change the active directory to the repository’s root directory.

Run the following command to save the state of your repository into [GCP Container Registry](https://console.cloud.google.com/gcr/). Replace PROJECT-ID with your agent’s GCP Project ID.

```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow-spark
```

Deploy your integration to Cloud Run using the following command. Replace `PROJECT_ID` with your agent’s GCP project Id, and `DIALOGFLOW_SERIVCE_ACCOUNT` with the Service Account which you acquired in the Service Account Setup step of the [main README file](../readme.md).

```shell
gcloud beta run deploy --image gcr.io/PROJECT_ID/dialogflow-spark --service-account DIALOGFLOW_SERVICE_ACCOUNT --memory 1Gi
```

- When prompted for a target platform, select a platform by entering the corresponding number (for example, ``1`` for ``Cloud Run (fully managed)``).
 - When prompted for a region, select a region (for example, ``us-central1``).
 - When prompted for a service name hit enter to accept the default,
 - When prompted to allow unauthenticated invocations press ``y``,
 - Copy the URL given to you, and use it according to the README file in the
 given integration's folder.

Take the value for the server URL printed in the console after the completion of the execution of the above command and replace the value for __targetUrl__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/spark/server.js#L35). 

Redeploy the integration with the updated change by rerunning the above two commands. 

More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.

### Request Validation

The integration registers its Webex webhook with __sparkWebhookSecret__ and only accepts UTF-8 JSON webhook requests that carry a valid `X-Spark-Signature` header (`HMAC-SHA1` of the raw request body), answering every other request with a `403`. Make sure that __sparkWebhookSecret__ in `server.js` (or the `SPARK_WEBHOOK_SECRET` environment variable) is set to a non-empty secret value rather than the placeholder, otherwise webhook registration is skipped and all incoming webhook requests are rejected.

If you deployed this integration before request validation was added, set __sparkWebhookSecret__ (or `SPARK_WEBHOOK_SECRET`) and redeploy so the server replaces the previous unsigned Webex webhook.

### Testing

To test your bot, either download the [webex app](https://web.webex.com/) and send a direct message to your bot using the username you specified earlier. This username should end in "@webex.bot"
