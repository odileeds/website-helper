(function(root){

	var ODI = root.ODI || {};
	if(!ODI.ready){
		ODI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		}
	}

	ODI.PostIts = function(a,opts){
		this.version = "1.1";
		this.sheetid = "";
		this.el;
		var href = a.getAttribute('href');
		var _obj = this;

		this.init = function(){
			href = href.replace(/spreadsheets\/d\/([^\/]+)\//,function(m,p1){ _obj.sheetid = p1; return p1; });
			if(this.sheetid){
				this.el = document.createElement('ul');
				this.el.classList.add('grid');
				this.el.classList.add('compact');
				this.el.classList.add('attendees');
				a.parentNode.insertAdjacentElement('afterend', this.el);
				this.get();
			}
			var style = document.createElement('style');
			style.innerHTML = ".attendees { grid-template-columns: repeat(4, 1fr)!important; } .postit { position: relative; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3)); } .postit > div { position: relative; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 2em), calc(100% - 2em) 100%, 0% 100%); height: 100%; } .postit > div:after { content: \"\"; position: absolute; bottom: 0px; right: 0px; width: 2em; height: 2em; background: rgba(0,0,0,0.2); box-shadow: -2px -1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1); } .postit:nth-child(8n+1) > div { transform: rotate(-1deg); } .postit:nth-child(3n+1) > div { transform: rotate(2deg); } .postit:nth-child(8n+2) > div { transform: rotate(0.5deg); } .postit:nth-child(6n+2) > div { transform: rotate(-1.5deg); } .postit:nth-child(6n+4) > div { transform: rotate(2.5deg); } .postit:nth-child(8n+6) > div { transform: rotate(-2deg); } .postit:nth-child(12n+4) > div { transform: rotate(-0.5deg); } .postit:nth-child(8n+1) > div:after { transform: rotate(-5deg); } .postit:nth-child(7n+2) > div:after { transform: rotate(5deg); } .postit:nth-child(9n+3) > div:after { transform: rotate(2deg); }";
			document.head.appendChild(style);

			return this;
		}

		this.get = function(){
			var url = 'https://docs.google.com/spreadsheets/d/'+this.sheetid+'/gviz/tq?tqx=out:csv&sheet=details';
			console.info('Getting '+url);
			S().ajax(url,{
				"this":this,
				"success":function(d){
					this.update(CSVToArray(d));
				},
				"error":function(e){
					console.error('Unable to load sheet',e);
				}
			});
			setTimeout(function(){ _obj.get(); },300000);
			return this;
		}
		this.update = function(d){
			var header = {};

			for(var c = 0; c < d[0].length; c++){
				// Clean first column
				if(c==0) d[0][c] = d[0][c].replace(/^.*\. ([^\.]*)$/g,function(m,p1){ return p1; });
				header[d[0][c]] = c;
			}
			list = '';
			for(var i = 1; i < d.length; i++){
				list += '<li class="postit">';
				list += '<div class="'+(d[i][header['Colour']] ? 'c'+d[i][header['Colour']]:'b5' )+'-bg">';
				list += '<h3>'+d[i][header['Your name']]+'</h3>';
				list += '<p>';
				if(d[i][header['Where are you from?']]) list += '<strong>'+d[i][header['Where are you from?']]+'</strong>';
				if(d[i][header['Twitter']]) list += '<br />'+d[i][header['Twitter']].replace(/\@/g,"").replace(/<[^\>]*?>/,"").replace(/([^\s]{1,})(\s|$)/,function(m,p1,p2){ return '<a href="https://twitter.com/'+p1+'">@'+p1+'</a>'; });
				if(d[i][header['Why are you here?']]) list += '<br />'+d[i][header['Why are you here?']];
				list += '</p>';
				list += '</div>';
				list += '</li>'
			}
			this.el.innerHTML = list;
			return this;
		}

		this.init();
		return this;
	}
	/**
	 * CSVToArray parses any String of Data including '\r' '\n' characters,
	 * and returns an array with the rows of data.
	 * @param {String} CSV_string - the CSV string you need to parse
	 * @param {String} delimiter - the delimeter used to separate fields of data
	 * @returns {Array} rows - rows of CSV where first row are column headers
	 */
	function CSVToArray (CSV_string, delimiter) {
		delimiter = (delimiter || ","); // user-supplied delimeter or default comma

		var pattern = new RegExp( // regular expression to parse the CSV values.
			( // Delimiters:
				"(\\" + delimiter + "|\\r?\\n|\\r|^)" +
				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
				// Standard fields.
				"([^\"\\" + delimiter + "\\r\\n]*))"
			), "gi"
		);

		var rows = [[]];  // array to hold our data. First row is column headers.
		// array to hold our individual pattern matching groups:
		var matches = false; // false if we don't find any matches
		// Loop until we no longer find a regular expression match
		while (matches = pattern.exec( CSV_string )) {
			var matched_delimiter = matches[1]; // Get the matched delimiter
			// Check if the delimiter has a length (and is not the start of string)
			// and if it matches field delimiter. If not, it is a row delimiter.
			if (matched_delimiter.length && matched_delimiter !== delimiter) {
				// Since this is a new row of data, add an empty row to the array.
				rows.push( [] );
			}
			var matched_value;
			// Once we have eliminated the delimiter, check to see
			// what kind of value was captured (quoted or unquoted):
			if (matches[2]) { // found quoted value. unescape any double quotes.
				matched_value = matches[2].replace(
					new RegExp( "\"\"", "g" ), "\""
				);
			} else { // found a non-quoted value
				matched_value = matches[3];
			}
			// Now that we have our value string, let's add
			// it to the data array.
			rows[rows.length - 1].push(matched_value);
		}
		return rows; // Return the parsed data Array
	}

	ODI.ready(function(){
		var a = document.getElementsByTagName('a');
		var i,href;
		for(i = 0; i < a.length; i++){
			href = a[i].getAttribute('href');
			if(href.indexOf('https://docs.google.com/spreadsheets')==0){
				sheets.push(new ODI.PostIts(a[i]));
			}
		}
	});
	root.ODI = ODI;
})(window || this);

var sheets = [];
