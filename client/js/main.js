
$(document).ready(function () {
	
	$('body.index').each(function () {
		
		var _this = $(this);
		
		$.ajax({
			type: 'GET',
			url: 'http://localhost:4000/api/execs/tokens',
			dataType: 'jsonp'
		}).done(function (tokens) {
			
			_this.find('span.tokenCount').text(tokens.length);
			var _ul = _this.find('ul.tokens');
			for (var i = 0; i < tokens.length; i++) {
				var token = tokens[i];
				
				var link = $('<a>').attr('href', 'token.html?token=' + token).text(token);
				_ul.append( $('<li>').html(link) );
			}
			
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error(textStatus + ' AJAX fail: ' + errorThrown);
		});
		
	});
	
	$('body.token').each(function () {
		
		var _this = $(this);
		
		var token = window.location.search || '';
		if (token !== '' && token.indexOf('&') === -1) {
			token = token.replace('?token=', '');
		} else {
			token = '';
		}
		
		if (token !== '') {
			
			var successCallback = function (execs) {
				
				var _tbody = _this.find('table.execs tbody');
				_tbody.html('');// Clear table body
				for (var i = 0; i < execs.length; i++) {
					var exec = execs[i];
					
					var tr = $('<tr>');
					tr.append( $('<td>').text(exec.token) );
					tr.append( $('<td>').text(exec.key) );
					tr.append( $('<td>').text(exec.executionTime) );
					tr.append( $('<td>').text(exec.timestamp) );
					_tbody.append(tr);
				}
				
			};
			/*
			// Using MongoDB
			$.ajax({
				type: 'GET',
				url: 'http://localhost:4000/api/execs/token/' + token,
				dataType: 'jsonp',
				success: successCallback
			}).fail(function (jqXHR, textStatus, errorThrown) {
				console.error(textStatus + ' AJAX fail: ' + errorThrown);
			});
			*/
			// Using Elasticsearch
			$.ajax({
				type: 'GET',
				url: 'http://localhost:4000/api/execs/search/' + token,
				dataType: 'jsonp',
				success: successCallback
			}).fail(function (jqXHR, textStatus, errorThrown) {
				console.error(textStatus + ' AJAX fail: ' + errorThrown);
			});
			
		} else {
			console.log('Error, should be a token to search for!');
		}
		
		
	});
	
	$('body.liveData').each(function () {
		
		var _this = $(this);
		
		_this.find('#addData').click(function () {
			var token = _this.find('#token').val() || '';
			var key = _this.find('#key').val() || '';
			var execTime = _this.find('#executionTime').val() || '';
			
			$.ajax({
				type: 'POST',
				url: 'http://localhost:4000/api/execs',
				data: {
					'token': token,
					'key': key,
					'executionTime': execTime
				}
			}).done(function (data) {
				
				console.log('done!');
				console.log(data);
				
			}).fail(function (jqXHR, textStatus, errorThrown) {
				console.error(textStatus + ' AJAX fail: ' + errorThrown);
			});
			
		});
		
		var dateFrom = '2014-11-04T06:26:37.492Z';
		var dateTo = '2014-11-05T06:26:37.492Z';
		$.ajax({
			type: 'GET',
			url: 'http://localhost:4000/api/execs/search/activity/' + dateFrom + '/' + dateTo,
			dataType: 'jsonp'
		}).done(function (execs) {
			
			console.log('activity!');
			console.log(execs);
			
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error(textStatus + ' AJAX fail: ' + errorThrown);
		});
		
		
		
		Highcharts.setOptions({
			global: { useUTC: false }
		});
		
		$('#container').highcharts({
			chart: {
				type: 'spline',
				animation: Highcharts.svg, // don't animate in old IE
				marginRight: 10,
				events: {
					load: function () {
						// set up the updating of the chart each second
						var series = this.series[0];
						setInterval(function () {
							var x = (new Date()).getTime(), // current time
								y = Math.random();
							series.addPoint([x, y], true, true);
						}, 1000);
					}
				}
			},
			title: { text: 'Live data' },
			xAxis: {
				type: 'datetime',
				tickPixelInterval: 150
			},
			yAxis: {
				title: { text: 'Value' },
				plotLines: [{ value: 0, width: 1, color: '#808080' }]
			},
			tooltip: {
				formatter: function () {
					return '<b>' + this.series.name + '</b><br/>' +
						Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
						Highcharts.numberFormat(this.y, 2);
				}
			},
			legend: { enabled: false },
			exporting: { enabled: false },
			series: [{
				name: 'Kodemon activity',
				data: (function () {
					// generate an array of random data
					var data = [];
					var time = (new Date()).getTime();
					for (var i = -19; i <= 0; i += 1) {
						data.push({
							x: time + i * 1000,
							y: Math.random()
						});
					}
					return data;
				}())
			}]
		});
	});
	
	
});