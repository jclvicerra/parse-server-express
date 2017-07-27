require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const errorHandler = require('errorhandler')
const ParseServer = require('parse-server').ParseServer;
const path = require('path');
const http = require('http')

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

const parseServerApi = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});

const app = express();

app.set('port', process.env.PORT || 1337);
app.use(logger('dev'));

// Serve the Parse API on the /parse URL prefix
const mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, parseServerApi);

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.send('hello from parse server')
})

// development only
if (app.get('env') === 'development') {
  app.use(errorHandler())
}

const httpServer = http.createServer(app)
httpServer.listen(app.get('port'), function() {
    console.log('parse-server-example running on port ' + app.get('port') + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

