'use strict';

const Slack = require('slack-node');
const Config = require('../config/Config');

const DEFAULT_CHANNEL = '#block-explorer-bot';
const IMPORTANT_ENTITIES = ''; // <!channel>

const slack = new Slack();
slack.setWebhook(Config.get('SLACK_WEBHOOK'));

function sendToSlack({ channel = DEFAULT_CHANNEL, text = '', important = false }) {
  if(Config.get('NODE_ENV') === 'production') {
    const pretext = important ? IMPORTANT_ENTITIES + ' ' : '';
    slack.webhook(
      {
        channel,
        username: 'explorerBot',
        text: `${pretext}${text}`,
      },
      function(err, response) {
        // console.log({err,response});
      }
    );
  }
}

module.exports = {
  log(text) {
    sendToSlack({ text });
  },
  error(text) {
    sendToSlack({ text, important: true });
  },
};
