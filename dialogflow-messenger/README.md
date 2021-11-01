# Dialogflow Messenger

The Dialogflow Messenger integration provides a customizable chat dialog for your agent that can be embedded in your website. The chat dialog is implemented as a dialog window that can be opened and closed by your end-user. When opened, the chat dialog appears above your content in the lower right side of the screen.

## Run Messenger Locally

In order to run the messenger locally, clone this repo, then run the app in development mode using npm run start.
The <df-messenger /> tag can be customized, to change the agent or pass additional parameters, in public/index.html.

IMPORTANT: Before running locally, add api-uri attribute to <df-messenger /> tag to connect Dialogflow Messenger to agent.

Open http://localhost:3000 to view it in the browser.

The page will reload if you make edits.

## Build Messenger Widget

The messenger can be compiled into a widget using the command npm run build:widget.

The compiles the React project into a .js and .css file found in /widget.
