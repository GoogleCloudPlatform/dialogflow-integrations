# Spark Integration

## Setup

### Prerequisites

In order, to setup this integration, you must do the following first:
- Create a [Spark account](https://teams.webex.com/signin)
- Clone the [git repo](https://OUR_GIT_REPO)

### Create the Spark Bot

Login to Spark and go the
[New Bot page](https://developer.webex.com/my-apps/new/bot). Fill in the
required fields with what you want, and then click the Add Bot button. On the
next screen you should see a box with your __bot's access Token__. Set the
constant sparkAccessToken in server.js to this value.

![alt text](images/spark-create-the-spark-bot.png)

### Setting the URL

Set the constant targetUrl in server.js to your server's URL that you will use
for your webhook. If you are using Google's Cloud Run to obtain your URL, deploy
your server according to the instructions in the main README file first. This
should give you your URL. Then, update your container and redeploy after you
have added the URL to server.js.