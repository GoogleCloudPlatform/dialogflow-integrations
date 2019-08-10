# Viber Integration

## Setup

### Prerequisites

In order, to setup this integration, you must do the following first:
- Download the Viber app on your mobile device and setup account on that device
- Setup a [bot account](https://partners.viber.com)
- Clone the [git repo](https://OUR_GIT_REPO)

### Obtain Viber Credentials

Login to your [bot account](https://partners.viber.com). On the main
screen, take the value for __Token__ and __Account Name__ and set these
constants to viberToken and botName respectively. In addition, take the URL for
your bot's avatar and set the constant botAvatarLink to it.

![alt text](images/viber-obtain-viber-credentials.png)

### Setting the URL

Set the constant webhookUrl in server.js to your server's URL that you will use
for your webhook. If you are using Google's Cloud Run to obtain your URL, deploy
your server according to the instructions in the main README file first. This
should give you your URL. Then, update your container and redeploy after you
have added the URL to server.js.