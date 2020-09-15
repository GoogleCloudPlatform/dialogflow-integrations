# **ServiceNow Integration**


## 
**Setup**


### 
**Prerequisites**



*   Create a [ServiceNow Developer account](https://developer.servicenow.com/dev.do).

### 
**Configuring ServiceNow**

*   Log into your ServiceNow Developer account.  If this is the first time you are logging in, you will need to create an _Instance_.  Follow the instructions on creating an Instance and select a _Release_.  As of this writing, Paris is the latest Release and it is recommended that you choose one of the latest releases, Orlando or Paris for this integration.
*   Click on your Instance URL (ex. _https://dev10101.service-now.com/_) and log in.  You will now be logged into the admin console.
*   From the Navigation menu, search for “Scripted REST APIs” and select this option.
*   From the Scripted REST APIs menu, click on the “New” button.
*   Provide a descriptive name like “Dialogflow Post”.  The API ID field will be automatically populated after you provide a name.  Click on the “Submit” button.





![alt_text](images/snow-rest-api.png "image_tooltip")




*   You will be returned to the “Scripted REST APIs” menu.  From the list of Services, find and select the one you just created.
*   **_Make a note of the “Base API path” as you will use this value to make your Dialogflow Webhook._**





![alt_text](images/snow-base-api.png "image_tooltip")




*   Scroll down the page and on the Resources tab, click on the “New” button.

    



![alt_text](images/snow-rest-resource.png "image_tooltip")


*   On the “Scripted REST Resource” page, provide a descriptive Name and in the “HTTP method” field, select “POST”.





![alt_text](images/snow-rest-name.png "image_tooltip")
 



*   In the “Script” section, replace the code with the code in the file “servicenow.js” and then click the “Submit” button at the top.

### 
### 
**Configuring Dialogflow**


### 
    **Import Dialogflow Agent**

*   From the [Dialogflow Console](https://dialogflow.cloud.google.com/), click on the pinwheel next to the agent name to view the agent settings.
*   Select “Export and Import”.
*   Click on the “IMPORT FROM ZIP” button.
*   Select the file “Dialogflow2ServiceNow.zip”.
*   Type the word “IMPORT” in the Upload agent window; then click on the “IMPORT” button.
*   After the Import, click on the “DONE” button to close the window.
*   From the Navigation menu, click on “Intents” to view the Intents page.
*   You should now see two new Intents “incident.create” and “incident.status”.
*   Click on the “incident.create” Intent.
*   Scroll down the page and leave the “Responses” section blank.  Expand the “Fulfillment” section and switch the toggle button to enable both options as follows:





![alt_text](images/df-incident-fulfillment.png "image_tooltip")




*   Click the “Save” button at the top.  
*   Click on the “incident.status” Intent.
*   Scroll down the page and leave the “Responses” section blank.  Expand the “Fulfillment” section and switch the toggle button to enable both options as you did on the previous step.
*   Click the “Save” button at the top.

### 
    **Webhook Configuration**

*   From the Dialogflow Navigation menu, click on “Fulfillment”.
*   Switch the toggle to enable the Webhook.
*   For “URL”, enter your ServiceNow Developer Instance URL along with the “Base API Path” to the ServiceNow Scripted REST Service that you created in an earlier step.
*   For “Basic Auth”, enter the login and password.  **_Note_**: _In this example we use the Admin credentials for simplicity, but for more than a Sandbox, you would want to create a new user to make the web requests or better, configure OAuth tokens._
*   For “Headers”, enter a key of “content-type” with a value of “application/json”.  Your Webhook should look similar to this:





![alt_text](images/df-webhook.png "image_tooltip")




*   Scroll down and click on the “Save” button.

### 
**Testing the Integration**

*   You have now completed all the necessary steps and can test your integration in the “Try it now” window.
*   Try creating a ticket:





![alt_text](images/df-test-create.png "image_tooltip")




*   Try checking on the status of a ticket:

### 




![alt_text](images/df-test-status.png "image_tooltip")


*   From the ServiceNow console Navigation menu, search for “incident” and click on “Open” for a list of all open tickets.  Find the ticket you just created:





![alt_text](images/snow-open-ticket.png "image_tooltip")

