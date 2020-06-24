# Dialogflow Integration

## Introduction

The purpose of this documentation is to set up an integration deployment to connect your existing Dialogflow agent to various third party chat service platforms.

If you do not have an existing Dialogflow agent, you can set one up by reading the documentation [here](https://cloud.google.com/dialogflow/docs/).

Although it is possible to set up this integration deployment on any hosting platform, these instructions will use [Google's Cloud Run](https://cloud.google.com/run/).

## Initial Setup

### Setting up gcloud CLI

The deployment process for GCP Cloud Run via this README utilizes gcloud CLI commands. Follow the steps below to set up gcloud CLI locally for this deployment.

1. On the gcloud CLI [documentation page](https://cloud.google.com/sdk/docs/quickstarts), select your OS and follow the instructions for the installation. 
2. Run ``gcloud config get-value project`` to check the GCP Project configured. 
3. Go into the Dialogflow agent’s settings and check the Project ID associated with the agent. The GCP Project configured in the gcloud CLI should match the agent’s Project ID.
4. If the project IDs do not match, run ``gcloud config set project PROJECT-ID``, replacing PROJECT-ID with the Project ID from step 3. 

### Service Account Setup (GCP)

For the integration to function properly, it is necessary to create a Service Account in your agent’s GCP Project. See [this page](https://cloud.google.com/dialogflow/docs/quick/setup#sa-create) of the documentation for more details. 

Follow the steps below to create a Service Account and set up the integration. 

1. Go into the Dialogflow agent’s settings and click on the Project ID link to open its associated GCP Project.
2. Click on the navigation menu in the GCP console, hover over "IAM & admin", and click "Service accounts". 
3. Click on "+ CREATE SERVICE ACCOUNT", fill in the details, and give it the "Dialogflow Client API" role.
4. Click on "+ Create Key" and download the resulting JSON key file. 
5. Save the JSON key file in the desired platform subdirectory. 

If deploying this integration outside of GCP Cloud Run, it may be necessary to set the GOOGLE_APPLICATION_CREDENTIALS environmental variable on the deployment environment to the absolute path of Service Account JSON key file. See [this guide](https://cloud.google.com/dialogflow/docs/quick/setup#auth) for details.

## Deploying the Integration

### Setup

1. Go into the Dialogflow agent’s settings and click on the Project ID link to open its associated GCP Project.
2. Click on the navigation menu in the GCP console and click "Billing". Set up and enable billing for the project. 
3. Enable Cloud Build and Cloud Run API for the project
[here](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com,run.googleapis.com).
4. Clone this git repository onto your local machine or development environment:
`git clone [repository url]`
5. Open the root directory of the repository on your local machine or development environment.

### Dockerfile and Creating the Build

Open the [Dockerfile](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/Dockerfile#L9) in the root directory of the repository, and change YOUR_INTEGRATION in the following line to the name of the desired platform subdirectory.

```Dockerfile
   # Set this environmental variable to the integration you want to use
   ENV INTEGRATION=YOUR_INTEGRATION
   ```

If you have not done so already, copy your Service Account JSON key file to the desired platform subdirectory. 

### Platform-specific Instructions

The integration requires platform credentials from the intended platform to function properly. 

Follow the steps in the README file in the relevant platform subdirectory to obtain the credentials and setup the server.js file to deploy and start the integration:

- [CM.com (SMS and WhatsApp Business)](./cm/README.md)
- [Kik](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/kik#readme)
- [Skype](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/skype#readme)
- [Spark](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/spark#readme)
- [Twilio IP Messaging](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/twilio-ip#readme)
- [Twilio (Text Messaging)](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/twilio#readme)
- [Twitter](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/twitter#readme)
- [Viber](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/viber#readme)

## Post-deployment

### Shutting Down an Integration

In order to shut down an integration set up via the steps in this README, only deleting the Cloud Run service is required.

In your local terminal, run the following command and select the previously chosen target platform to list active deployments:

```shell
gcloud beta run services list
```

Then run the following command, replacing SERVICE-NAME with the name of the service you want to shut down, and select the same settings chosen when deploying in order to shut down the deployment. 

```shell
gcloud beta run services delete SERVICE-NAME
```

If following the instructions closely, SERVICE-NAME should be in the format of dialogflow-PLATFORM

### Multiple Integrations

To set up multiple integration deployments simultaneously, repeat all of the instructions for each deployment. While it is possible to make changes to the existing deployment repository and re-deploy it under a different name, it would make it difficult to retroactively make changes to previous deployments.

### Changing Integration Behavior

The behavior of an integration can be customized via the addition of your own developer code or by editing the server.js file in the platform subdirectory.

After making changes, redeploy the deployment by re-running the commands as specified in the "Deploy the Integration Using Cloud Run" section of the platform-specific integration READMEs.
