# Dialogflow Messenger

The Dialogflow Messenger integration provides a customizable chat dialog for your agent that can be embedded in your website. The chat dialog is implemented as a dialog window that can be opened and closed by your end-user. When opened, the chat dialog appears above your content in the lower right side of the screen.

## Run Messenger Locally

Follow these steps to begin running the Messenger locally:


Step 1: Run `git clone` to locally clone this repository

Step 2: Navigate to this newly cloned repo, and run `cd dialogflow-messenger` to enter the Dialogflow Messenger folder

Step 3: Run `npm install` to install all necessary dependencies

Step 4: Run the app in development mode using `npm run start`.


The `<df-messenger />` tag can be customized, to change the agent or pass additional parameters, in `public/index.html` (line 32).

IMPORTANT: Before running locally, add api-uri attribute to `<df-messenger />` tag to connect Dialogflow Messenger to agent.

Open http://localhost:3000 to view it in the browser.

The page will reload if you make edits.

## HTML Customizations

You can customize various aspects for how the chat dialog appears and behaves. The df-messenger HTML element has the following attributes:

Attribute |	Input policy | Value
----------|--------------|------
api-uri | Required | URI of API associated with Dialogflow agent.
chat-icon | Optional | Icon used for the chat dialog open button. The Dialogflow icon is the default. This field must be a public URL. The icon size should be 36px by 36px.
chat-title | Required	| Title displayed at the top of the chat dialog. This is prepopulated with your agent's name.
expand | Optional | Boolean attribute that sets the chat dialog to be open when the page loads. By default, the chat dialog is closed when the page loads.
language-code	| Required | Default language code for the first intent. This is prepopulated with English, if no language-code is supplied.

## Build Messenger Widget

The messenger can be compiled into a widget using the command `npm run build:widget`.

The compiles the React project into a .js and .css file found in /widget.
