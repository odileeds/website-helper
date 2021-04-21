/**
   ODI Leeds Embed version 0.2.2
   To protect privacy we avoid including YouTube videos (and similar) in the page as iframes directly.
   Instead we have a link to the YouTube embed version and use the .external-embed class to intercept
   the click and turn it into an iframe when someone clicks. Styling is applied to the class elsewhere.
   
   <div id="player" class="external-embed">
     <div class="inner" id="player-inner"><a href="https://www.youtube.com/embed/gxipcNf1bqA?autoplay=true"><h2>Paul Connell - Founder, ODI Leeds</h2><h3>Introduction to the Northernlands3 conference</h3></a></div>
   </div>
 */
(function(root){

	var ODI = root.ODI || {};
	if(!ODI.ready){
		ODI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		}
	}

	if(!ODI.video){
		function Embed(){
			this.version = "0.2.2";
			this.players = [];
			this.playerid = 0;
			this.init = function(as){
				var i,_obj;
				_obj = this;
				for(i = 0; i < as.length; i++){
					if(as[i] && as[i].querySelector('a')){
						this.players[i] = as[i].querySelector('a');
						this.players[i].setAttribute('playerid',i);
						this.players[i].addEventListener('click',function(e){
							_obj.playerid = parseInt(e.currentTarget.getAttribute('playerid'));
							e.preventDefault();
							e.stopPropagation();
							if(ODI.log) ODI.log.add('action=play');
							if(e.currentTarget.href.indexOf(/youtube\.com/) >= 0){
								// Set up the ready code and add the scripts to the page
								if(typeof YT==="undefined" || root.onYouTubeIframeAPIReady!=="function"){
									root.onYouTubeIframeAPIReady = YTready;
									// This code loads the IFrame Player API code asynchronously.
									var tag = document.createElement('script');
									tag.src = "https://www.youtube.com/iframe_api";
									var firstScriptTag = document.getElementsByTagName('script')[0];
									firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
									return false;
								}else{
									// We already defined the ready code so just do it
									YTready(e.currentTarget);
								}
							}else{
								iframe = document.createElement('iframe');
								iframe.src = e.currentTarget.getAttribute('href');
								e.currentTarget.parentNode.replaceChild(iframe,e.currentTarget); 
							}
						});
					}
				}
				// This function creates an <iframe> (and YouTube player) after the API code downloads.
				function YTready(e){
					var v,eid,vid;
					v = ODI.video;
					eid = v.players[v.playerid].parentNode.getAttribute('id');
					vid = v.players[v.playerid].parentNode.querySelectorAll('a')[0].getAttribute('href').replace(/^.*embed\/([^\?]*)\?.*$/,function(m,p1){ return p1; });
					// Replace with YouTube object
					v.players[v.playerid] = new YT.Player(eid, {
						height: '360',
						width: '640',
						videoId: vid,
						playerVars: { 'autoplay': 1, 'controls': 1, 'modestbranding':1, 'rel': 0, 'showinfo': 0 },
						events: {
							'onReady': function(event){ event.target.playVideo(); },
							'onStateChange': function(event){ }
						}
					});
				}
				return this;
			}
			return this;
		}
		ODI.video = new Embed();
	}

	ODI.ready(function(){
		// Do we have embeds
		var as = document.querySelectorAll('.external-embed,.youtube-embed');
		if(as.length > 0) ODI.video.init(as);

	});
	root.ODI = ODI;
})(window || this);
