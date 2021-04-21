// ODI Analytics version 1.2
(function(root){

	var ODI = root.ODI || {};
	if(!ODI.ready){
		ODI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		}
	}
	if(!ODI.ajax){
		function AJAX(url,opt){
			// Version 1.1
			if(!opt) opt = {};
			var req = new XMLHttpRequest();
			var responseTypeAware = 'responseType' in req;
			if(responseTypeAware && opt.dataType) req.responseType = opt.dataType;
			req.open((opt.method||'GET'),url+(opt.cache ? '?'+Math.random() : ''),true);
			req.onload = function(e){
				if(this.status >= 200 && this.status < 400) {
					// Success!
					var resp = this.response;
					if(typeof opt.success==="function") opt.success.call((opt['this']||this),resp,{'url':url,'data':opt,'originalEvent':e});
				}else{
					// We reached our target server, but it returned an error
					if(typeof opt.error==="function") opt.error.call((opt['this']||this),e,{'url':url,'data':opt});
				}
			};
			if(typeof opt.error==="function"){
				// There was a connection error of some sort
				req.onerror = function(err){ opt.error.call((opt['this']||this),err,{'url':url,'data':opt}); };
			}
			req.send();
			return this;
		}
		ODI.ajax = AJAX;
	}
	
	// Extend objects
	extendObject = (typeof Object.extend === 'undefined') ? function(destination, source){ for(var property in source){ if (source.hasOwnProperty(property)) destination[property] = source[property]; } return destination; } : Object.extend;

	Date.prototype.setUTCMonthStart = function(){
		this.setUTCDate(1);
		this.setUTCHours(0);
		this.setUTCMinutes(0);
		this.setUTCSeconds(0);
		this.setUTCMilliseconds(0);
		return this;
	}

	Date.prototype.setUTCNextMonthStart = function(){
		// Add on 32 days
		this.setTime(this.getTime() + 86400000*32);
		// Set to start of month
		this.setUTCMonthStart();
		return this;
	}

	Date.prototype.setUTCMonthEnd = function(i){
		// Add on 32 days
		this.setTime(this.getTime() + 86400000*32);
		this.setUTCMonthStart();
		// Subtract a second
		this.setTime(this.getTime() - 1000);
		return this;
	}

	Date.prototype.setUTCNextMonthEnd = function(){
		// Add on 32 days
		this.setTime(this.getTime() + 86400000*32);
		// Set to start of month
		this.setUTCMonthEnd();
		return this;
	}

	ODI.ready(function(){
		
		var data = {};
		
		function listenerObject(obj){
			if(!obj.events) obj.events = {};
			// Attach a handler to an event for the OSMEditor object in a style similar to that used by jQuery
			//   .on(eventType[,eventData],handler(eventObject));
			obj.on = function(ev,e,fn){
				if(typeof ev!="string") return this;
				if(typeof fn==="undefined"){
					fn = e;
					e = {};
				}else{
					e = {data:e}
				}
				if(typeof e!="object" || typeof fn!="function") return this;
				if(this.events[ev]) this.events[ev].push({e:e,fn:fn});
				else this.events[ev] = [{e:e,fn:fn}];
				return this;
			}

			// Trigger a defined event with arguments. This is for internal-use to be 
			// sure to include the correct arguments for a particular event
			obj.trigger = function(ev,args){
				if(typeof ev != "string") return;
				if(typeof args != "object") args = {};
				var ob = [];
				var i,e,t;
				if(typeof this.events[ev]=="object"){
					for(i = 0 ; i < this.events[ev].length ; i++){
						e = extendObject(this.events[ev][i].e,args);
						t = this;
						if(e['this']){
							t = e['this'];
							delete e['this'];
						}
						if(typeof this.events[ev][i].fn == "function") ob.push(this.events[ev][i].fn.call(t,e))
					}
				}
				if(ob.length > 0) return ob;
			}
			return obj;
		}
		
		function DateRangePicker(el,opts){
			this.el = el;
			var _obj = this;
			var o = document.createElement('div'); // Make output area
			this.starting = true;
			this.events = {};
			var now = new Date();
			this.range = {'start':'','end':''};

			listenerObject(this);

			this.init = function(opts){
				this.set(opts);
				o.classList.add('date-range-calendar');
				o.style = 'display:none;';
				el.insertAdjacentElement('afterend',o);
				return this;
			}

			this.set = function(opts){
				if(!this.opts) this.opts = {};
				for(var op in opts){
					if(opts[op]) this.opts[op] = opts[op];
				}
				if(!this.opts.startday) this.opts.startday = 1;

				// If we are only given a monthly string we need to make it a full date
				if(this.opts.min && this.opts.min.length == 7) this.opts.min += '-01';
				if(this.opts.max && this.opts.max.length == 7){
					this.end += '-01';
					d = new Date(this.end);
					d.setUTCMonthEnd();
					now = new Date();
					if(d > now) d = now;
					this.opts.max.length = d.toISOString().substr(0,10);
				}
				// If we are only given an hourly string we need to make it a full datetime
				if(this.opts.min && this.opts.min.length==13) this.opts.min += ':00Z';
				if(this.opts.max && this.opts.max.length==13) this.opts.max += ':00Z';

				if(opts.start && opts.end) this.setStartEnd(opts.start,opts.end);

				return this;
			}

			this.highlightDays = function(){
				var isomax = "";
				var isomin = "";
				var now = (new Date()).toISOString().substr(0,10);
				if(this.opts.max) isomax = this.opts.max;
				if(this.opts.min) isomin = this.opts.min;

				if(!this.range.start) console.warn('No start date for range');
				if(!this.range.end) console.warn('No end date for range');

				var e = this.range.end.substr(0,10);
				var s = this.range.start.substr(0,10);
				if(!this.buttons) return this;

				this.el.value = (s||"?")+" to "+(e||"?");

				for(b = 0; b < this.buttons.length; b++){
					d = this.buttons[b].d;

					if(s){
						if(this.buttons[b].el.classList.contains('range-start') && d!=s) this.buttons[b].el.classList.remove('range-start');
						if(d==s) this.buttons[b].el.classList.add('range-start');
					}
					if(e){
						if(this.buttons[b].el.classList.contains('range-end') && d!=e) this.buttons[b].el.classList.remove('range-end');
						if(d==e) this.buttons[b].el.classList.add('range-end');
					}
					if(s && e){
						if(d > s && d < e) this.buttons[b].el.classList.add('range');
						else this.buttons[b].el.classList.remove('range');
					}
					
					if(d > isomax || d < isomin){
						this.buttons[b].el.classList.add('future');
						this.buttons[b].el.disabled = true;
					}else{
						this.buttons[b].el.removeAttribute('disabled');
					}
					// Highlight available
					if(d <= isomax && d >= isomin) this.buttons[b].el.classList.remove('unavailable');
					else this.buttons[b].el.classList.remove('unavailable');

					// Highlight today
					if(d==now) this.buttons[b].el.classList.add('now');
					else this.buttons[b].el.classList.remove('now');

				}
				return this;
			}

			this.setStartEnd = function(s,e){
				this.range.start = s;
				this.range.end = e;
				this.highlightDays();
				if(this.starting) this.trigger('change',{'start':this.range.start,'end':this.range.end});
				return this;
			}

			this.setDay = function(d){
				if(this.starting){
					this.range.start = d;
					this.range.end = "";
					this.starting = false;
				}else{
					if(d < this.range.start){
						this.range.end = this.range.start;
						this.range.start = d;
					}else{
						this.range.end = d;
					}
					this.starting = true;

				}
				this.highlightDays();
				if(this.starting) this.trigger('change',{'start':this.range.start,'end':this.range.end});

				return this;
			}
			
			this.incMonth = function(i){
				m = this.startofmonth.getUTCMonth();
				m += i;
				if(m < 0){
					this.startofmonth.setUTCFullYear(this.startofmonth.getUTCFullYear()-1);
					m = 11;
				}else if(m > 11){
					this.startofmonth.setUTCFullYear(this.startofmonth.getUTCFullYear()+1);
					m = 0;
				}
				this.startofmonth.setUTCMonth(m);
				this.openCalendar(this.startofmonth);
			}

			this.openCalendar = function(d){
				var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

				o.style.top = (el.offsetTop+el.outerHeight)+'px';
				o.style.left = el.offsetLeft+'px';
				o.style.display = "";
				o.innerHTML = "";
				this.buttons = [];
				now = new Date();
				if(!d) d = new Date();
				perday = 86400000;
				// Need to work out the day of the week for the first of the month
				d.setUTCDate(1);
				d.setUTCHours(0);
				d.setUTCMinutes(0);
				d.setUTCSeconds(0);
				this.startofmonth = new Date(d.getTime());
				m = d.getUTCMonth();
				y = d.getUTCFullYear();
				dow = (d.getUTCDay()+(7-this.opts.startday))%7;
				d.setTime(d.getTime() - dow*perday);
				h = '<div class="nav"><button class="prev circle">&lt;</button><button class="next circle">&gt;</button></div><h3>'+months[m]+' '+y+'</h3><div class="layout"><table>';
				dys = ['MO','TU','WE','TH','FR','SA','SU'];
				for(var r = 0; r < 7; r++){
					if(r > 4 && d.getUTCDate() < 7) continue;
					h += '<tr>';
					for(var i = 0; i < 7; i++){
						iso = d.toISOString();
						id = "date-"+iso.substr(0,10);
						if(r == 0){
							h += '<th>'+dys[i]+'</th>'
						}else{
							b = document.createElement('button');
							b.setAttribute('data',iso);
							b.classList.add('day');
							b.classList.add('circle');
							b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); _obj.setDay(e.target.getAttribute('data')); });
							b.innerHTML = d.getUTCDate();
							this.buttons.push({'el':b,'id':id,'d':iso.substr(0,10),'date':iso});
							h += '<td class="num" id="'+id+'"></td>'
							d.setTime(d.getTime() + perday);
						}
					}
					h += '</tr>';
				}
				h += '</table><div class="range-selector"></div>';
				o.innerHTML = h;

				// Add buttons
				for(b = 0; b < this.buttons.length; b++) o.querySelector('#'+this.buttons[b].id).appendChild(this.buttons[b].el);
				// Add event handlers for prev/next month buttons
				o.querySelector('.prev').addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); _obj.incMonth(-1); });
				o.querySelector('.next').addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); _obj.incMonth(1); });

				var now = new Date();
				this.selectors = {
					'today':{'label':'Today','s':now.toISOString().substr(0,10),'e':now.toISOString().substr(0,10)},
					'last-week':{'label':'Last 7 days','s':(new Date(now.getTime() - 7*86400000)).toISOString().substr(0,10),'e':now.toISOString().substr(0,10)},
					'last-month':{'label':'Last 30 days','s':(new Date(now.getTime() - 30*86400000)).toISOString().substr(0,10),'e':now.toISOString().substr(0,10)},
					'last-hundred':{'label':'Last 100 days','s':(new Date(now.getTime() - 100*86400000)).toISOString().substr(0,10),'e':now.toISOString().substr(0,10)},
					'last-year':{'label':'Last year','s':(new Date(now.getTime() - 365*86400000)).toISOString().substr(0,10),'e':now.toISOString().substr(0,10)},
					'all-time':{'label':'All time','s':this.opts.min,'e':now.toISOString().substr(0,10)}
				}
				for(b in this.selectors){
					this.selectors[b].btn = document.createElement('button');
					this.selectors[b].btn.setAttribute('data',b);
					this.selectors[b].btn.innerHTML = this.selectors[b].label;
					o.querySelector('.range-selector').appendChild(this.selectors[b].btn);//innerHTML += '<button class="'+b+'" data="'+b+'">'+this.selectors[b].label+'</button>';
					this.selectors[b].btn.addEventListener('click',function(ev){
						ev.preventDefault();
						ev.stopPropagation();
						r = ev.target.getAttribute('data');
						sel = _obj.selectors[r];
						_obj.setStartEnd(sel.s,sel.e);
					});
				}
				
				// Update the day colours
				this.highlightDays();

				return this;
			}

			this.closeCalendar = function(){
				o.style.display = "none";
				return this;
			}

			// Attach some events
			el.addEventListener('focus', function(e){ _obj.openCalendar(new Date()); });
			el.addEventListener('change',function(e){ bits = el.value.split(/ to /); _obj.setStartEnd(bits[0],bits[1]); });
			o.addEventListener('mouseleave',function(e){ _obj.closeCalendar(); });

			this.init(opts);

			return this;
		}
		
		function splitDate(dt){
			var y = parseInt(dt.substr(0,4));
			var m = parseInt(dt.substr(5,2));
			var d = parseInt(dt.substr(8,2));
			var h = (dt.length < 13 ? 0 : parseInt(dt.substr(11,2)));
			return {'y':y,'m':m,'d':d,'h':h};
		}

		function niceDay(d,withmonth){
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			if(d.d == 1 || withmonth) return months[d.m-1]+' '+d.d;
			else return d.d;
		}

		function Panel(opts){
			if(!opts) opts = {};
			var el = document.createElement('li');
			el.innerHTML = '<label class="button"></label>';//:'<div class="button"></div>');
			el.querySelector('.button').innerHTML = '<h3>'+(opts.title||"Title")+'</h3><div class="number">0</div>';
			i = document.createElement('input');
			i.setAttribute('type','checkbox');
			if(opts.id) i.setAttribute('id',opts.id);
			if(opts.name) i.setAttribute('name',opts.name);
			if(opts.value) i.setAttribute('value',opts.value);
			if(opts['class']) i.classList.add(opts['class']);
			if(typeof opts.checked==="boolean"){
				if(opts.checked) i.setAttribute('checked','checked');
			}else i.setAttribute('checked','checked');	// Default on
			listenerObject(this);
			var _obj = this;
			// Listen for changes and trigger any attached event
			i.addEventListener('change',function(e){ e['this'] = _obj; _obj.trigger('change',e); });
			this.input = i;
			el.querySelector('.button').insertAdjacentElement('beforebegin', i);
			this.el = el;
			this.number = el.querySelector('.number');

			return this;
		}
		function Section(opts){
			if(!opts) opts = {};
			var el,html,p,ps;

			this.el = document.createElement('section');
			this.panels = opts.panels||{};
			if(opts.id) this.el.setAttribute('id',opts.id);
			html = (opts.head||"");
			if(opts.panels) html += '<ul class="grid compact buttons"></ul>';
			html += '<div class="breakdown"></div>';
			this.el.innerHTML = html;
			ps = 0;
			if(opts.panels){
				this.ul = this.el.querySelector('ul');
				for(p in this.panels){
					this.panels[p] = new Panel(this.panels[p]);
					this.ul.appendChild(this.panels[p].el);
					ps++;
				}
				cls = 'three-col';
				if(ps == 1) cls = 'one-col';
				else if(ps == 2) cls = 'two-col';
				else if(ps == 4) cls = 'four-col';
				this.ul.classList.add(cls);
			}
			
			// Add it to the document
			o = document.getElementById('output');
			if(!o){
				console.error('No output area');
				return this;
			}
			o.appendChild(this.el);
			
			this.setValue = function(p,v,pc){
				if(typeof v!=="number") v = this.panels[p].value||0;
				else this.panels[p].value = v;
				if(this.panels && this.panels[p]) this.panels[p].number.innerHTML = v.toLocaleString()+(pc ? '%' : '');
			}

			return this;
		}

		function Analytics(opt){
			var _obj = this;
			this.inp = {};
			this.data = {};
			this.values = {};
			this.actions = {'view':true,'click':true,'play':true};
			this.loaded = 0;
			this.inp.pages = document.getElementById('pages');
			if(this.inp.pages) this.inp.pages.addEventListener('change', function(e){ _obj.page = e.target.options[e.target.selectedIndex].value; _obj.updateAnalytics(); });
			this.page = "";
			this.start = "";
			this.end = "";
			this.title = "ODI Leeds Analytics";
			this.version = "1.2";
			this.logging = (location.search.indexOf('debug=true') >= 0);
			this.log = function(){
				// Version 1.1
				if(this.logging || arguments[0]=="ERROR" || arguments[0]=="WARNING"){
					var args = Array.prototype.slice.call(arguments, 0);
					// Build basic result
					var extra = ['%c'+this.title+'%c: '+args[1],'font-weight:bold;',''];
					// If there are extra parameters passed we add them
					if(args.length > 2) extra = extra.concat(args.splice(2));
					if(console && typeof console.log==="function"){
						if(arguments[0] == "ERROR") console.error.apply(null,extra);
						else if(arguments[0] == "WARNING") console.warn.apply(null,extra);
						else if(arguments[0] == "INFO") console.info.apply(null,extra);
						else console.log.apply(null,extra);
					}
				}
				return this;
			};
			this.log('MESSAGE','Starting...')

			this.tooltip = function(el){
				// Get or create the tooltip element
				var tooltip = document.getElementById('tooltip');
				if(!tooltip){
					tooltip = document.createElement('div');
					tooltip.setAttribute('id','tooltip');
					this.graph.appendChild(tooltip);
					var _obj = this;
					tooltip.addEventListener('mouseout',function(e){
						//_obj.hideTooltip(e.currentTarget,false);
					});
				}

				// Set the contents
				tooltip.innerHTML = (el.querySelector('title').innerHTML);
				tooltip.setAttribute('class',el.querySelector('title').getAttribute('action'));

				// Position the tooltip
				var bb = el.getBoundingClientRect();	// Bounding box of SVG element
				var bbo = this.graph.getBoundingClientRect(); // Bounding box of SVG holder
				tooltip.setAttribute('style','position:absolute;left:'+Math.round(bb.left + bb.width/2 - bbo.left + this.graph.scrollLeft)+'px;top:'+Math.round(bb.top + bb.height/2 - bbo.top)+'px;transform:translate3d(-50%,-100%,0);');
				return this;
			}

			this.init = function(opt){
				if(!opt) opt = {};
				this.opt = opt;

				var toload = 0;
				var loaded = 0;
				if(opt.meta) toload++;
				if(opt.urls) toload++;
				if(opt.meta){
					ODI.ajax(opt.meta,{
						"dataType": "json",
						"this": this,
						"cache": false,
						"success": function(d,attr){
							this.meta = d;
							this.start = (new Date((new Date()).getTime() - 7*86400000)).toISOString().substr(0,10);
							this.end = (new Date()).toISOString().substr(0,10);

							// Set up date range picker
							this.picker = new DateRangePicker(document.getElementById('date-range'),{
								"start": this.start,
								"end":this.end,
								"min": d.range.start,
								"max": d.range.end
							});

							this.picker.on('change',{'me':this},function(e){
								var cut = e.data.me.values.cut;
								var now = (new Date()).toISOString();
								e.data.me.start = e.start;
								e.data.me.end = (cut=="hourly" ? e.end.substr(0,10)+"T23:59:59Z":e.end);
								if(e.data.me.end > now) e.data.me.end = now;
								e.data.me.checkData();
								tt = document.getElementById('tooltip');
								if(tt) tt.style.display = "none";
							});

							this.picker.highlightDays();
							this.loaded += JSON.stringify(d).length;
							loaded++;
							if(loaded==toload) this.checkData();
						}
					});
				}
				if(opt.urls){
					ODI.ajax(opt.urls,{
						"dataType": "text",
						"this": this,
						"cache": false,
						"success": function(d,attr){
							var urls = d.split(/\n/);
							this.urls = {};
							for(var u = 0; u < urls.length; u++){
								bits = urls[u].split(/\t/);
								if(bits[0]) this.urls[bits[0]] = parseInt(bits[1]);
							}
							loaded++;
							this.loaded += JSON.stringify(d).length
							if(loaded==toload) this.checkData();
						}
					});
				}
				return this;
			}

			this.loadDataForRange = function(start,end){
				
				var diffdays = (start && end ? ((new Date(end)) - (new Date(start)))/86400000 : 7);
				var cut = "daily";
				var toload = 0;
				var loaded = 0;
				if(this.meta.hours[0].substr(0,10) <= start) cut = "hourly";
				else{
					if(diffdays >= 40) cut = "monthly";
				}
				this.values.cut = cut;

				if(cut=="monthly"){
					s = new Date(start);
					e = new Date(end);
					s.setUTCMonthStart();
					e.setUTCMonthStart();
				}else{
					s = new Date(start);
					e = new Date(end);
				}

				this.log('MESSAGE','Load data for the range '+start+' to '+end+' ('+cut+')');

				if(cut=="hourly"){
					// Have we loaded the hourly data?
					// It is all in one file
					if(this.data[cut]) return true;
					else{
						this.log('MESSAGE','Loading '+cut+' data from '+this.opt.cuts[cut].file);
						ODI.ajax(this.opt.cuts[cut].file,{
							"dataType": "json",
							"this": this,
							"cut": cut,
							"cache": false,
							"success": function(d,attr){
								cut = attr.data.cut;
								this.data[cut] = {};
								// Split out the hourly file into the hours
								for(p in d.pages){
									for(seg in d.pages[p]){
										if(!this.data[cut][seg]) this.data[cut][seg] = {'date':seg,'pages':{}};
										if(!this.data[cut][seg].pages[p]){
											this.data[cut][seg].pages[p] = d.pages[p][seg];
										}else{
											this.log('WARNING','Already have '+cut+'/'+seg);
										}
									}
								}
								this.loaded += JSON.stringify(d).length
								this.log('MESSAGE','Loaded hourly data.',this.data[cut],d)
								this.updateData();
							},
							"error": function(err,attr){
								this.log('ERROR','Failed to load hourly data.');
							}
						});
						return false;
					}
				}else{

					// Create an empty structure for this cut if it doesn't exist
					if(!this.data[cut]) this.data[cut] = {};

					// Work out which date segments we need to load
					var ds = [];
					for(t = new Date(s); t <= e; ){
						iso = t.toISOString();
						if(cut=="daily") dstr = iso.substr(0,10);
						if(cut=="monthly") dstr = iso.substr(0,7);

						// If we haven't loaded it...
						if(!this.data[cut][dstr]){
							// Is this after the entire data start?
							if(dstr >= this.meta.range.start) ds.push({'key':dstr,'iso':iso,'date':new Date(t.getTime()),'file':this.opt.cuts[cut].file.replace(/\%Y/g,iso.substr(0,4)).replace(/\%M/g,iso.substr(5,2)).replace(/\%D/g,iso.substr(8,2))});
							else this.log('WARNING','The segment '+dstr+' appears to be before the data range. Skipping.');
						}
						// Increment time differently depending on the interval type
						if(cut=="daily") t = new Date(t.getTime() + 86400*1000);
						if(cut=="monthly") t.setUTCNextMonthStart();
					}
					var toload = ds.length;
					var loaded = 0;
					for(d = 0; d < ds.length; d++){
						if(ds[d].file){
							this.log('MESSAGE','Loading '+ds[d].file)
							ODI.ajax(ds[d].file,{
								"dataType": "json",
								"this": this,
								"key": ds[d].key,
								"cut": cut,
								"cache": false,
								"success": function(d,attr){
									this.loaded += JSON.stringify(d).length;
									if(d.date != attr.data.key){
										this.log('WARNING','The date in '+attr.url+' does not match the expected key, '+attr.data.key);
										this.data[attr.data.cut][attr.data.key] = {};
										loaded++;
									}else{
										this.data[attr.data.cut][attr.data.key] = d;
										loaded++;
										if(loaded==toload) this.updateData();
									}
								},
								"error": function(d,attr){
									this.log('ERROR','Unable to load '+attr.url);
									this.data[attr.data.cut][attr.data.key] = {};
									loaded++;
									if(loaded==toload) this.updateData();
								}
							});
						}else{
							this.log('WARNING','No file name for '+ds[d].key);
							this.data[cut][ds[d].key] = {};
						}
					}
				}
				if(toload==loaded) return true;
				else return false;
			}

			/*
			this.getCut = function(s,e){
				var diffdays = (s && e ? ((new Date(e)) - (new Date(s)))/86400000 : 7);
				var d = "hourly";
				if(diffdays >= 3) d = "daily";
				if(diffdays >= 45) d = "monthly";
				return d;
			}*/

			// This function will call updateData if or when we have loaded all the data in the range
			this.checkData = function(){
				rtn = this.loadDataForRange(this.start,this.end);
				if(rtn) return this.updateData();
				return this;
			}

			// This function updates the data on the page
			this.updateData = function(){

				// Update pages list
				var pages = '<option value="">All pages</option>';
				for(var p in this.urls){
					if(p != "All pages") pages += '<option value="'+p+'"'+(p==this.page ? ' selected':'')+'>'+p+'</option>';
				}
				this.inp.pages.innerHTML = pages;
				this.updateAnalytics();

				return this;
			}

			function sortedArray(o,t){
				var arr = [];
				if(!t) t = "value";
				for(r in o){
					b = {};
					if(typeof o[r]==="number"){
						b.value = o[r];
					}else{
						for(c in o[r]){
							b[c] = o[r][c];//JSON.stringify(o[r][c]);
						}
					}
					b.id = r;
					arr.push(b);
				}
				arr = arr.sort(function(a, b){ return a[t] < b[t] ? 1 : -1; });
				return arr;
			}

			// Toggle the opening/closing of domain breakdowns in the referrer table
			this.toggleRow = function(i,tab){
				if(!this.table[tab]) return this;
				if(i > this.table[tab].length){ this.log('ERROR','toggleRow: Not enough rows'); return this; }
				if(this.table[tab][i].rows.length > 0){
					this.table[tab][i].expanded = !this.table[tab][i].expanded;
					for(r = 0; r < this.table[tab][i].rows.length; r++){
						if(this.table[tab][i].expanded) this.table[tab][i].rows[r].style.display = "";
						else this.table[tab][i].rows[r].style.display = "none";
					}
				}
				return this;
			}

			this.updateClicks = function(){
				// Update the table of clicks
				if(this.section.clicks.el) this.section.clicks.el.querySelector('.breakdown').innerHTML = '<p>Select a specific page to see more details.</p>';
				if(this.page){
					var clk = sortedArray(this.processed.clicks,'value');
					if(clk.length > 0){
						this.section.clicks.el.querySelector('.breakdown').innerHTML = '<table class="clicks"><tr><th>Value</th><th>Count</th></tr></table>';
						table = this.section.clicks.el.querySelector('table.clicks');
						for(c = 0; c < clk.length; c++){
							style = "";
							if(this.opt.colours && this.opt.colours[clk[c].id]){
								for(s in this.opt.colours[clk[c].id]){
									style += s+':'+this.opt.colours[clk[c].id][s]+';';
								}
							}
							trtmp = document.createElement('tr');
							trtmp.innerHTML = '<td'+(style ? ' style="'+style+'"':'')+'>'+clk[c].id+'</td><td'+(style ? ' style="'+style+'"':'')+'>'+clk[c].value+'</td>';
							table.appendChild(trtmp);
						}
					}else{
						this.section.clicks.el.querySelector('.breakdown').innerHTML = '<p>No data yet.</p>';
					}
				}
				return this;
			}

			this.updateReferrers = function(){

				// Add tables
				var r,i,rf,refs,_obj;
				// Sort the data
				rf = sortedArray(this.processed.group,'n');

				// Update the table of referrers
				this.section.referrers.el.querySelector('.breakdown').innerHTML = '<table class="referrers"><tr><th>Referrer</th><th>Referrals</th></tr></table>';
				table = this.section.referrers.el.querySelector('table.referrers');

				if(!this.table) this.table = {};

				delete this.table.referrers;
				this.table.referrers = [];

				_obj = this;
				for(i = 0; i < rf.length; i++){
					refs = sortedArray(rf[i].refs);

					// Make a row for the domain
					tr = document.createElement('tr');
					tr.innerHTML = '<td>'+(refs.length > 1 ? '<a href="#" data="'+i+'">':'')+rf[i].id+(refs.length > 1 ? '</a>':'')+'</td><td>'+rf[i].n+'</td>';
					table.appendChild(tr);

					rows = [];

					if(refs.length > 1){
						// If we have URLs within this we make it a group and add an event
						tr.classList.add('group');
						tr.querySelector('a').addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); i = e.target.getAttribute('data'); _obj.toggleRow(i,"referrers"); });
						for(r in refs){
							trtmp = document.createElement('tr');
							trtmp.setAttribute('style','display:none;');
							trtmp.classList.add('sub');
							trtmp.innerHTML = '<td>'+refs[r].id+'</td><td>'+refs[r].value+'</td>';
							rows.push(trtmp);
							table.appendChild(trtmp);
						}
					}
					this.table.referrers.push({'el':tr,'rows':rows,'expanded':false});
				}

				if(this.section.referrers){
					this.section.referrers.setValue('external');
					this.section.referrers.setValue('internal');
					this.section.referrers.setValue('direct');
				}

				return this;
			}

			this.updateSizes = function(){
				// Add tables
				var sz = [];
				var sz2 = [];
				var tot = 0;
				var maxw = 0;
				var maxh = 0;
				var t,i,r,s,n;
				s = {'narrow':0,'medium':0,'wide':0,'total':0};
				n = 12;
				sz = sortedArray(this.processed.sizes);
				for(i = 0; i < sz.length; i++){
					tot += sz[i].value;
					dim = sz[i].id.split(/x/);
					if(i < n){
						maxw = Math.max(maxw,dim[0]);
						maxh = Math.max(maxh,dim[1]);
					}
				}

				// Make the grid of screen sizes
				html = '<ul class="grid compact four-col sizes buttons">'					
				for(r = 0; r < sz.length; r++){
					pc = Math.round(100*sz[r].value/tot);
					dim = sz[r].id.split(/x/);
					t = "";
					if(dim[0] < 700) t = "narrow";
					if(dim[0] >= 700 && dim[0] <= 1024) t = "medium";
					if(dim[0] > 1024) t = "wide";
					// Only keep selected sizes
					if(t && this.section.sizes.panels[t].input.checked){
						s[t] += sz[r].value;
						s.total += sz[r].value;
						if(sz2.length < n){
							maxw = Math.max(maxw,dim[0]);
							maxh = Math.max(maxh,dim[1]);
						}
						sz2.push(sz[r]);
					}
				}
				for(r = 0; r < sz2.length; r++){
					pc = Math.round(100*sz2[r].value/tot);
					dim = sz2[r].id.split(/x/);
					if(r < n) html += '<li><div class="screen" style="width:'+Math.round(100*dim[0]/maxw)+'%;padding-top:'+((dim[0]/maxw)*100*dim[1]/dim[0]).toFixed(1)+'%"></div>'+sz2[r].id+'<br /><span class="number">'+sz2[r].value+'</span></li>'; // ('+pc+'%)
				}
				html += '</ul>';
				this.section.sizes.el.querySelector('.breakdown').innerHTML = html;
				if(this.section.sizes){
					this.section.sizes.setValue('narrow',Math.round((100*s.narrow)/s.total)||0,true);
					this.section.sizes.setValue('medium',Math.round((100*s.medium)/s.total)||0,true);
					this.section.sizes.setValue('wide',Math.round((100*s.wide)/s.total)||0,true);
				}

				return this;
			}

			this.updateMarketing = function(){
				// Update the UTM tables
				this.section.marketing.el.querySelector('.breakdown').innerHTML = '<p>A breakdown.</p>';
				var html = "";
				var d = {};
	
				if(this.processed.utms) d.sources = {'title':'Source','data':sortedArray(this.processed.utms,'value')};
				if(this.processed.utmm) d.mediums = {'title':'Medium','data':sortedArray(this.processed.utmm,'value')};
				if(this.processed.utmc) d.campaign = {'title':'Campaign','data':sortedArray(this.processed.utmc,'value')};
				for(t in d){
					if(d[t].data.length > 0){
						html += '<h3>'+d[t].title+'</h3><table class="utm'+t+'"><tr><th>Value</th><th>Count</th></tr>';
						for(c = 0; c < d[t].data.length; c++){
							style = "";
							if(this.opt.colours && this.opt.colours[d[t].data[c].id]){
								for(s in this.opt.colours[d[t].data[c].id]){
									style += s+':'+this.opt.colours[d[t].data[c].id][s]+';';
								}
							}
							html += '<tr><td'+(style ? ' style="'+style+'"':'')+'>'+d[t].data[c].id+'</td><td'+(style ? ' style="'+style+'"':'')+'>'+d[t].data[c].value+'</td></tr>';
						}
						html += '</table>';
					}
				}
				if(html){
					this.section.marketing.el.querySelector('.breakdown').innerHTML = html;
				}else{
					this.section.marketing.el.querySelector('.breakdown').innerHTML = '<p>No data yet.</p>';
				}
				return this;
			}

			this.processData = function(cut,p){
				var s,e,data,refs,clicks,group,sizes,v,mx,tot,max,ds,dpath,w,h,n,i,g;

				// Find start/end dates and time increment
				if(cut=="monthly"){
					s = new Date(this.start);
					e = new Date(this.end);
					s.setUTCMonthStart();
					e.setUTCMonthStart();
				}else{
					s = new Date(this.start);
					e = new Date(this.end);
				}

				// Set the referrer panel values to zero
				for(i in this.section.referrers.panels) this.section.referrers.panels[i].value = 0;

				// Get the values and maxima
				types = ['referrers','sizes','clicks','utms','utmm','utmc'];
				refs = {};
				clicks = {};
				group = {};
				sizes = {};
				data = {};
				v = {};
				mx = {};
				tot = {};
				max = -1e100;
				ds = {};
				dpath = "";
				w = this.graph.clientWidth;
				h = this.graph.clientHeight;
				n = 0;

				for(t = new Date(s); t <= e; ){
					if(cut=="hourly") dstr = t.toISOString().substr(0,13);
					if(cut=="daily") dstr = t.toISOString().substr(0,10);
					if(cut=="monthly") dstr = t.toISOString().substr(0,7);
					ds[dstr] = new Date(t);
					v[dstr] = {};
					dpath += (dpath ? 'L':'M')+''+(w*(t-s)/(e-s)).toFixed()+','+h;

					// Only process the date segments we have
					if(this.data[cut][dstr] && this.data[cut][dstr].pages){

						if(this.data[cut][dstr].pages[p]){
							for(j = 0; j < types.length; j++){
								for(r in this.data[cut][dstr].pages[p][types[j]]){
									if(types[j]=="referrers"){
										source = "";
										if(r.indexOf('/')==0) source = "internal";
										if(r.indexOf('://')>0) source = "external";
										if(this.opt.internal){
											for(i = 0 ; i < this.opt.internal.length; i++){
												if(r.indexOf(this.opt.internal[i])==0) source = "internal";
											}
										}
										if(source){
											// If the input checkbox is checked for this source
											if(this.section.referrers.panels[source].input.checked){
												g = r.replace(/[^\:]*:\/\//,'').split(/[/?#]/)[0];
												pre = "";
												if(!g) pre = this.opt.baseurl||"";
												if(!g || source=="internal") g = '(internal)';
												if(!group[g]) group[g] = {'n':0,'refs':{}};
												group[g].n += this.data[cut][dstr].pages[p].referrers[r];
												if(!group[g].refs[pre+r]) group[g].refs[pre+r] = 0;
												group[g].refs[pre+r] += this.data[cut][dstr].pages[p].referrers[r]
											}
											
											this.section.referrers.panels[source].value += this.data[cut][dstr].pages[p].referrers[r];
										}else{
											this.log('WARNING','No source for '+r);
										}
									}else{
										if(typeof this.data[cut][dstr].pages[p][types[j]]==="object"){
											if(!data[types[j]]) data[types[j]] = {};
											if(!data[types[j]][r]) data[types[j]][r] = 0;
											data[types[j]][r] += this.data[cut][dstr].pages[p][types[j]][r];
										}
									}
								}
							}
						}
						for(a in this.actions){
							if(!v[dstr][a]) v[dstr][a] = 0;
							if(!mx[a]) mx[a] = -1e100;
							if(!tot[a]) tot[a] = 0;
							if(this.data[cut][dstr].pages[p] && this.data[cut][dstr].pages[p].actions && typeof this.data[cut][dstr].pages[p].actions[a]==="number" && this.section.summary.panels[a]){
								v[dstr][a] = this.data[cut][dstr].pages[p].actions[a]||0;
								mx[a] = Math.max(mx[a],v[dstr][a]);
								if(this.section.summary.panels[a].input.checked) max = Math.max(mx[a],max);
								tot[a] += v[dstr][a];
							}
						}
					}

					// Update "Direct" referrers (difference between views and the internal+external counts)
					this.section.referrers.panels.direct.value = tot.view - this.section.referrers.panels.external.value - this.section.referrers.panels.internal.value;
					if(this.section.referrers.panels.direct.input.checked) group['(direct)'] = {'n':this.section.referrers.panels.direct.value};

					// Increment time differently depending on the interval type
					if(cut=="hourly") t = new Date(t.getTime() + 3600*1000);
					if(cut=="daily") t = new Date(t.getTime() + 86400*1000);
					if(cut=="monthly") t.setUTCNextMonthStart();

					n++;
				}

				return {'s':s,'e':e,'group':group,'clicks':data.clicks,'sizes':data.sizes,'utms':data.utms,'utmm':data.utmm,'utmc':data.utmc,'v':v,'mx':mx,'tot':tot,'max':max,'ds':ds,'dpath':dpath,'w':w,'h':h,'n':n};
			}

			this.updateAnalytics = function(){
				var d,p,a,s,e,t,v,pg,inc,svg,ns,i,els,w,h,source;
				ns = 'http://www.w3.org/2000/svg';
				d = this.values.cut;
				p = this.page;

				function isOK(v){
					return (typeof v==="undefined" || (typeof v==="boolean" && v));
				}
				// Have we created the section
				if(!this.section){
					this.section = {};
					var panels = {};
					if(typeof this.opt.view!=="boolean" || this.opt.view) panels.view = {'title':'Views','id':'view'};
					if(typeof this.opt.click!=="boolean" || this.opt.click) panels.click = {'title':'Clicks','id':'click'};
					if(typeof this.opt.play!=="boolean" || this.opt.play) panels.play = {'title':'Plays','id':'play'};
					this.section.summary = new Section({'panels':panels});
					if(panels.view) this.section.summary.panels.view.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					if(panels.click) this.section.summary.panels.click.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					if(panels.play) this.section.summary.panels.play.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					o = document.getElementById('output');
					el = document.createElement('nav');
					sty = ' style="font-size:1em;font-weight:normal;background:#ddd;color:inherit;text-transform:none;"';
					dash = document.createElement('ul');
					dash.classList.add('grid');
					dash.classList.add('compact');
					dash.style['grid-gap'] = '2px';
					html = '';
					if(isOK(this.opt.click)) html += '<li style="height:auto;"><a href="#clicks"'+sty+'><h3>Clicks</h3><p>A breakdown of click events</p></a></li>';
					if(isOK(this.opt.referrer)) html += '<li style="height:auto;"><a href="#referrers"'+sty+'><h3>Referrers</h3><p>Which pages link here</p></a></li>';
					if(isOK(this.opt.size)) html += '<li style="height:auto;"><a href="#sizes"'+sty+'><h3>Sizes</h3><p>Sizes of screens</p></a></li>';
					if(isOK(this.opt.marketing)) html += '<li style="height:auto;"><a href="#marketing"'+sty+'><h3>Marketing</h3><p>Summary of campaigns</p></a></li>';
					dash.innerHTML = html;
					dash.style['grid-template-columns'] = 'repeat('+dash.childNodes.length+',1fr)';
					el.appendChild(dash);
					o.appendChild(el);
					if(panels.click){
						this.section.clicks = new Section({
							'id':'clicks',
							'head':'<h2>Clicks</h2><p>A breakdown of recorded click events.</p>'
						});
					}
					this.section.referrers = new Section({
						'id':'referrers',
						'head':'<h2>Referrers</h2><p>The webpages that people came from to get to the page they looked at. "Direct" means that they most likely went straight to a page without clicking on a link; they may have typed it into their address bar, selected one of their browser bookmarks, or their browser is set up to not report the referrer.</p>',
						'panels':{
							'external':{'title':'External','class':'referrer'},
							'internal':{'title':'Internal','class':'referrer'},
							'direct':{'title':'Direct','class':'referrer'}
						}
					});
					this.section.referrers.panels.external.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					this.section.referrers.panels.internal.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					this.section.referrers.panels.direct.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					this.section.sizes = new Section({
						'id':'sizes',
						'head':'<h2>Screen Sizes</h2><p>The most common screen sizes (with each dimension rounded to the nearest 50px). Narrow screens are defined as those narrower than 700px, medium are from 700px to 1024px (inclusive) and wide are wider than 1024px.</p>',
						'panels':{
							'narrow':{'title':'Narrow','class':'screen'},
							'medium':{'title':'Medium','class':'screen'},
							'wide':{'title':'Wide','class':'screen'}
						}
					});
					this.section.sizes.panels.narrow.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					this.section.sizes.panels.medium.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					this.section.sizes.panels.wide.on('change',{me:this},function(e){ e.data.me.updateAnalytics(); });
					this.section.marketing = new Section({
						'id':'marketing',
						'head':'<h2>Marketing campagins</h2><p>A breakdown of <a href="https://en.wikipedia.org/wiki/UTM_parameters">UTM parameters</a> used for marketing campaigns.</p>',
						/*'panels':{
							'narrow':{'title':'Narrow','class':'screen'},
							'medium':{'title':'Medium','class':'screen'},
							'wide':{'title':'Wide','class':'screen'}
						}*/
					});
				}

				if(this.data[d]){
					// Build total of all pages if it hasn't already been done
					if(!p){
						p = "All pages";
						for(t in this.data[d]){
							if(this.data[d][t].pages){
								if(!this.data[d][t].pages[p]){
									this.data[d][t].pages[p] = {};
									// p is "all pages" and pg is a specific page
									for(pg in this.data[d][t].pages){
										if(pg != p){
											if(!this.data[d][t].pages[p]) this.data[d][t].pages[p] = {};
											for(segment in this.data[d][t].pages[pg]){
												if(!this.data[d][t].pages[p][segment]) this.data[d][t].pages[p][segment] = {};
												for(r in this.data[d][t].pages[pg][segment]){
													if(!this.data[d][t].pages[p][segment][r]) this.data[d][t].pages[p][segment][r] = 0;
													this.data[d][t].pages[p][segment][r] += this.data[d][t].pages[pg][segment][r];
												}
											}
										}
									}
								}
							}
						}
					}
					this.section.summary.el.querySelector('.breakdown').setAttribute('id','graph');
					this.graph = document.getElementById('graph');

					data = this.processData(d,p);
					this.processed = data;


					// Create SVG container
					if(!this.svg){
						this.svg = document.createElementNS(ns,'svg');
						this.svg.setAttribute('xmlns',ns);
						this.svg.setAttribute('version','1.1');
						this.svg.setAttribute('width',data.w);
						this.svg.setAttribute('height',data.h);
						this.svg.setAttribute('viewBox','0 0 '+data.w+' '+data.h);
						this.svg.setAttribute('overflow','visible');
						this.svg.setAttribute('preserveAspectRatio','xMinYMin meet');
						this.graph.appendChild(this.svg);
					}

					if(!this.g) this.g = {};
					for(a in this.actions){
						if(!this.g[a]){
							this.g[a] = {'el':document.createElementNS(ns,"g"),'d':data.dpath,'pts':[]};
							this.g[a].el.classList.add(a);
							this.g[a].path = document.createElementNS(ns,"path");
							this.g[a].path.classList.add('line');
							this.g[a].path.setAttribute('d',this.g[a].d);
							this.g[a].el.appendChild(this.g[a].path);
							this.svg.appendChild(this.g[a].el);
						}
						if(this.section.summary.panels[a] && this.section.summary.panels[a].input){
							if(this.section.summary.panels[a].input.checked) this.g[a].el.classList.remove('hidden');
							else this.g[a].el.classList.add('hidden');
						}
					}

					xs = [];
					for(a in this.actions){
						path = "";
						// Clear existing circles
						if(this.g[a].pts){
							if(this.g[a].pts.length != data.n){
								for(c = 0; c < this.g[a].pts.length; c++){
									this.g[a].pts[c].el.remove();
								}
								this.g[a].pts = [];
								for(i = 0; i < data.n; i++){
									pt = document.createElementNS(ns,"circle");
									pt.setAttribute('cx',0);
									pt.setAttribute('cy',0);
									pt.setAttribute('r',4);
									this.g[a].pts[i] = {'el':pt,'title':document.createElementNS(ns,"title")};
									pt.appendChild(this.g[a].pts[i].title);
									pt.addEventListener('mouseover',function(e){ _obj.tooltip(e.currentTarget); });
									this.g[a].el.appendChild(pt);
								}
							}
						}
						i = 0;
						for(d in data.v){
							if(!data.v[d][a]) data.v[d][a] = 0;
							x = (((data.ds[d]-data.s)/(data.e-data.s))*data.w).toFixed(2);
							y = ((1 - (data.v[d][a]/data.max))*data.h).toFixed(2);
							path += (path ? 'L':'M')+''+x+','+y;
							this.g[a].pts[i].el.setAttribute('style','transform:translate('+x+'px,'+y+'px)');
							this.g[a].pts[i].title.innerHTML = d.replace(/T([0-9]{2})/,function(m,p1){ if(p1){ return " "+p1+":00";}else{ return "";} })+': '+data.v[d][a];
							this.g[a].pts[i].title.setAttribute('action',a);
							this.g[a].pts[i].title.setAttribute('date',d);
							this.g[a].pts[i].date = d;
							this.g[a].pts[i].x = x;
							i++;
						}
						this.g[a].path.setAttribute('d',path);

						// Create an animation for the line
						if(!this.g[a].animate){
							this.g[a].animate = document.createElementNS(ns,"animate");
							this.g[a].animate.setAttribute("id","animate-"+a); 
							this.g[a].animate.setAttribute("attributeName","d");
							this.g[a].animate.setAttribute("dur","0.3s"); 
							this.g[a].animate.setAttribute("repeatCount","1"); 
							this.g[a].path.appendChild(this.g[a].animate);
						}
						// Update animation
						this.g[a].animate.setAttribute("from",this.g[a].d); 
						this.g[a].animate.setAttribute("to",path); 
						this.g[a].animate.setAttribute("values",this.g[a].d+';'+path); 
						this.g[a].animate.beginElement();

						// Store a copy of the current path
						this.g[a].d = path;

					}

					// Add axis labels
					var lbl = this.graph.querySelector('.x-labels');
					if(!lbl){
						lbl = document.createElement('div');
						lbl.classList.add('x-labels');
						this.graph.appendChild(lbl);
					}
					lbl.innerHTML = ""; // Zap existing content
					points = this.g.view.pts;
					diffdays = (new Date(this.end) - new Date(this.start))/86400000;
					for(i = 0; i < points.length; i++){
						d = points[i].date;
						v = "";
						dt = splitDate(d);
						if(diffdays < 1){
							v = (w > 600 ? dt.h+':00' : (dt.h%6==0 ? dt.h+':00':''));
						}else if(diffdays >= 1 && diffdays < 2.5){
							v = (dt.h%6==0 ? dt.h+':00' : '');
						}else if(diffdays >= 2.5 && diffdays < 10){
							v = (dt.h==0 ? niceDay(dt) : '');
						}else if(diffdays >= 10 && diffdays < 49){
							tm = new Date(d);
							if(tm.getDay()==this.picker.opts.startday) v = niceDay(dt,true);
						}else if(diffdays >= 49 && diffdays < 100){
							if(dt.d==1 || dt.d==10 || dt.d==20) v = niceDay(dt);
						}else if(diffdays >= 100 && diffdays < 400){
							v += (w > 600 ? d : (dt.m%3==1 ? d : ''));
						}else{
							v += (dt.m==1 ? dt.y : "");
						}
						if(v && i != points.length-1) lbl.innerHTML += '<div class="label" style="left:'+points[i].x+'px;">'+v+'</div>';
					}
					
					if(this.section.clicks) this.updateClicks();
					
					this.updateReferrers();
					this.updateSizes();
					this.updateMarketing();

					// Update totals
					for(a in this.actions){
						if(this.section.summary.panels[a]) this.section.summary.panels[a].number.innerHTML = data.tot[a].toLocaleString()||0;
					}
				}
				return this;
			}
			//this.init();
			return this;
		}
		ODI.analytics = new Analytics();
	});
	root.ODI = ODI;
})(window || this);
