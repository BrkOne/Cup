/*

	Upscuits | short for uptime-biscuit
	A quick overview of your server's uptime served on a nice dinner-tray.

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	--

	@file		upsuits.js
	@date		Tue Mar 31 2015 21:05:54
	@author		Pixel Bakkerij

	Copyright (c) 2013 Pixel Bakkerij <http://pixelbakkerij.nl>

*/
window.myApp = window.myApp || {};
myApp.dashboard = (function($) {

	var _template = "",
		_loaded = 0,
		_intervalId = 0,
		_start = Date.now(),
		_refresh = ((typeof(__refresh) == "number") ? __refresh : 300),
		$_container = {},
		//$_prograss = {},
		//$_countdown = {},
		$_lastUpdate = {},
		$_servertitle = {},
		tmpdate,
		datestr = "",
		error = false;
	function init() {
		_start = Date.now();
		_template = $('#server-template').html();
		$_container = $('#server-container').html('');
		$_servertitle = $('#server-title').html('');
		//$_prograss = $('.loading');
		//$_countdown = $('.countdown');
		$_lastUpdate = $('#last-update');
		$_servertitle.append("<th style=\"width:20%\"></th>");
		$_servertitle.append("<th style=\"width:10%\">近30天</th>");
		for (var d=6;d>=0;d--) {
			tmpdate = new Date(Date.parse(new Date().toString()) - 86400000*d);
			datestr = (tmpdate.getMonth()+1) + "." + tmpdate.getDate();
			$_servertitle.append("<th style=\"width:10%\">"+datestr+"</th>");
		}
		error = false;


		for (var i in __apiKeys) {
			getUptime(__apiKeys[i]);
		}

		attachListners($('html'));
		_intervalId = setInterval(countdown, 1000);
	}

	function attachListners($target) {
		$target.find('.tip').tooltip({
			placement: 'bottom'
		});
		$target.find('body').mouseup(function(event) {
			if ($('.popover-inner').length) {
				$('a.log').popover('hide');
			}
		});
	}

	/* load uptime variables from uptimerobot
	* this calls jsonUptimeRobotApi() when loaded
	*/
	function getUptime(apikey) {
		var url = "//api.uptimerobot.com/getMonitors?apiKey=" + apikey + "&customUptimeRatio=1-2-3-4-5-6-7-30&format=json&logs=1";
		$.ajax({
			url: url,
			context: document.body,
			dataType: 'jsonp'
		});
	}

	/* places the html on the page */
	function placeServer(data) {
		data.alert = "";
		switch (parseInt(data.status, 10)) {
			case 0:
				data.statustxt = "未知";
				data.statusicon = "question-sign";
				data.label = "default";
				break;
			case 1:
				data.statustxt = "未知";
				data.statusicon = "question-sign";
				data.label = "default";
				break;
			case 2:
				data.statustxt = "正常";
				data.statusicon = "ok";
				data.label = "success";
				data.alert = "";
				break;
			case 8:
				data.statustxt = "异常";
				data.statusicon = "exclamation-sign";
				data.label = "warning";
				data.alert = "warning";
				error = true;
				break;
			case 9:
				data.statustxt = "故障";
				data.statusicon = "remove";
				data.label = "danger";
				data.alert = "danger";
				error = true;
				break;
		}

		//ony show last month of logs
		var lastMonth = Date.parse('-1month');
		for (var i in data.log) {
			var log = data.log[i],
				dateTime = Date.parse(log.datetime);

			if (dateTime < lastMonth) {
				data.log.splice(i, i + 1);
			} else {
				data.log[i].datetime = ""+dateTime;
			}
		}
		data.log = $.merge([], data.log); //make sure log is set

		// interface of log-stuf like icons
		data.typeicon = getLogIcon;
		data.labeltype = getLogType;

		// gather data for the graphs
		var uptimes = data.customuptimeratio.split("-");
		for (var a=6; a>1; a--) {
			uptimes[a] = uptimes[a]*(a+1)-uptimes[a-1]*(a);
		}
		var uptimeb = [];
		for (a=0; a<uptimes.length; a++) {
			if (uptimes[a]>=99.97) {
				uptimeb[a] = "可用率 100%";
			} else if (uptimes[a]>=99.5) {
				uptimeb[a] = "可用率 "+new Number(uptimes[a]).toFixed(2)+"%<br>故障 "+new Number((100-uptimes[a])*14.40).toFixed(0)+" 分钟";
			} else if (uptimes[a]<=0) {
				uptimeb[a] = "可用率 0.00%<br>故障 24 小时";
			} else {
				uptimeb[a] = "可用率 "+new Number(uptimes[a]).toFixed(2)+"%<br>故障 "+new Number((100-uptimes[a])*0.24).toFixed(1)+" 小时";;
			}
		}
		//uptimes.push(data.alltimeuptimeratio);
		data.charts = [
			{title: '1', uptimes:uptimes[7], uptime: uptimeb[7], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: '2', uptimes:uptimes[6], uptime: uptimeb[6], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: '3', uptimes:uptimes[5], uptime: uptimeb[5], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: '4', uptimes:uptimes[4], uptime: uptimeb[4], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: '5', uptimes:uptimes[3], uptime: uptimeb[3], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: '6', uptimes:uptimes[2], uptime: uptimeb[2], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: '7', uptimes:uptimes[1], uptime: uptimeb[1], uptype: getUptimeColor, upsign: getUptimeSign},
			{title: 'all', uptimes:uptimes[0], uptime: uptimeb[0], uptype: getUptimeColor, upsign: getUptimeSign}
		];

		var $output = $(Mustache.render(_template, data));

		//attach popover listners
		$output.find('a.log').click(function() {
			$(this).tooltip('hide');
		}).popover({
			placement: 'bottom',
			html: true,
			content: $output.find('div.log' + data.id).html()
		});
		attachListners($output);

		//append it in the container
		$_container.append($output);
		_loaded++;
		if (_loaded >= __apiKeys.length) {
			_loaded = 0;
			$('.set-tooltip').tooltip({html:true});
			$('#stattip-load').addClass('hide');
			if (error) {
				$('#stattip-err').removeClass('hide');
				$('#stattip-ok').addClass('hide');
			} else {
				$('#stattip-ok').removeClass('hide');
				$('#stattip-err').addClass('hide');
			}
		}

		//updateProgressBar();
	}

	/* update progress bar of loaded servers
	function updateProgressBar() {
		_loaded++;
		$_prograss.css('width', Math.round(_loaded / __apiKeys.length) * 100 + '%');
		if (_loaded >= __apiKeys.length) {
			$_prograss.parent().slideUp();
		}
	}*/

	/* count down till next refresh */
	function countdown() {
		var now = Date.now(),
			elapsed = parseInt((now - _start) / 1000, 10),
			mins = Math.floor((_refresh - elapsed) / 60),
			secs = _refresh - (mins * 60) - elapsed;

		secs = (secs < 10) ? "0" + secs : secs;

		//$_countdown.width(100 - (elapsed * (100 / _refresh)) + '%');

		if (elapsed > _refresh) {
			clearInterval(_intervalId);
			init();
		} else {
			$_lastUpdate.html(mins + ':' + secs);
		}
	}

	/* set the icon in front of every log-line */
	function getLogIcon() {
		switch (parseInt(this.type, 10)) {
			case 1:
				return "chevron-down";
			case 2:
				return "chevron-up";
			case 99:
				return "pause";
			case 98:
				return "play";
			default:
				return this.type;
		}
	}

	/* give the icon in front of log line a nice color */
	function getLogType() {
		switch (parseInt(this.type, 10)) {
			case 1:
				return "danger";
			case 2:
				return "success";
			case 99:
				return "info";
			case 98:
				return "default";
			default:
				return this.type;
		}
	}

	function getUptimeColor() {
		var upt = parseInt(this.uptimes, 10);
		if (upt >= 99.90) {
			return "success";
		} else if (upt >= 98.00) {
			return "warning";
		} else {
			return "danger";
		}
	}

	function getUptimeSign() {
		var upt = parseInt(this.uptimes, 10);
		if (upt >= 99.90) {
			return "ok-sign";
		} else if (upt >= 98.00) {
			return "exclamation-sign";
		} else {
			return "remove-sign";
		}
	}

	//expose dashboard (PUBLIC API)
	return {
		init: init,
		placeServer: placeServer
	};
}(jQuery));

/* function called from the uptimerequest */
function jsonUptimeRobotApi(data) {
	for (var i in data.monitors.monitor) {
			myApp.dashboard.placeServer(data.monitors.monitor[i]);
		}
	}