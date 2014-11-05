
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
		
		var token = '';
		var key = '';
		var param = window.location.search || '';
		if (param !== '' && param.indexOf('&') !== -1) {
			param = param.replace('?', '');
			var arrParam = param.split('&');
			for (var i = 0; i < arrParam.length; i++) {
				if (arrParam[i].indexOf('token=') !== -1) {
					token = arrParam[i].replace('token=', '');
				}
				if (arrParam[i].indexOf('key=') !== -1) {
					key = arrParam[i].replace('key=', '');
				}
			}
		} else if (param !== '' && param.indexOf('&') === -1) {
			token = param.replace('?token=', '');
		} else {
			param = '';
		}
		
		if (token !== '') {
			
			var successCallback = function (execs) {
				
				var _tbody = _this.find('table.execs tbody');
				_tbody.html('');// Clear table body
				for (var i = 0; i < execs.length; i++) {
					var exec = execs[i];
					
					var tr = $('<tr>');
					tr.append( $('<td>').text(exec.token) );
					tr.append( $('<td>').append( $('<a>').attr('href', 'token.html?token=' + exec.token + '&key=' + exec.key).text(exec.key) ) );
					tr.append( $('<td>').text(exec.executionTime) );
					tr.append( $('<td>').text(exec.timestamp) );
					_tbody.append(tr);
				}
				
			};
			
			if (key !== '') {
				
				// Using MongoDB
				$.ajax({
					type: 'GET',
					url: 'http://localhost:4000/api/execs/token/' + token + '/key/' + key,
					dataType: 'jsonp',
					success: successCallback
				}).fail(function (jqXHR, textStatus, errorThrown) {
					console.error(textStatus + ' AJAX fail: ' + errorThrown);
				});
				
			}
			else {
				
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
				
			}
			
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
				data: { 'token': token, 'key': key, 'executionTime': execTime }
			}).done(function () {
				console.log('data added!');
			}).fail(function (jqXHR, textStatus, errorThrown) {
				console.error(textStatus + ' AJAX fail: ' + errorThrown);
			});
			
		});
		
		var oldDate = new Date('1970-01-01');
		var currDate = new Date('1970-01-01');
		var getActivity = function (ajaxActivitySuccess) {
			
			//oldDate = currDate;
			oldDate = new Date('1970-01-01');
			currDate = new Date();
			var dateFrom = oldDate.toJSON();
			var dateTo = currDate.toJSON();
			//var dateFrom = '2014-11-04T06:26:37.492Z';
			//var dateTo = '2014-11-05T06:26:37.492Z';
			
			$.ajax({
				type: 'GET',
				url: 'http://localhost:4000/api/execs/search/activity/' + dateFrom + '/' + dateTo,
				dataType: 'jsonp',
				success: ajaxActivitySuccess
			}).fail(function (jqXHR, textStatus, errorThrown) {
				console.error(textStatus + ' AJAX fail: ' + errorThrown);
			});
		};
		
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
							var ajaxActivitySuccess = function (execs) {
								console.log('ajaxActivitySuccess:' + execs.length);
								for (var i = 0; i < execs.length; i++) {
									var x = ( new Date(execs[i].timestamp) ).getTime();
									var y = execs[i].executionTime;
									series.addPoint([x, y], true, true);
								}
							};
							getActivity(ajaxActivitySuccess);
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
					var data = [];
					var ajaxActivitySuccess = function (execs) {
						for (var i = 0; i < execs.length; i++) {
							var exec = execs[i];
							data.push({
								x: ( new Date(exec.timestamp) ).getTime(),
								y: exec.executionTime
							});
						}
						console.log('ajaxActivitySuccess ' + execs.length + ':' + data.length);
					};
					$.when(getActivity(ajaxActivitySuccess)).done(function () {
						console.log('return: ' + data.length);
						return data;
					});
				}())
			}]
		});
	});
	
	
});