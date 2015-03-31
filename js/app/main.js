require(["jquery", "Player"], function($, Player) {
    $(document).ready(function(){
        var initial_player_config = {
            music: document.getElementById('music'),
            playButton: document.getElementById('pButton'),
            recordButton: document.getElementById('rButton'),
            playhead: document.getElementById('playhead'),
            timeline: document.getElementById('timeline')
        };
        var initialPlayer = new Player(initial_player_config);




    });


});