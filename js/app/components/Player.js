define(["jquery", "Recorder"], function($, Recorder){
    /**
     *
     * @param config
     * @constructor
     */
    var Player = function(config){
        config = config || {};
        var defaultConfig = {
            music: '',
            playButton: '',
            recordButton: '',
            playhead: '',
            timeline: ''
        };
        this.config = $.extend(defaultConfig, config);
        this.timelineWidth = 0;
        this.duration = 0;

        // Boolean value so that mouse is moved on mouseUp only when the playhead is released
        this.onplayhead = false;

        // setting the context of the following event handlers
        this.timeUpdate = $.proxy(this.timeUpdate, this);
        this.mouseDown = $.proxy(this.mouseDown, this);
        this.mouseUp = $.proxy(this.mouseUp, this);
        this.moveplayhead = $.proxy(this.moveplayhead, this);
        this.play = $.proxy(this.play, this);
        this.record = $.proxy(this.record, this);
        this.init();

    };

    /**
     * initializing the eventListeners
     */
    Player.prototype.init = function(){
        var that = this;

        this.timelineWidth = this.config.timeline.offsetWidth - this.config.playhead.offsetWidth;
        this.config.music.addEventListener("timeupdate", this.timeUpdate, false);
        this.config.timeline.addEventListener("click", function (event) {
            that.moveplayhead(event);
            that.config.music.currentTime = that.duration * that.clickPercent(event);
        }, false);

        // Makes playhead draggable
        this.config.playhead.addEventListener('mousedown', this.mouseDown, false);
        window.addEventListener('mouseup', this.mouseUp, false);

        // Gets audio file duration as soon as that audio stops buffering
        this.config.music.addEventListener("canplaythrough", function () {
            that.duration = that.config.music.duration;
        }, false);

        // forcing load so we can get the duration earlier
        this.config.music.load();

        this.config.playButton.addEventListener('click', this.play, false);

        this.config.recordButton.addEventListener('click', this.record, false);

    };

    /**
     * moves playhead along the timeline
     */
    Player.prototype.timeUpdate = function(){
        var playPercent = this.timelineWidth * (this.config.music.currentTime / this.duration);
        this.config.playhead.style.marginLeft = playPercent + "px";
        if (this.config.music.currentTime == this.duration) {
            this.$playButtonImage.removeClass("glyphicon-pause");
            that.$playButtonImage.addClass("glyphicon-play");
        }
    };

    /**
     * returns click as decimal (.77) of the total timelineWidth
     * click listener
     * @param {event} e
     * @returns {number}
     */
    Player.prototype.clickPercent = function(e) {
        return (e.pageX - this.config.timeline.offsetLeft) / this.timelineWidth;
    };

    /**
     * mouseDown EventListener
     */
    Player.prototype.mouseDown = function() {
        var that = this;
        this.onplayhead = true;
        window.addEventListener('mousemove', this.moveplayhead, true);
        this.config.music.removeEventListener('timeupdate', this.timeUpdate, false);
    };

    /**
     * mouseUp EventListener
     * @param {event} e
     */
    Player.prototype.mouseUp = function(e) {
        var that = this;
        if (this.onplayhead == true) {
            window.removeEventListener('mousemove', this.moveplayhead, true);
            // change current time
            this.config.music.currentTime = this.duration * this.clickPercent(e);
            this.config.music.addEventListener('timeupdate', this.timeUpdate, false);
        }
        this.onplayhead = false;
    };
    /**
     * mousemove EventListener
     * moves playhead as user drags
     * @param {event} e
     */
    Player.prototype.moveplayhead = function(e) {
        var newMargLeft = e.pageX - this.config.timeline.offsetLeft;
        if (newMargLeft >= 0 && newMargLeft <= this.timelineWidth) {
            this.config.playhead.style.marginLeft = newMargLeft + "px";
        }
        if (newMargLeft < 0) {
            this.config.playhead.style.marginLeft = "0px";
        }
        if (newMargLeft > this.timelineWidth) {
            this.config.playhead.style.marginLeft = this.timelineWidth + "px";
        }
    };
    /**
     * Play and Pause toggle
     */
    Player.prototype.play = function(e) {
        this.$playButtonImage = $(this.config.playButton).find(".glyphicon");
        // start music
        if (this.config.music.paused) {
            this.config.music.play();
            // remove play, add pause
            this.$playButtonImage.removeClass("glyphicon-play");
            this.$playButtonImage.addClass("glyphicon-pause");
        } else { // pause music
            this.config.music.pause();
            // remove pause, add play
            this.$playButtonImage.removeClass("glyphicon-pause");
            this.$playButtonImage.addClass("glyphicon-play");
        }
    };
    /**
     * Creates a player object, based on a recording
     * this happens after the recording is done
     */
    Player.prototype.sprout = function(){


    };
    /**
     * Starts recording from this Player
     */
    Player.prototype.record = function(e){
        var that = this;
        if(this.recording == true){
            this.config.recordButton.style.color = "black";
            this.recording = false;
            this.recorder.stop();
            this.recorder.exportWAV(this.recorder.doneEncoding);

        } else {
            this.config.recordButton.style.color = "red";
            this.recording = true;
            // TODO: stop the player

            // TODO: start recording
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

                    that.recorder = new Recorder( inputPoint );
                    that.recorder.record();

                }, function(e) {
                    alert('Error getting audio');
                    console.log(e);
                });






        }


    };

    return Player;

});