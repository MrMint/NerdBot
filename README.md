Nerd Bot
=======

## What is Nerd Bot?
- Nerd Bot is a hipchat bot to facilitate all things nerd.

## Roadmap
- Allow incomplete names (search) for the card command
- Add trade command which compares the values/stats of two cards

## The nerdy details
- Node.js
- Koa.js
- Q.js
- rest.js
- Handlebars.js
- Bunyan.js
- Vagrant

##Want to contribute?
Fork the repo and create pull requests!

##To get started developing

1. Fork/Clone repo
2. Follow directions [here](https://bitbucket.org/atlassianlabs/ac-koa-hipchat) or [here](https://www.hipchat.com/docs/apiv2/quick_start)

###Tips

  * If you don't go the Vagrant route, you'll need to run your own redis server: [http://redis.io/](http://redis.io/])
    * Follow the download/compile directions, then run it with ./redis-server from the src directory
  * To expose your locally running node server you can use ngrok: [https://ngrok.com/](https://ngrok.com/)
  * You'll want to set a NERDBOT_KEY in your environment variables before you run your node server to prevent collisions 
  with other installed  NerdBots on hipchat while you're developing
  * Link to API being used for MTG cards: [https://deckbrew.com/api/](https://deckbrew.com/api/)
  * If you want your node server to reload updated files you'll need to install nodemon, which is not part of the basic node install. You can install it with npm (npm install -g nodemon).
  * Don't forget to set your own development URL in the package.config:
    * ```json
    "development": {
      "localBaseUrl" : "https://xxxxxxxx.ngrok.com",
      "port": 3000
    },
    ```