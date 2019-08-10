# Kik Integration

## Setup

### Prerequisites

In order to setup this integration, you must do the following first:
- Download the Kik app on your mobile device
- Setup Kik account on that device
- Clone the [git repo](https://OUR_GIT_REPO)

### Creating the Bot

Open the Kik Bot Dashboard at [dev.kik.com](https://dev.kik.com). Open the kik app on your mobile
device. If using an iOS device, hit the plus button in the top right corner. If using an android
device, hit the plus button on the bottom right corner. Then, hit 'scan a kik code' to scan the kik
code shown in the [Kik Bot Dashboard](https://dev.kik.com). 

![Kik Bot Dashboard Kik Code](./images/KikBotDashboard-KikCode.png)

In the Kik app, in the chat with Botsworth, enter a name for your bot and tap the __Yes__ button to
confirm.

### Obtain Kik Credentials

Login to the [Kik Bot Dashboard](https://dev.kik.com). At the top of the page, click Configuration.

![Kik Bot Dashboard Click Configuration](./images/KikBotDashboard-ClickConfiguration.png)

In the configuration screen, take the value for __Display Name__ and __API Key__ and set these
constants to 'botName' and 'kikApiKey' respectively.

![Display Name and API Key](./images/DisplayNameAndApiKey.png)

### Setting the URL

Set the constant 'webhookUrl' in server.js to your server's URL that you will use for your webhook.
If you are using Google's Cloud Run to obtain your URL, deploy your server according to the
instructions in the main README file first. This should give you your URL. Then, update your
container and redeploy after you have added the URL to server.js.

## Additional Information

### iOS Bot Shop Information

Your bot will not be displayed in the Kik Bot Shop for iOS devices until your Apple Developer ID has
been set. To see if your Apple Developer ID has been set, go to the
[Kik Bot Dashboard](https://dev.kik.com) and go to the configuration tab. A red banner near the top
of the page will be present if your Apple Developer ID has not been set.

![Apple Developer ID Banner](./images/AppleDeveloperIdBanner.png)

Click the 'Set it now' hyperlink and insert your Apple Developer ID in the Apple Developer ID Team
field.

![Contact Settings](./images/KikContactSettings.png)

###Sending Messages

- Messages can be batched in groups of up to 25.
- Bots are allowed up to 5 messages per user per batch.

  - This limit is applied atomically to an entire batch of messages.

If a batch exceeds the 25 message limit, or you attempt to send more than 5 messages to single user
in any batch, all messages in that batch will not be sent. If you attempt to send messages to users
that are not subscribed to your bot, or have blocked your bot, the entire offending batch will not
be sent.

### Additional References

For more information on building a kik bot, go to:
- [Kik API Reference](https://dev.kik.com/#/docs/messaging)
- [Kik Github Repo](https://github.com/kikinteractive/kik-node)