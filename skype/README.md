# Skype Integration

## Setup

### Prerequisites

In order, to setup this integration, you must do the following first:
- Create a
[Microsoft Azure account](http://developer.twitter.com/en/apply/user)
- Clone the [git repo](https://OUR_GIT_REPO)

### Creating the Bot

Login to Azure and go to your [portal](https://portal.azure.com/#home). Click on
create new resource, then select AI + Machine Learning and then Web App Bot.
Fill out the following form to create your bot.

![alt text](images/skype-creating-the-bot.png)

### Getting Credentials

Next go to the All Resources tab and click on your newly created bot. Go to the
configuration page and find your __MicrosoftAppId__ and
__MicrosoftAppPassword__. Set the constants appId and and appPassword to these
values.

### Setting Endpoint for Bot


If you are using Google's Cloud Run, deploy your Cloud Run server according to
the main README file in order to determine your URL. Otherwise find your
server's URL address. After you have determined your URL, go to your bot's Azure
page, and go to its settings. Under __Messaging Endpoint__, enter your server's
webhook URL.