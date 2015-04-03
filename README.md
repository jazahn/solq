Demo here: [https://jazahn.github.io/solq/](https://jazahn.github.io/solq/)

# solq
This is a prototype for a language lab tool making use of HTML5 audio. Project name of *Soliloquy*.

## Inspired technically by 
 * [Web Audio Demo](http://webaudiodemos.appspot.com/AudioRecorder/index.html) 
 * [Web Audio Demo's Github](https://github.com/cwilso/AudioRecorder)
 
### Alters and makes use of:
 * [recorder.js](https://github.com/mattdiamond/Recorderjs)
 
## Inspired by Steven Clancy's "timevine" idea:
 ![timevine](https://raw.github.com/jazahn/solq/gh-pages/media/timevine.jpg)

## Dependencies
 * jQuery
 * [RequireJS](http://requirejs.org/)
 * [Bootstrap](http://getbootstrap.com/) (just for glyphicons)

## Running locally
You're going to want to run this in dev via an https server, otherwise you'll have to "allow" use of microphone on every reload. I like node's http-server: `npm install -g http-server`

### Creating SSL certs
Using http-server with SSL means using the '-S' flag. This is going to need ssl certs. To create them:
 * `openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out key.pem`
 * `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`

Now you can use `http-server -S`
