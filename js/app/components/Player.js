define(["jquery", "Recorder"], function($, Recorder){
    /**
     * Player object
     *
     * Currently 2 types of Players, a "trunk" and a "branch"
     *  A branch will have no record button.. but could if we wanted sub-branches..
     *  A branch is expected to not be passed a playButton, as it will generate it's own
     *  A branch is expected to take the playhead of its trunk
     *
     * @param {object} config
     * @param {audio} config.music - audio DOM element, required
     * @param {object} config.timeline - div DOM element representing the timeline, required
     * @param {object} config.playhead - div DOM element representing the playhead, required, but can be passed the same
     *  playhead as the parent "trunk" Player
     * @param {object} config.playButton - button DOM element, not required -- but will generate if not found
     * @param {object} config.recordButton - button DOM element, not required -- but expected for a trunk
     *
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

        this.duration = 0;
        this.isRecording = false;
        this.isBranch = false;
        if(this.config.playButton == ''){
            this.isBranch = true;
            this.createPlayButton();
        }

        // Boolean value so that mouse is moved on mouseUp only when the playhead is released
        this.onplayhead = false;

        /*
         * timelineWidth is matter of perspective
         * using the same variable for vertical and horizontal timelines
         */
        this.timelineWidth = 0;
        if(this.isBranch){
            this.timelineWidth = this.config.timeline.offsetHeight - this.config.playhead.offsetHeight;
        } else {
            this.timelineWidth = this.config.timeline.offsetWidth - this.config.playhead.offsetWidth;
        }

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
     * Creates a play button for a timeline without one
     */
    Player.prototype.createPlayButton = function(){

        var left = parseInt(this.config.timeline.style.left || 0) - 15;

        // have to get it this way because the top is computed via the class
        var timelineTop = window.getComputedStyle(this.config.timeline).getPropertyValue("top");
        var top = parseInt(timelineTop || 0) + parseInt(this.config.timeline.style.height || 0);

        this.config.playButton = document.createElement("button");
        this.config.playButton.className = "branchPlayerBtn";
        this.config.playButton.style.left = left + "px";
        this.config.playButton.style.top = top + "px";
        this.config.playButton.position = "absolute";

        // <span class="glyphicon glyphicon-play" aria-hidden="true"></span>
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

        this.config.music.addEventListener("timeupdate", this.timeUpdate, false);
        this.config.timeline.addEventListener("click", function (event) {
            that.moveplayhead(event);
            that.config.music.currentTime = that.duration * that.clickPercent(event.pageX);
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

        if(this.isBranch){
            this.config.playhead.style.top = playPercent + "px";
            this.config.playhead.style.left = this.config.timeline.style.left;
        } else {
            this.config.playhead.style.left = playPercent + "px";
            this.config.playhead.style.top = this.config.timeline.style.top;
        }

        if (this.config.music.currentTime == this.duration) {
            this.$playButtonImage.removeClass("glyphicon-pause");
            this.$playButtonImage.addClass("glyphicon-play");
        }
    };

    /**
     * returns click as decimal (.77) of the total timelineWidth
     * click listener
     * @param {number} pageX - comes from an event.pageX
     * @returns {number}
     */
    Player.prototype.clickPercent = function(pageX) {
        return (pageX - this.config.timeline.parentNode.offsetLeft) / this.timelineWidth;
    };

    /**
     * mouseDown EventListener
     *
     */
    Player.prototype.mouseDown = function() {
        var that = this;
        this.onplayhead = true;
        window.addEventListener('mousemove', this.moveplayhead, true);
        this.config.music.removeEventListener('timeupdate', this.timeUpdate, false);
    };

    /**
     * mouseUp EventListener
     * for when moving the playhead, on release
     * @param {event} e
     */
    Player.prototype.mouseUp = function(e) {
        var that = this;
        if (this.onplayhead == true) {
            window.removeEventListener('mousemove', this.moveplayhead, true);
            // change current time
            this.config.music.currentTime = this.duration * this.clickPercent(e.pageX);
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
        var newLeft, leftop;
        if(this.isBranch){
            newLeft = e.pageX - this.config.timeline.parentNode.offsetTop;
            leftop = "top";
        } else {
            newLeft = e.pageX - this.config.timeline.parentNode.offsetLeft;
            leftop = "left";
        }
        if (newLeft >= 0 && newLeft <= this.timelineWidth) {
            this.config.playhead.style[leftop] = newLeft + "px";
        }
        if (newLeft < 0) {
            this.config.playhead.style[leftop] = "0px";
        }
        if (newLeft > this.timelineWidth) {
            this.config.playhead.style[leftop] = this.timelineWidth + "px";
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
        if(this.isRecording == true){
            this.config.recordButton.style.color = "black";
            $(this.config.recordButton).removeClass("recording");
            this.isRecording = false;
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
            this.isRecording = true;
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