define(["jquery", "Recorder"], function($, Recorder){
    /**
     *
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
        this.recording = false;

        if(this.config.playButton == ''){
            this.createPlayButton();
        }

        // Boolean value so that mouse is moved on mouseUp only when the playhead is released
        this.onplayhead = false;

        // setting the context of the following event handlers
        this.timeUpdate = $.proxy(this.timeUpdate, this);
        this.mouseDown = $.proxy(this.mouseDown, this);
        this.mouseUp = $.proxy(this.mouseUp, this);
        this.moveplayhead = $.proxy(this.moveplayhead, this);
        this.toggle = $.proxy(this.toggle, this);
        this.record = $.proxy(this.record, this);
        this.onrecorderstart = $.proxy(this.onrecorderstart, this);

        this.listen();

    };

    /**
     *
     */
    Player.prototype.createPlayButton = function(){

        var left = parseInt(this.config.timeline.style.left || 0);

        // have to get it this way because the top is computed via the class
        var timelineTop = window.getComputedStyle(this.config.timeline).getPropertyValue("top");
        var top = parseInt(timelineTop || 0) + parseInt(this.config.timeline.style.height || 0);

        this.config.playButton = document.createElement("div");
        this.config.playButton.style.left = left + "px";
        this.config.playButton.style.top = top + "px";
        this.config.playButton.className = "branchPlayerBtn";
        this.config.playButton.position = "absolute";

        //<span class="glyphicon glyphicon-play" aria-hidden="true"></span>
        var glyph = document.createElement("span");
        glyph.className = "glyphicon glyphicon-play";
        glyph.setAttribute("aria-hidden", "true");
        this.config.playButton.appendChild(glyph);
        this.config.timeline.parentNode.appendChild(this.config.playButton);
    };

    /**
     * initializing the eventListeners
     */
    Player.prototype.listen = function(){
        var that = this;

        this.timelineWidth = this.config.timeline.offsetWidth - this.config.playhead.offsetWidth;
        this.config.music.addEventListener("timeupdate", this.timeUpdate, false);
        this.config.timeline.addEventListener("click", function (event) {
            that.moveplayhead(event);
            that.config.music.currentTime = that.duration * that.clickPercent(event);
        }, false);

        // Makes playhead draggable
        if(this.config.playhead) {
            this.config.playhead.addEventListener('mousedown', this.mouseDown, false);
            window.addEventListener('mouseup', this.mouseUp, false);
        }

        // Gets audio file duration as soon as that audio stops buffering
        this.config.music.addEventListener("canplaythrough", function () {
            that.duration = that.config.music.duration;
        }, false);

        // forcing load so we can get the duration earlier
        this.config.music.load();

        this.config.playButton.addEventListener('click', this.toggle, false);

        if(this.config.recordButton){
            this.config.recordButton.addEventListener('click', this.record, false);
        }

    };

    /**
     * moves playhead along the timeline
     */
    Player.prototype.timeUpdate = function(){
        var playPercent = this.timelineWidth * (this.config.music.currentTime / this.duration);
        this.config.playhead.style.left = playPercent + "px";
        if (this.config.music.currentTime == this.duration) {
            this.$playButtonImage.removeClass("glyphicon-pause");
            this.$playButtonImage.addClass("glyphicon-play");
        }
    };

    /**
     * returns click as decimal (.77) of the total timelineWidth
     * click listener
     * @param {event} e
     * @returns {number}
     */
    Player.prototype.clickPercent = function(e) {
        return (e.pageX - this.config.timeline.parentNode.offsetLeft) / this.timelineWidth;
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
        var newLeft = e.pageX - this.config.timeline.parentNode.offsetLeft;
        if (newLeft >= 0 && newLeft <= this.timelineWidth) {
            this.config.playhead.style.left = newLeft + "px";
        }
        if (newLeft < 0) {
            this.config.playhead.style.left = "0px";
        }
        if (newLeft > this.timelineWidth) {
            this.config.playhead.style.left = this.timelineWidth + "px";
        }
    };

    /**
     * Play and Pause toggle
     */
    Player.prototype.toggle = function(e) {
        this.$playButtonImage = $(this.config.playButton).find(".glyphicon");
        // start music
        if (this.config.music.paused) {
            this.play();
        } else { // pause music
            this.stop();
        }
    };
    /**
     * Play
     */
    Player.prototype.play = function(){
        this.config.music.play();
        // remove play, add pause
        this.$playButtonImage.removeClass("glyphicon-play");
        this.$playButtonImage.addClass("glyphicon-pause");

    };
    /**
     * Stop!
     */
    Player.prototype.stop = function(){
        if(!this.$playButtonImage){
            this.$playButtonImage = $(this.config.playButton).find(".glyphicon");
        }

        this.config.music.pause();
        // remove pause, add play
        this.$playButtonImage.removeClass("glyphicon-pause");
        this.$playButtonImage.addClass("glyphicon-play");

    };

    /**
     * Starts recording from this Player
     * click handler, toggles recording
     * @param {event} e
     */
    Player.prototype.record = function(e){
        var that = this;
        if(this.recording == true){
            this.config.recordButton.style.color = "black";
            $(this.config.recordButton).removeClass("recording");
            this.recording = false;
            this.recorder.stop();

            // clears the interval that grows the tangent from startTangent
            window.clearInterval(this.timelineInterval);

            /*
             var blob = new Blob(decodedData, {type: "correct-mimetype/here"});
             var url = URL.createObjectURL(blob);
             audio.src = url;
             */
            this.recorder.exportWAV(function(blob){
                var newAudio = document.createElement("audio");
                newAudio.src = URL.createObjectURL(blob);

                // create new player
                var newPlayer = new Player({
                    playhead: that.config.playhead,
                    music: newAudio,
                    timeline: that.newTimeline
                });
            });






        } else {
            this.config.recordButton.style.color = "red";
            $(this.config.recordButton).addClass("recording");
            this.recording = true;
            this.stop();
            Recorder.start(this.onrecorderstart);

        }

    };

    /**
     * callback to send to the Recorder instance so it can do its stuff and come back to this context with the recorder instance
     * @param {Recorder} recorder
     */
    Player.prototype.onrecorderstart = function(recorder){

        this.recorder = recorder;
        this.recorder.record();
        this.startTangent();

    };

    /**
     * Starts a tangent timeline on the currentTime
     */
    Player.prototype.startTangent = function(){
        var that = this;

        this.newTimeline = document.createElement("div");
        this.newTimeline.className = "timeline";
        var currentHeight = 0;
        this.newTimeline.style.width = 3 + "px";
        this.newTimeline.style.height = currentHeight + "px";
        this.newTimeline.style.left = this.config.playhead.style.left;
        this.newTimeline.style.position = "absolute";
        this.newTimeline.style.top = this.config.timeline.style.top;

        this.config.timeline.parentNode.appendChild(this.newTimeline);
        this.timelineInterval = window.setInterval(function(){
            currentHeight++;
            that.newTimeline.style.height = currentHeight + "px";
        }, 100);

    };

    return Player;

});