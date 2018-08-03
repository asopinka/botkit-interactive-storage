# Botkit Interactive Storage
Simple storage for your Botkit interactive callback messages.
  
### Install

`npm install botkit-interactive-storage --save` OR  
`yarn add botkit-interactive-storage`

### Usage with Async/Await and ES6/7 syntax (New New)

Wherever you need to *save* or *retrieve* a big juicy JSON object for use in an interactive message callback, ensure you add the following:

```
var interactiveStorage = require('botkit-interactive-storage')({ mongo_uri: '<YOUR_MONGO_URL' });
```

To save your JSON message, make a call to `save`, passing in your JSON object.  You'll get an id to save as your callback_id in the Slack attachment JSON.  Example Botkit code:

```
controller.on(['direct_message','direct_mention'], async (bot, message) => {
    const cb_msg = {
        action: 'Message1_ButtonClick',
        external_object_id: 'abc123',
        external_object_link: 'google.com',
        third_party: 'Google Drive',
        other_info: 'more info you might need'
    }

    let id = null
    try {
        id = await interactiveStorage.save(cb_msg)
    }
    catch(err) {
        // there was an error, handle it gracefully
    }

    // if id !== null, we successfully saved the JSON message so we can use the id in the Slack message
    if (id !== null) {
        bot.reply(message, {
            text: 'Click a button',
            attachments: [
                {
                    callback_id: id,
                    actions: [
                        {
                            'name': 'yes',
                            'text': ':thumbsup:',
                            'value': 'yes',
                            'type': 'button',
                            'style': 'primary'
                        },
                        {
                            'name': 'no',
                            'text': ':thumbsdown:',
                            'value': 'no',
                            'type': 'button',
                            'style': 'danger'
                        }
                    ];
                }
            ]
        })
    }
})
```

To retrieve your JSON message in the interactive callback, make a call to `get`, passing in the callback_id from the message parameter object.  Example Botkit code:

```
controller.on('interactive_message_callback', async (bot, message) => {
    try {
        /* Do meaningful shit with the message */
        bot.reply(message, {
            text: `${cb_msg.third_party} button clicked`
        })
    }
    catch(err) {
        // error getting message, handle gracefully
    }
})
```

**NOTE**: `get` calls will also ***delete*** the stored message so as to save space, so you can ***only get the message once***.  Think of it like Snapchat for interactive callback messages.

### Usage with Callbacks (Old-School)

Wherever you need to *save* or *retrieve* a big juicy JSON object for use in an interactive message callback, ensure you add the following:

```
var interactiveStorage = require('botkit-interactive-storage')({ mongo_uri: '<YOUR_MONGO_URL' });
```

To save your JSON message, make a call to `save`, passing in your JSON object, and a callback.  The callback will return an error (if any), and an id to save as your callback_id in the Slack attachment JSON.  Example Botkit code:

```
controller.on(['direct_message','direct_mention'], function(bot, message) {
    var cb_msg = {
        action: 'Message1_ButtonClick',
        external_object_id: 'abc123',
        external_object_link: 'google.com',
        third_party: 'Google Drive',
        other_info: 'more info you might need'
    };
    
    interactiveStorage.save(cb_msg, function(err, id) {
        bot.reply(message, {
            text: 'Click a button',
            attachments: [
                {
                    callback_id: id,
                    actions: [
                        {
                            'name': 'yes',
                            'text': ':thumbsup:',
                            'value': 'yes',
                            'type': 'button',
                            'style': 'primary'
                        },
                        {
                            'name': 'no',
                            'text': ':thumbsdown:',
                            'value': 'no',
                            'type': 'button',
                            'style': 'danger'
                        }
                    ];
                }
            ]
        });
    });
});
```

To retrieve your JSON message in the interactive callback, make a call to `get`, passing in the callback_id from the message parameter object.  Example Botkit code:

```
controller.on('interactive_message_callback', function(bot, message) {
    interactiveStorage.get(message.callback_id, function(err, cb_msg) {
        /* Do meaningful shit with the message */
        bot.reply(message, {
            text: cb_msg.third_party + ' button clicked'
        });
    });
});
```

**NOTE**: `get` calls will also ***delete*** the stored message so as to save space, so you can ***only get the message once***.  Think of it like Snapchat for interactive callback messages.

### Local/Dev with JSON File Storage (jfs)

You can also use this on your local/dev environment with jfs by initializing the interactive storage with a `path` property like so:

```
var interactiveStorage = require('botkit-interactive-storage')({ path: './' });
```

### Changes

Fork the repo and send a pull request!  All are welcome!  If it's anything major, let me know ahead of time.

### License

MIT License

Copyright (c) 2017 Alex Sopinka

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.