/*
	ODI Leeds Log
	Web usage monitoring with less privacy invasion
	Version: 2021-05-19
*/
(function(root){
	if(!root.ODI) root.ODI = {};
	var l = location;
	function ok(t){
		if(typeof t!=="object" || t.length <= 0) return true; // If no array provided allow to pass
		for(i=0;i<t.length;i++){
			if(t[i]==l.host) return true; // If the host matches allow to pass
		}
		return false; // You shall not pass!
	}
	function Log(){
		var id,de,re,rg,sz,ua,tg;
		de = "https://odileeds.org/log";
		re = document.referrer;
		rg = new RegExp(l.origin,"g");
		if(re.indexOf(l.origin)==0) re = re.replace(rg,"");
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
			if(l.protocol=='file:') return this;
			// If explicit targets set only allow them
			if(!ok(tg)) return this;
			var r = new XMLHttpRequest();
			r.open('POST',de,true);
			r.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
			if(typeof cb==="function") r.onload = cb;
			r.send((id ? 'oid='+id+'&':'')+'url='+l.href+'&'+(re ? 'ref='+re+'&':'')+(sz ? 'size='+sz+'&':'')+txt);
			return this;
		}
		return this;
	}
	root.ODI.log = new Log();
})(window || this);
