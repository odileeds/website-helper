function Constituencies(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.id = id;

	// Do we update the address bar?
	this.pushstate = !!(window.history && history.pushState);
	var _obj = this;
	window[(this.pushstate) ? 'onpopstate' : 'onhashchange'] = function(e){ if(e.state){ petition = e.state.petition; } _obj.loadResults("signature"); };

	this.hex = new HexMap({'id':id,'width':w,'height':h,'size':16,'padding':padding});

	this.hex.load(file,{me:this},function(e){
		if(petition!="") e.data.me.setColours("signature");
		S('svg').css({'display':'inline'});
		S('#'+id).css({'width':'','height':''})
	});

	function howBrexity(){
		if(!_obj.hex.data.referendum) return "";
		var max = 0;
		var c = {};
		var t = 0;
		var l = 0;
		var r = 0;
		for(var i in _obj.hex.data.signature){ max = Math.max(max,_obj.hex.data.signature[i]);  }
//		for(var i in _obj.hex.data.signature){ c[i] = (_obj.hex.data.signature[i]/max)*(_obj.hex.data.referendum[i]-0.5);  }
		for(var i in _obj.hex.data.signature){ c[i] = (_obj.hex.data.signature[i]/max)*(_obj.hex.data.referendum[i]-0.5);  }
		for(var i in _obj.hex.data.signature){
			if(_obj.hex.data.referendum[i]){
				t += (_obj.hex.data.referendum[i]-0.5);
				r += (_obj.hex.data.signature[i]/max)*(1-_obj.hex.data.referendum[i]);
				l += (_obj.hex.data.signature[i]/max)*(_obj.hex.data.referendum[i]);
			}
		}
		var v = 0;
//console.log(t,r,l,r-l)
		for(var i in c){ if(c[i]){ v += c[i]; } }
		return (l-r);
	}

	function addCommas(nStr) {
		nStr += '';
		var x = nStr.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}

	function getLabel(e,title){
		var rs = {'SC':'Scotland','NI':'Northern Ireland','WA':'Wales','NE':'North East','NW':'North West','YH':'Yorkshire &amp; Humber','WM':'West Midlands','EM':'East Midlands','EA':'East Anglia','LO':'London','SE':'South East','SW':'South West'};
		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		if(e.data.builder.by == "population") lbl = title+'<br />Population: '+e.data.pop;
		else if(e.data.builder.by == "electorate") lbl = title+'<br />Electorate: '+e.data.hexmap.mapping.hexes[e.data.region].e;
		else if(e.data.builder.by == "signature") lbl = title+'<br />Signatures: '+(e.data.hexmap.data['signature'][e.data.region]||0);
		else if(e.data.builder.by == "signaturepc") lbl = title+'<br />Signatures (% pop): '+(e.data.hexmap.data['signaturepc'][e.data.region].toFixed(2)||0);
		else if(e.data.builder.by == "signaturepcelectorate") lbl = title+'<br />Signatures (% electorate): '+(e.data.hexmap.data['signaturepcelectorate'][e.data.region].toFixed(2)||0);
		else if(e.data.builder.by == "party") lbl = title+'<br />Party: '+e.data.hexmap.data['2015'][e.data.region];
		else if(e.data.builder.by == "referendum") lbl = title+'<br />Estimated leave vote: '+(e.data.hexmap.data['referendum'][e.data.region] ? Math.round(e.data.hexmap.data['referendum'][e.data.region]*100)+'%':'unknown');
		else if(e.data.builder.by == "benefits") lbl = '<strong>'+title+'</strong><br />Percentage of constituency on income-based<br />benefits (IS/JSA/ESA): <strong>'+(e.data.hexmap.data['benefits'][e.data.region] ? (parseFloat(e.data.hexmap.data['benefits'][e.data.region]).toFixed(2))+'%':'unknown')+'</strong>';
		else if(e.data.builder.by == "candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['candidates'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong><!--<a href="https://candidates.democracyclub.org.uk/person/'+c[i].i+'">-->'+c[i].n+'<!--</a>--></strong> - '+c[i].p;
			}
		}else if(e.data.builder.by == "gender"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['gender'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong>'+c[i].n+'</strong> - '+c[i].p+' ('+(c[i].g=="f" ? "Female" : (c[i].g=="m" ? "Male": (c[i].g ? "Diverse":"Unknown")))+')';
			}
		}else lbl = title+'<br />Region: '+rs[e.data.hexmap.mapping.hexes[e.data.region].a];
		return lbl;
	}	
	this.hex.on('mouseover',{'builder':this},function(e){
		e.data.builder.label(getLabel(e,this.attr('title')));
		this.attr('fill-opacity',0.75).attr('stroke-width',4.5);
		// Simulate a change of z-index by moving this element to the end of the SVG
		this.parent()[0].appendChild(this[0]);
	}).on('mouseout',function(e){
		S('.infobubble').remove();
		this.attr('fill-opacity',0.5).attr('stroke-width',1.5);
	}).on('click',{'builder':this},function(e){
		if(e.data.builder.by=="candidates"){
			location.href = "https://candidates.democracyclub.org.uk/election/parl.2017-06-08/post/WMC:"+e.data.region+"/";
		}else{
			e.data.hexmap.regionToggleSelected(e.data.region,true);
			e.data.builder.label(getLabel(e,this.attr('title')));
		}
	});
	
	
	this.label = function(l){
		if(S('.infobubble').length == 0) S('#'+this.id+'').after('<div class="infobubble"><div class="infobubble_inner"></div></div>');
		S('.infobubble_inner').html(l);
		return this;
	}

	this.saveable = (typeof Blob==="function");

	// Update text of button
	if(this.saveable){
		// Add event to button
		S('#save').on('click',{me:this},function(e){ e.data.me.save(); });
		// Add key binding
		S(document).on('keypress',function(e){
			if(e.originalEvent.charCode==109) S('#savesvg').trigger('click');     // M
			if(e.originalEvent.charCode==104) S('#save').trigger('click');     // H
		});

		// Add event to button
		S('#savesvg').on('click',{me:this},function(e){ e.data.me.saveSVG(); });

	}else{
		S('#save').css({'display':'none'});
		S('#savesvg').css({'display':'none'});
	}

	function updateClass(btn){
		S('.switchdata').addClass('b5-bg').removeClass('c10-bg');btn.removeClass('b5-bg').addClass('c10-bg');
	}
	// Add events to buttons for colour changing
	S('#colour-sig').on('click',{me:this},function(e){ e.data.me.setColours('signature'); updateClass(this); });
	S('#colour-spc').on('click',{me:this},function(e){ e.data.me.setColours('signaturepc'); updateClass(this); });
	S('#colour-sel').on('click',{me:this},function(e){ e.data.me.setColours('signaturepcelectorate'); updateClass(this); });
	S('#colour-pop').on('click',{me:this},function(e){ e.data.me.setColours('population'); updateClass(this); });
	S('#colour-ele').on('click',{me:this},function(e){ e.data.me.setColours('electorate'); updateClass(this); });
	S('#colour-reg').on('click',{me:this},function(e){ e.data.me.setColours('region'); updateClass(this); });
	S('#colour-pty').on('click',{me:this},function(e){ e.data.me.setColours('party'); updateClass(this); });
	S('#colour-ref').on('click',{me:this},function(e){ e.data.me.setColours('referendum'); updateClass(this); });
	S('#colour-can').on('click',{me:this},function(e){ e.data.me.setColours('candidates'); updateClass(this); });
	S('#colour-gen').on('click',{me:this},function(e){ e.data.me.setColours('gender'); updateClass(this); });
	S('#colour-ben').on('click',{me:this},function(e){ e.data.me.setColours('benefits'); updateClass(this); });

	this.saveSVG = function(){

		// Make hex json
		var str = this.hex.paper.canvas.html();
		this.save(str,"map.svg",'text/application/svg+xml');

		return this;
	}

	this.save = function(str,file,type){

		// Make hex json

		if(!str) str = JSON.stringify(this.hex.mapping).replace(/\}\,/g,"},\n\t\t").replace(/\}\}\}/,"}\n\t\}\n\}").replace(/\"hexes\":{/,"\n\t\"hexes\": {\n\t\t").replace(/{"layout"/,"{\n\t\"layout\"");
		if(!file) file = "test.hexjson";
		if(!type) type = 'text/application/json';

		var textFileAsBlob = new Blob([str], {type:type});
		var fileNameToSaveAs = file;
	
		function destroyClickedElement(event){ document.body.removeChild(event.target); }
		var dl = document.createElement("a");
		dl.download = fileNameToSaveAs;
		dl.innerHTML = "Download File";
		if(window.webkitURL != null){
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			dl.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}else{
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			dl.href = window.URL.createObjectURL(textFileAsBlob);
			dl.onclick = destroyClickedElement;
			dl.style.display = "none";
			document.body.appendChild(dl);
		}
		dl.click();
		return this;
	}

	this.loadResults = function(type){
		if(!type) type = "2015";

		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};
		if(type == "signature" || type == "signaturepc" || type == "signaturepcelectorate"){
			this.data["signaturepc"] = {};
			this.hex.data["signaturepc"] = {};
			this.data["signaturepcelectorate"] = {};
			this.hex.data["signaturepcelectorate"] = {};
			ttype = "signature";
			if(this.pushstate) history.pushState({petition:petition},"Hexmap","?"+petition);
			S('.loading').removeClass('loading');
			var url = (petition == 241584 ? "241584.json":'/cgi-bin/petition.pl?'+petition);
			S().ajax(url,{
				'success':function(d){
					if(!d.data){
						S('#description').html('<h2>Something went wrong</h2><p>We couldn\'t get data from the Petitions website. :(</p>');
					}else{
						for(var i = 0; i < d.data.attributes.signatures_by_constituency.length;i++){
							hex = d.data.attributes.signatures_by_constituency[i].ons_code;
							this.data["signature"][hex] = d.data.attributes.signatures_by_constituency[i].signature_count;
							this.data["signaturepc"][hex] = (100*this.data["signature"][hex]/this.hex.mapping.hexes[hex].p);
							this.data["signaturepcelectorate"][hex] = (100*this.data["signature"][hex]/this.hex.mapping.hexes[hex].e);
						}
						this.hex.data[ttype] = this.data[ttype];
						this.hex.data["signaturepc"] = this.data["signaturepc"];
						this.hex.data["signaturepcelectorate"] = this.data["signaturepcelectorate"];
						this.setColours("signature");
						link = d.links.self.replace(/.json/,"");
						S('#description').html('<h2><a href="'+link+'">'+d.data.attributes.action+'</a></h2><p>'+d.data.attributes.background+'</p><p><a href="'+link+'">More information</a> or <a href="http://petitionmap.unboxedconsulting.com/?petition='+petition+'">view this petition on a geographic map</a>.</p><p id="signatures"><span class="bignumber">'+addCommas(d.data.attributes.signature_count)+'</span> signatures</p>');
					}
				},
				'this': this,
				'error':function(err){
					S('#description').html('<h2>Something went wrong</h2><p>We couldn\'t get data from the Petitions website. :(</p>');
				},
				'dataType':'json'
			});
		}
		if(type == "referendum"){
			S().ajax('../hexmaps/data/2016referendum-estimates.csv',{
				'success':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = parseFloat(c[1]);
					}
					this.hex.data[type] = this.data[type];
					this.setColours("referendum");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});
		}
		if(type == "candidates" || type == "gender"){
			S().ajax('../hexmaps/data/2017ge-candidates.json',{
				'success':function(d){
					this.data["candidates"] = d;
					this.hex.data["candidates"] = this.data["candidates"];
					this.setColours("candidates");
					this.data["gender"] = d;
					this.hex.data["gender"] = this.data["gender"];
					this.setColours("gender");
				},
				'this': this,
				'error':function(){},
				'dataType':'json'
			});
		}
		if(type == "benefits"){
			S().ajax('../hexmaps/data/2017benefits.csv',{
				'success':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/g,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[8];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("benefits");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});
		}
		if(type == "2015"){
			ttype = "2015";
			S().ajax('../hexmaps/data/2015results.csv',{
				'success':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[1];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("party");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});		
		}
	}

	function getColour(pc,a,b){
		if(!b) b = a;
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}
	function makeGradient(a,b){
		if(!b) b = a;
		return 'background: '+a.hex+'; background: -moz-linear-gradient(left, '+a.hex+' 0%, '+b.hex+' 100%);background: -webkit-linear-gradient(left, '+a.hex+' 0%,'+b.hex+' 100%);background: linear-gradient(to right, '+a.hex+' 0%,'+b.hex+' 100%);';
	}

	this.setColours = function(type){
		if(!type) type = "region";
		this.by = type;
		if(type == "signature" && (!this.data || !this.data["signature"])) return this.loadResults("signature");
		if(type == "signaturepc" && (!this.data || !this.data["signaturepc"])) return this.loadResults("signaturepc");
		if(type == "signaturepcelectorate" && (!this.data || !this.data["signaturepcelectorate"])) return this.loadResults("signaturepcelectorate");
		if(type == "party" && (!this.data || !this.data["2015"])) return this.loadResults("2015");
		if(type == "referendum" && (!this.data || !this.data["referendum"])) return this.loadResults("referendum");
		if(type == "candidates" && (!this.data || !this.data["candidates"])) return this.loadResults("candidates");
		if(type == "gender" && (!this.data || !this.data["gender"])) return this.loadResults("gender");
		if(type == "benefits" && (!this.data || !this.data["benefits"])) return this.loadResults("benefits");

		var key = "";

		// Set the function for changing the colours
		if(type == "signature"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			var min = 0;
			var max = -1e12;
			for(var r in this.data[type]){
				if(this.data[type][r] < min) min = this.data[type][r];
				if(this.data[type][r] > max) max = this.data[type][r];
			}
			this.hex.setColours = function(region){
				var value = (this.data['signature'][region] - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = min+' <span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+max+' signatures';
		}
		if(type == "signaturepc"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			var min = 0;
			var max = -1e12;
			// Build data
			for(var r in this.data[type]){
				if(this.data[type][r] < min) min = this.data[type][r];
				if(this.data[type][r] > max) max = this.data[type][r];
			}
			this.hex.setColours = function(region){
				var value = (this.data['signaturepc'][region] - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = min.toFixed(2)+'% <span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+max.toFixed(2)+'% of population';
		}
		if(type == "signaturepcelectorate"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			var min = 0;
			var max = -1e12;
			// Build data
			for(var r in this.data[type]){
				if(this.data[type][r] < min) min = this.data[type][r];
				if(this.data[type][r] > max) max = this.data[type][r];
			}
			this.hex.setColours = function(region){
				var value = (this.data['signaturepcelectorate'][region] - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = min.toFixed(2)+'% <span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+max.toFixed(2)+'% of electorate';
		}
		if(type == "population"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var min = 50000;
			var max = 80000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].p - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+min+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+max;
		}
		if(type == "electorate"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var min = 25000;
			var max = 150000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].e - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+min+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+max;
		}
		if(type == "party"){
			var names = {'Con':'Conservative','Lab':'Labour','LD':'Lib Dem','PC':'Plaid Cymru','Ind':'Independent','Spk':'Speaker'};
			var p = {'Con':'#2254F4','Lab':'#D60303','LD':'#F9BC26','SNP':'#FF6700','PC':'#1DD3A7','UKIP':'#722EA5','Green':'#0DBC37','DUP':'#4f4c9a','SDLP':'#fbb675','SF':'#b6c727','UUP':'#EF3AAB','Ind':'#dfdfdf','Spk':'#909090'};
			this.hex.setColours = function(region){
				r = this.data["2015"][region];
				return (p[r] || '#000');
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}
		if(type == "referendum"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#2254F4');
			this.hex.setColours = function(region){
				return getColour(1 - (this.data["referendum"][region]-0.2)/0.6,a,b);
			}
			key = 'leave<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>remain';
		}
		if(type == "benefits"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			this.hex.setColours = function(region){
				if(this.data["benefits"][region]) return getColour(Math.min(1,(this.data["benefits"][region])/10),a,b);
				else return '';
			}
			key = 'Percentage of constituency on income-based benefits (IS/JSA/ESA)<br />0%<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>10%+';
		}
		if(type == "candidates"){
			var levels = {0:'#2254F4',1:'#178CFF',2:'#00B6FF',3:'#08DEF9',4:'#1DD3A7',5:'#67E767',6:'#F9BC26'};
			this.hex.setColours = function(region){
				var n = this.data["candidates"][region].length;
				var c = '#2254F4';
				if(n > 0) c = (levels[n] || levels[6]);
				return c;
			}
			key = '0';
			for(var n in levels){
				key += '<span style="background-color:'+levels[n]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>';
			}
			key += '&ge;6';
		}
		if(type == "gender"){
			var c = new Colour('#0DBC37');
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			this.hex.setColours = function(region){
				var m = 0;
				var f = 0;
				for(var i = 0; i < this.data["gender"][region].length; i++){
					if(this.data["gender"][region][i].g=="f") f++;
					if(this.data["gender"][region][i].g=="m") m++;
				}
				var t = m + f;
				this.data["gender"][region].ratio = (t > 0 ? (m/(m+f)) : 0.5);
				return getColour(this.data["gender"][region].ratio,a,c);
			}
			key = 'The gender-split of candidates in each constituency<br />male<span style="'+makeGradient(c,a)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>female';

		}
		if(type == "region"){
			var names = {'YH':'Yorkshire and Humber','EM':'East Midlands','WM':'West Midlands','EA':'East Anglia','NI':'Northern Ireland','WA':'Wales','NW':'North West','NE':'North East','SE':'South East','SW':'South West','SC':'Scotland','LO':'London'};
			var rs = {'YH':'#F9BC26','EM':'#00B6FF','WM':'#E6007C','EA':'#FF6700','SC':'#2254F4','NI':'#722EA5','WA':'#0DBC37','NW':'#1DD3A7','NE':'#D60303','SW':'#178CFF','LO':'#D73058','SE':'#67E767'};
			this.hex.setColours = function(region){
				var r = this.mapping.hexes[region].a;
				return (rs[r] || this.colour.on);
			}
			for(var r in rs){
				key += '<span style="background-color:'+rs[r]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[r] || r);
			}
		}
		
		S('#key').html((key ? key:''));

		this.hex.updateColours();

		if(S('#brexity').length == 0) S('#hexmap').before('<div id="brexity"></div>');
		var brexit = (howBrexity()||"");
		var html = "";
		if(brexit) html += (Math.abs(brexit) > 9 ? 'This petition correlates with <strong class="strip-white '+(brexit >= 0 ? 'c1-bg':'c14-bg')+'">'+(brexit > 0 ? "Leave":"Remain")+'</strong> with a score of '+brexit.toFixed(1) : brexit.toFixed(1));
		S('#brexity').html(html);

		return this;
	}

	return this;

}
