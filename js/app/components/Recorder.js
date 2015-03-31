/**
 * code adapted from https://github.com/mattdiamond/Recorderjs
 * MIT License
 */
define([], function(){
    /**
     *
     * @param config
     * @constructor
     */
    var WORKER_PATH = 'js/lib/recorderWorker.js';

    var Recorder = function(source, cfg){
        var config = cfg || {};
        var bufferLen = config.bufferLen || 4096;
        var numChannels = config.numChannels || 2;
        this.context = source.context;
        this.node = (this.context.createScriptProcessor ||
        this.context.createJavaScriptNode).call(this.context,
            bufferLen, numChannels, numChannels);
        var worker = new Worker(config.workerPath || WORKER_PATH);
        worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: numChannels
            }
        });
        var recording = false,
            currCallback;

        this.node.onaudioprocess = function(e){
            if (!recording) return;
            var buffer = [];
            for (var channel = 0; channel < numChannels; channel++){
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        this.configure = function(cfg){
            for (var prop in cfg){
                if (cfg.hasOwnProperty(prop)){
                    config[prop] = cfg[prop];
                }
            }
        };

        this.record = function(){
            recording = true;
        };

        this.stop = function(){
            recording = false;
        };

        this.clear = function(){
            worker.postMessage({ command: 'clear' });
        };

        this.getBuffer = function(cb) {
            currCallback = cb || config.callback;
            worker.postMessage({ command: 'getBuffer' })
        };

        this.exportWAV = function(cb, type){
            currCallback = cb || config.callback;
            type = type || config.type || 'audio/wav';
            if (!currCallback) throw new Error('Callback not set');
            worker.postMessage({
                command: 'exportWAV',
                type: type
            });
        };

        worker.onmessage = function(e){
            var blob = e.data;
            currCallback(blob);
        };

        source.connect(this.node);
        this.node.connect(this.context.destination);    //this should not be necessary
    };
    Recorder.prototype.doneEncoding = function(blob){
        Recorder.forceDownload( blob, "myRecording.wav" );
    };

    Recorder.forceDownload = function(blob, filename){
        var url = (window.URL || window.webkitURL).createObjectURL(blob);
        var link = window.document.createElement('a');
        link.href = url;
        link.download = filename || 'output.wav';
        var click = document.createEvent("Event");
        click.initEvent("click", true, true);
        link.dispatchEvent(click);
    };

    /**
     * convenience function for setting up the getUserMedia
     * mostly adapted from: https://github.com/cwilso/AudioRecorder
     * @return {Recorder}
     */
    Recorder.start = function(callback){
        var recorder;

        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

        navigator.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, function(stream){

                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                var audioContext = new AudioContext();
                var inputPoint = audioContext.createGain();

                // Create an AudioNode from the stream.
                realAudioInput = audioContext.createMediaStreamSource(stream);
                audioInput = realAudioInput;
                audioInput.connect(inputPoint);

                // audioInput = convertToMono( input );

                analyserNode = audioContext.createAnalyser();
                analyserNode.fftSize = 2048;
                inputPoint.connect( analyserNode );

                recorder = new Recorder( inputPoint );
                callback(recorder);

            }, function(e) {
                alert('Error getting audio');
                console.log(e);
            });

    };


    return Recorder;

});