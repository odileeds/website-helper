/*
	ODI Leeds Log
	Web usage monitoring with less privacy invasion
	Version: 2021-01-05
*/
(function(root){
	if(!root.ODI) root.ODI = {};
	function ok(t){
		// If no array provided allow to pass
		if(typeof t!=="object" || t.length <= 0) return true;
		for(i=0;i<t.length;i++){
			// If the host matches allow to pass
			if(t[i]==location.host) return true;
		}
		// You shall not pass!
		return false;
	}
	function Log(){
		var id,de,re,rg,sz,ua,tg;
		de = "https://odileeds.org/log";
		re = document.referrer;
		rg = new RegExp(location.origin,"g");
		if(re.indexOf(location.origin)==0) re = re.replace(rg,"");
		sz = window.innerWidth+'x'+window.innerHeight;
		this.setup = function(opt){
			if(!opt) opt = {};
			if(opt.dest) de = opt.dest;
			if(opt.id) id = opt.id;
			if(opt.target) tg = opt.target;
			tg = (typeof tg==="string" ? [tg]:tg);
			return this;
		}
		this.add = function(txt,cb){
			// Don't log local file system
			if(location.protocol=='file:') return this;
			// If explicit targets set only allow them
			if(!ok(tg)) return this;
			var req = new XMLHttpRequest();
			req.open('POST',de,true);
			req.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
			if(typeof cb==="function") req.onload = cb;
			req.send((id ? 'oid='+id+'&':'')+'url='+location.href+'&'+(re ? 'ref='+re+'&':'')+(sz ? 'size='+sz+'&':'')+txt);
			return this;
		}
		return this;
	}
	root.ODI.log = new Log();
})(window || this);
