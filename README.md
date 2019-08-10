# Dialogflow Integration

This repository contains seven integrations for Dialogflow. These integrations
connect a bot created in Dialogflow to chat services in third party platforms.
Although any platform could be used to host your Dialogflow integration, for
this repo we will instruct you how to set yours up on Google's Cloud Run.

## Authenticating dialogflow

In order to use the integrations, it is necessary to create a Service Account
and download its JSON key file. Save the key file to the directory of the
integration you want to use. Set the environmental variable
GOOGLE_APPLICATION_CREDENTIALS to the key file's location in the directory. See
[this guide](https://dialogflow.com/docs/reference/v2-auth-setup) for details.
For setup in cloud run, just add the key into the repository you will clone in
your cloud run project.

## Cloud Run Setup

### Initial Setup

1. Create a Google Cloud account and proceed to
[Cloud Console](https://console.cloud.google.com/home/dashboard).
2. Create a Google Cloud project and enable billing using the link
[here](https://console.cloud.google.com/projectcreate).
3. For the project, enable Cloud Build and Cloud Run API
[here](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com,run.googleapis.com).
4. In your [Cloud Console](https://console.cloud.google.com/home/dashboard)
click the Cloud Shell button. In Cloud Shell you should see the GCP project id of
the project you just created.
5.  Use the following command to clone this git repository
``
git clone [repository url]
``
6. Open the repository you cloned

### Credentials and Authentication

Each integration has its own credentials you need to obtain in order to work. To
determine how to obtain these credentials. Go into the folder of the integration
you want to setup and look at its README.md file. Once you have the credentials
you need add them to that integration's server.js file. Replace the 'place
[credential] here' with your credentials. In addition, you will need to obtain
the Project Id of your Dialogflow project. To do this, go to the
[Dialogflow Console](https://dialogflow.cloud.google.com), and click the gear
icon by the agent name. The Project Id should be in the GOOGLE PROJECT section.
Take this id and add it to the server.js file in the integration you want to
use. To do this, set the constant projectId to the value.

### Creating the Build

Open the Dockerfile that is in your cloned repository, and change
YOUR_INTEGRATION to the integration you want to use.
```Dockerfile
# Use the official Node.js 10 image.
   # https://hub.docker.com/_/node
   FROM node:10

   # Create and change to the app directory.
   WORKDIR /usr/src/app

   # Set this environmental variable to the integration you want to use
   ENV INTEGRATION=YOUR_INTEGRATION

   # Copy application dependency manifests to the container image.
   # A wildcard is used to ensure both package.json AND package-lock.json are copied.
   # Copying this separately prevents re-running npm install on every code change.
   COPY ${INTEGRATION}/package*.json ./

   # Install production dependencies.
   RUN npm install --only=production

   # Copy local code to the container image.
   COPY . .

   # Run the web service on container startup.
   WORKDIR ${INTEGRATION}
   CMD [ "npm", "start" ]
   ```
If you have not done so already, add your key file to this repository in the
directory of the integration you want to use.

To make your build run the following command into the console, but replace
PROJECT-ID with your GCP project Id. You can view your project ID using
``gcloud config get-value project``
```shell
gcloud builds submit --tag gcr.io/PROJECT-ID/dialogflow
```
For more information on how to build the container, there is additional
documentation [here](https://cloud.google.com/run/docs/building/containers).

### Deploying on Cloud Run

Deploy using the following command, but replace PROJECT-ID with your GCP project
Id and YOUR_KEY_FILE with the name of your JSON key file. Make sure to replace
Project-ID  with your GCP project ID.
```shell
gcloud beta run deploy --image gcr.io/PROJECT-ID/dialogflow --update-env-vars GOOGLE_APPLICATION_CREDENTIALS=YOUR_KEY_FILE --memory 1Gi
```
 - When prompted for a region, select a region (for example ``us-central1``).
 - When prompted for a service name hit enter to accept the default
 - When prompted to allow unauthenticated invocations press ``y``
 - Copy the URL given to you, and use it according to the README file in the
 given integration's folder.

 More information can be found in Cloud Run
 [documentation](https://cloud.google.com/run/docs/deploying).