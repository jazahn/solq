define([], function(){
    var Player = function(config){
        this.config = config || {};
        this.config = {
            music: config.music || '',
            playButton: config.playButton || '',
            playhead: config.playHead || '',
            timeline: config.timeline || '',
        };
        this.timelineWidth = 0;
        this.duration = 10;

        // Boolean value so that mouse is moved on mouseUp only when the playhead is released
        var onplayhead = false;

        this.init();

    };
    Player.prototype.init = function(){
        var that = this;

        this.timelineWidth = this.config.timeline.offsetWidth - this.config.playhead.offsetWidth;
        this.config.music.addEventListener("timeupdate", function(){ that.timeUpdate(); }, false);
        this.config.timeline.addEventListener("click", function (event) {
            that.moveplayhead(event);
            that.config.music.currentTime = that.duration * that.clickPercent(event);
        }, false);

        // Makes playhead draggable
        this.config.playhead.addEventListener('mousedown', function(e){ that.mouseDown(e); }, false);
        window.addEventListener('mouseup', function(e){ that.mouseUp(e); }, false);

        // Gets audio file duration
        this.config.music.addEventListener("canplaythrough", function () {
            that.duration = that.config.music.duration;
        }, false);

        // forcing load so we can get the duration
        this.config.music.load();
        this.config.playButton.addEventListener('click', function(e){
            // start music
            if (that.config.music.paused) {
                that.config.music.play();
                // remove play, add pause
                that.config.playButton.className = "";
                that.config.playButton.className = "pause";
            } else { // pause music
                that.config.music.pause();
                // remove pause, add play
                that.config.playButton.className = "";
                that.config.playButton.className = "play";
            }
        }, false);

    };
    Player.prototype.timeUpdate = function(){
        var playPercent = this.timelineWidth * (this.config.music.currentTime / this.duration);
        this.config.playhead.style.marginLeft = playPercent + "px";
        if (this.config.music.currentTime == this.duration) {
            this.config.playButton.className = "";
            this.config.playButton.className = "play";
        }
    };
    // returns click as decimal (.77) of the total timelineWidth
    // click listener
    Player.prototype.clickPercent = function(e) {
        return (e.pageX - this.config.timeline.offsetLeft) / this.timelineWidth;
    };
    // mouseDown EventListener
    Player.prototype.mouseDown = function() {
        var that = this;
        this.onplayhead = true;
        this.currentMousemoveListener = function(e){ that.moveplayhead(e); };
        window.addEventListener('mousemove', this.currentMousemoveListener, true);
        this.config.music.removeEventListener('timeupdate', this.timeUpdateListener, false);
    };
    // mouseUp EventListener
    // getting input from all mouse clicks
    Player.prototype.mouseUp = function(e) {
        var that = this;
        if (this.onplayhead == true) {
            window.removeEventListener('mousemove', this.currentMousemoveListener, true);
            // change current time
            this.config.music.currentTime = this.duration * this.clickPercent(e);
            this.timeUpdateListener = function(){ that.timeUpdate(); };
            this.config.music.addEventListener('timeupdate', this.timeUpdateListener, false);
        }
        this.onplayhead = false;
    };
    // mousemove EventListener
    // Moves playhead as user drags
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
    //Play and Pause
    Player.prototype.play = function(e) {
        // start music
        if (this.config.music.paused) {
            this.config.music.play();
            // remove play, add pause
            this.config.playButton.className = "";
            this.config.playButton.className = "pause";
        } else { // pause music
            this.config.music.pause();
            // remove pause, add play
            this.config.playButton.className = "";
            this.config.playButton.className = "play";
        }
    };



    Player.prototype.createPlayer = function(location){

    };

    return Player;

});