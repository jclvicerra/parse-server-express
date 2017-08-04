require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const errorHandler = require('errorhandler')
const ParseServer = require('parse-server').ParseServer;
const path = require('path');
const http = require('http')
const liveQueryJson = require('./liveQuery.json');

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
    classNames: liveQueryJson // List of classes to support for query subscriptions
  },
  verifyUserEmails: true,
  emailVerifyTokenValidityDuration: 2 * 60 * 60, // in seconds (2 hours = 7200 seconds)
  preventLoginWithUnverifiedEmail: false, // defaults to false
  appName: process.env.APP_NAME,

  emailAdapter: {
    module: 'parse-server-simple-mailgun-adapter',
    options: {
      // The address that your emails come from
      fromAddress: process.env.MAILGUN_FROM_ADDRESS,
      // Your domain from mailgun.com
      domain: process.env.MAILGUN_DOMAIN,
      // Your API key from mailgun.com
      apiKey: process.env.MAILGUN_API_KEY,
      // templates: {
      //   passwordResetEmail: {
      //     subject: 'Reset your password',
      //     pathPlainText: resolve(__dirname, 'path/to/templates/password_reset_email.txt'),
      //     pathHtml: resolve(__dirname, 'path/to/templates/password_reset_email.html'),
      //     callback: (user) => { return { firstName: user.get('firstName') }}
      //     // Now you can use {{firstName}} in your templates 
      //   },
      //   verificationEmail: {
      //     subject: 'Confirm your account',
      //     pathPlainText: resolve(__dirname, 'path/to/templates/verification_email.txt'),
      //     pathHtml: resolve(__dirname, 'path/to/templates/verification_email.html'),
      //     callback: (user) => { return { firstName: user.get('firstName') }}
      //     // Now you can use {{firstName}} in your templates 
      //   },
      //   customEmailAlert: {
      //     subject: 'Urgent notification!',
      //     pathPlainText: resolve(__dirname, 'path/to/templates/custom_alert.txt'),
      //     pathHtml: resolve(__dirname, 'path/to/templates/custom_alert.html'),
      //   }
      // }
    },
  },
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

