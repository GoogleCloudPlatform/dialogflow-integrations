const express = require('express');
const handlers = require('./request_handlers');

const app = express();
app.use(express.json());

app.post('/', (req, res, next) => handlers
  .handleEndUserMessageFromCcaasPostRequest(req, res)
  .then((response) => {
    res.send({ status: 'OK' });
    return response;
  })
  .catch((error) => {
    console.log(error);
    next(new Error('Cannot process request'));
  }));
app.get('/', handlers.handleGetRequest);

const port = process.env.PORT;
const listener = app.listen(port, () => {
  console.log(`Server is listening on port ${listener.address().port}`);
});

process.on('SIGTERM', () => {
  listener.close(async () => {
    process.exit(0);
  });
});

module.exports = { app, listener };
