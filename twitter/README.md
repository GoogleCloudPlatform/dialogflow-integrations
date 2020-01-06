# Twitter Integration

## Setup

### Prerequisites

- Follow the instructions on the [main README file](https://github.com/GoogleCloudPlatform/dialogflow-integrations#readme) in the root directory of this repository.
- Create a [Twitter Developer account](http://developer.twitter.com/en/apply/user).
- Replace the value of __projectId__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/twitter/server.js#L40) with your Dialogflow agent’s Project ID.

### Creating an App in Twitter

- Log in to your Twitter Developer account and proceed to the [Twitter App Management Console](https://developer.twitter.com/en/apps) by clicking on your username to open the dropdown menu and then clicking on "Apps".
- Click on the "Create New App" button. 
- Fill out the required fields and click "Create".

### Obtaining Twitter Credentials

- In the [Twitter App Management Console](https://developer.twitter.com/en/apps), 
click the  "Details" button on the new project. 
- Go to the "Permissions" tab and click the "Edit" button. 
- Set "Access permission" to "Read, write and Direct Messages" and click "Save".

![alt text](images/twitter-obtain-twitter-credentials-1.png)

- Go to the "Keys and tokens" tab in your App details. 
- Click "Create" under "Access token & access token secret". 
- Take the values for __API key__, __API secret key__, __Access token__, and __Access token secret__ and replace the values for __twitterAPIKey__, __twitterSecretAPIKey__, __twitterAccessToken__, and __twitterSecretAccessToken__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/twitter/server.js#L35-L38) respectively.

![alt text](images/twitter-obtain-twitter-credentials-2.png)

- Confirm that the "Access level" for the "Access token & access token secret" is "Read, write, and Direct Messages". 

### Creating a Dev Environment

- Log in to your Twitter developer account and go to the [Dev environments page](https://developer.twitter.com/en/account/environments) by clicking on your username to open the dropdown menu and then clicking on "Dev environments". 
- In the "Account Activity API / Sandbox" section, click the "Set up dev environment" button. 
- Fill out the appropriate details and click "Complete setup".
- Take the value of __Dev environment label__ and replace the value for __environmentName__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/twitter/server.js#L41).

![alt text](images/twitter-creating-a-dev-environment.png)

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
 - When prompted for a service name, hit Enter to accept the default.
 - When prompted to allow unauthenticated invocations, press ``y``.
 - Copy the URL given to you and use it according to the README file in the
 given integration's folder.

Take the value for the server URL printed in the console after the completion of the execution of the above command and replace the value for __targetUrl__ in the [server.js file](https://github.com/GoogleCloudPlatform/dialogflow-integrations/blob/03676af04840c21c12e2590393d5542602591bee/twitter/server.js#L39). 

Redeploy the integration with the updated change by rerunning the above two commands. 

More information can be found in Cloud Run
[documentation](https://cloud.google.com/run/docs/deploying).

You can view a list of your active integration deployments under [Cloud Run](https://console.cloud.google.com/run) in the GCP Console.

## Potential Issues

### Duplicate Tweets

Twitter will block any duplicate tweets. So your Twitter bot may be prevented from retweeting a person if they are triggering the same response multiple times.

### Cloud Run 504 Error

Cloud Run will return 504 errors after Twitter receives a message. Do not be concerned. These messages appear because of the way the Twitter integration returns messages, not because there are any actual issues.

### Cloud Run Multiple Instances on Startup

Cloud Run will sometimes create multiple instances at startup due to a GET request from Twitter during the startup process. This will cause some delay to the startup process but will not cause any other issues.
