/**
 * @fileoverview The client side messenger javascript for the appointment
 * booking prebuilt agent.
 */
let wasFirstRequestSent = false;
window.addEventListener('df-request-sent', (event) => {
  if (!wasFirstRequestSent) {
    event.preventDefault();
    wasFirstRequestSent = true;
    dfMessenger.setQueryParameters(
        {parameters: {'user-token': dfMessenger.accessToken}});
    dfMessenger.sendQuery(event.detail.data.requestBody.queryInput.text.text);
  }
});

window.addEventListener('df-response-received', (event) => {
  const responseEvent = event?.detail?.raw?.queryResult?.match?.event;
  if (responseEvent === 'flow.failed') {
    console.log('Got a flow.failed event; asking agent to recover');
    dfMessenger.sendQuery(
        'tell me that you can only help me with [insert what you do] and please try again');
  }
});
