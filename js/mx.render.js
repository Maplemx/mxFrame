if (typeof($mx) != 'object'){var $mx = {};}
/**
 * mxRender v 0.4.1 Beta
 * an auto render frame
 * author: maplemx
 * email: maplemx@gmail.com
 */

 	/**
 	 * mxLine v 0.1.1 Beta
 	 */
 	if (typeof($mx.line) === 'undefined'){$mx.line = {};}
 	(function($l){
 		//Private Attributes
 		var lines = {},
 			lineCode = 0;

 		//Private Methods
 		var inLine = function(funcObj,lineCode){
 				lines[lineCode].line.push(funcObj);
 				check(lineCode);
 			},
 			doNext = function(lineCode){
 				lines[lineCode].status = 400;
 				var next = lines[lineCode].line.shift();
 				setTimeout(function(){
 					tryDo(next,lineCode);
 				});
 			},
 			tryDo = function(funcObj,lineCode){
				switch(funcObj.type){
 					case "do":
	 					setTimeout(function(){
	 						funcObj.func();
	 						lines[lineCode].status = 200;
	 						check(lineCode);
	 					});
	 					break;
	 				case "if":
	 					if (funcObj.condition){
	 						setTimeout(function(){
	 							funcObj.func();
	 							lines[lineCode].status = 200;
	 							check(lineCode);
	 						});
	 					}else{
	 						if (typeof(funcObj.elseFunc) == 'function'){
	 							setTimeout(function(){
	 								funcObj.elseFunc();
	 								lines[lineCode].status = 200;
	 								check(lineCode);
	 							})
	 						}
	 					}
	 					break;
	 				case "wait":
	 					if (eval(funcObj.condition)){
	 						setTimeout(function(){
	 							funcObj.func();
	 							lines[lineCode].status = 200;
	 							check(lineCode);
	 						});
	 					}else{
	 						if (typeof(funcObj.waitTime) === 'undefined'){funcObj.waitTime = 500;}
	 						setTimeout(function(){
	 							tryDo(funcObj,lineCode);
	 						},funcObj.waitTime)
	 					}
	 					break;
 				}
 			},
 			check = function(lineCode){
 				if (lines[lineCode].status == 200 && lines[lineCode].line.length > 0){
 					doNext(lineCode);
 				};
 			};
 		//Class Model
 		var Line = function(lineCode){
 			this.lineCode = lineCode;
 			this.then = function(func){
 				inLine({
 					type: "do",
 					func: func,
 				},this.lineCode);
 				return this;
 			}
 			this.if = function(condition,func,elseFunc){
 				inLine({
 					type: "if",
 					func: func,
 					condition: condition,
 					elseFunc: elseFunc,
 				},this.lineCode);
 				return this;
 			}
 			this.wait = function(condition,func,waitTime){
 				inLine({
 					type: "wait",
 					func: func,
 					condition: condition,
 					waitTime: waitTime,
 				},this.lineCode);
 				return this;
 			}
 		}

 		//Public Methods
 		$l.do = function(func){
 			var thisLineCode = lineCode;
	 		lineCode++;
	 		lines[thisLineCode] = {
	 			status: 200,
	 			line: [],
	 		};
			inLine({
				type: "do",
				func: func,
			},thisLineCode);
	 		return new Line(thisLineCode);
 		}
 	})($mx.line);

 	/**
 	 * mxSignal v 0.2.0 Beta
 	 */
 	if (typeof($mx.signal) === 'undefined'){$mx.signal = {}};
 	(function($s){
 		//Private Attributes
 		var signals = {
 				flashes: [],
 				lights: [],
 			},
 			waits = [];

 		//Private Methods
 		var addSignal = function(signal,type){
	 			if (signals[type].indexOf(signal) > -1){
	 				return true;
	 			}else{
	 				return signals[type].push(signal);
	 			}
	 		},
	 		removeSignal = function(signal,type){
	 			var index = signals[type].indexOf(signal);
	 			if (index > -1){
	 				return signals[type].splice(index,1);
	 			}else{
	 				return true;
	 			}
	 		},
	 		addWait = function(waitObject){
	 			if (waits.indexOf(waitObject) > -1){
	 				return true;
	 			}else{
	 				return waits.push(waitObject);
	 			}
	 		},
	 		removeWait = function(waitObject){
	 			for (var i in waits){
	 				if (waits[i].func == waitObject.func && waits[i].originSignals == waitObject.originSignals){
	 					return waits.splice(i,1);
	 				}
	 			}
	 		},
	 		cleanArray = function(array){
	 			var resultArray = [];
	 			for (var i in array){
	 				if (typeof(array[i]) != undefined){
	 					resultArray.push(array[i]);
	 				}
	 			}
	 			return resultArray;
	 		},
	 		trySignal = function(signal,type){
	 			addSignal(signal,type);
	 			for (var i in waits){
	 				var index = waits[i].signals.indexOf(signal);
	 				if (index > -1){
	 					waits[i].signals.splice(index,1);
	 					if (type == 'flashes'){removeSignal(signal,type);};
	 					if (waits[i].signals.length < 1){
	 						doWait(waits[i]);
	 					}
	 				}
	 			}
	 		},
	 		tryWait = function(waitObject){
	 			for (var i in signals.flashes){
	 				var index = waitObject.signals.indexOf(signals.flashes[i]);
	 				if (index > -1){
	 					waitObject.signals.splice(index,1);
	 					signals.flashes[i] = undefined;
	 				}
	 			}
	 			signals.flashes = signals.flashes.filter(Boolean);
	 			for (var i in signals.lights){
	 				var index = waitObject.signals.indexOf(signals.lights[i]);
	 				if(index > -1){
	 					waitObject.signals.splice(index,1);
	 				}
	 			}
	 			if (waitObject.signals.length < 1){
	 				doWait(waitObject);
	 			}else{
	 				addWait(waitObject);
	 			}
	 		},
	 		doWait = function(waitObject){
	 			setTimeout(waitObject.func);
	 			removeWait(waitObject);
	 		},
	 		formWaitObject = function(signals,func){
	 			if (typeof(signals) === 'undefined'){return false;}
		 		if (typeof(func) != 'function'){return false;}
		 		if (typeof(signals) != 'object'){signals = [signals];}
		 		var waitObject = {
		 			signals: signals,
		 			originSignals: signals,
		 			func: func,
		 		};
		 		return waitObject;
	 		};

	 	//Public Attributes
	 		$s.waits = waits;
	 		$s.signals = signals;

	 	//Public Methods
	 	$s.flash = function(signal){
	 		if (typeof(signal) === 'undefined'){return false;}
	 		trySignal(signal,"flashes");
	 	};
	 	$s.turnOn = function(signal){
	 		if (typeof(signal) === 'undefined'){return false;}
	 		trySignal(signal,"lights");
	 	};
	 	$s.turnOff = function(signal){
	 		if (typeof(signal) === 'undefined'){return false;}
	 		removeSignal(signal,"lights");
	 	};
	 	$s.inWaits = function(signals,func){
	 		var waitObject;
	 		if (waitObject = formWaitObject(signals,func)){
	 			tryWait(waitObject);
	 		}else{
	 			return false;
	 		}
	 	},
	 	$s.outWaits = function(signals,func){
	 		var waitObject;
	 		if (waitObject = formWaitObject(signals,func)){
	 			removeWait(waitObject);
	 		}else{
	 			return false;
	 		}
	 	},
	 	$s.countFlashes = function(){
	 		return signals.flashes.length;
	 	},
	 	$s.countLights = function(){
	 		return signals.lights.length;
	 	},
	 	$s.countWaits = function(){
	 		return waits.length;
	 	}
 	})($mx.signal);

 	/**
	 * mxAjax v 0.1.1 Beta
	 */
	(function($mx){
		$mx.ajax = function(ajaxParams){
			var type = ajaxParams.type,
				url = ajaxParams.url,
				data = ajaxParams.data,
				dataType = ajaxParams.dataType,
				success = ajaxParams.success,
				error = ajaxParams.error;

			if (typeof(type) === 'undefined'){type = 'get';}
			type = type.toString().toLowerCase();
			if (typeof(dataType) != 'undefined'){dataType = dataType.toLowerCase();}
			if (url == null){console.warn('[Ajax request fail] have no url!');return false;}

			var dataFormat = function(data){
				var result = '';
				if (typeof(data) == 'object'){
					for (var key in data){
						result += key + '=' + encodeURIComponent(data[key]) + '&';
					}
					result = result.substr(0,result.length - 1);
					return result;
				}else if (typeof(data) == 'string'){
					return data;
				}else{
					return false;
				}
			}

			if (window.XMLHttpRequest){
				var ajaxObject = new XMLHttpRequest();
			}else{
				var ajaxObject = new ActiveXObject('Microsoft.XMLHTTP');
			}

			ajaxObject.open(type,url,true);
			if (type == 'post'){
				ajaxObject.setRequestHeader('content-type','application/x-www-form-urlencoded');
				ajaxObject.send(dataFormat(data));
			}else{
				ajaxObject.send(null);
			}

			ajaxObject.onreadystatechange = function(){
				if (ajaxObject.readyState == 4 && ajaxObject.status == 200){
					var result = null;
					switch (dataType){
						case 'text':
							result = ajaxObject.responseText;
							break;
						case 'xml':
							result = ajaxObject.responseXML;
							break;
						default:
						case 'json':
							result = eval('(' + ajaxObject.response + ')');
							break;
					}
					if (typeof(success) == 'function'){
						success(result,url);
					}
				}else if (ajaxObject.status != 200){
					console.warn('[Ajax request fail] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
					error(url);
				}
			}
		}
	})($mx);

	/**
	 * mxXMLReader v 0.1.2 Beta
	 */
	//REQUIRE:mxAjax
	if (typeof($mx.xml) === 'undefined'){$mx.xml = {};}
	(function($x){
		//Private Methods
		var mergeXMLObjects = function(firstObject,secondObject){
			var resultObject = firstObject;
			if (typeof(resultObject) === 'undefined'){
				resultObject = secondObject;
			}else{
				while (secondObject.documentElement.hasChildNodes()){
					resultObject.documentElement.appendChild(secondObject.documentElement.childNodes[0]);
				}
			}
			return resultObject;
		}

		//Class Model
		var Tag = function(tagName,orderNum,lastTarget){
			if (typeof(orderNum) === 'undefined'){orderNum = 0;}
			if (typeof(lastTarget) === 'undefined'){lastTarget = $x.content;}
			this[0] = lastTarget.getElementsByTagName(tagName)[orderNum];
			this.tag = function(tagName,orderNum){
				return new Tag(tagName,orderNum,this[0]);
			};
			if (this[0] && this[0].childNodes.length > 0){
				this.text = this[0].textContent;
			}else{
				this.text = undefined;
			}
			this.toObject = function(){
				if (this.text && this.text.replace(/(\r|\n|\t)/gm,'')){
					return eval('(' + this.text + ')');
				}else{
					return undefined;
				}
			}
		}
		//Public Atrributes
		$x.content = undefined;

		//Publice Methods
		$x.loadInByObject = function(xmlObject,callback){
			$x.content = mergeXMLObjects($x.content,xmlObject);
			if (typeof(callback) === 'function'){callback();}
		}
		$x.loadInByURL = function(url,callback,errorCallback){
			$mx.ajax({
				url: url,
				dataType: 'XML',
				success: function(result,url){
					$x.loadInByObject(result);
					if (typeof(callback) === 'function'){callback(url);}
				},
				error: function(url){
					if (typeof(errorCallback) === 'function'){errorCallback(url);}
				}
			});	
		}
		$x.tag = function(tagName,orderNum){
			return new Tag(tagName,orderNum,$x.content);
		}
	})($mx.xml);

	/**
	 * mxRender v 0.4.1 Beta
	 */
	//REQUIRE:mxAjax mxXMLReader mxSignal
	if (typeof($mx.render) === 'undefined'){$mx.render = {};}
	(function($r){
		//Information
		$r.info = {
			version: "0.4.1 Beta",
		}
		//Configures
		$r.configures = {
			autoStart: true,
			log: false,
			hideBeforeDone: true,
			itemsXmlPaths: ['items/frames.xml','items/items.xml'],
		};
		//Private Attributes
		var confs = $r.configures,
			htmlElement = document.getElementsByTagName('html')[0],
			headElement = document.getElementsByTagName('head')[0],
			bodyElement = document.body,
			publicCSSElement = document.createElement('style'),
			idAutoCounter = 0,
			sandboxData = {},
			renderRecord = {
				css: [],
				preloadOnce: [],
				callbackOnce: [],
			},
			fragment = document.createDocumentFragment();

		//Private Methods
			//Useful Functions
			var log = function(content){
					if (confs.log){
						if (typeof(content) != 'object'){content = [content];}
						console.info(mergeObjects(['[mxRender]'],content));
					}
				},
				mergeObjects = function(firstObject,secondObject){
					var result = firstObject;
					for (var key in secondObject){
						result[key] = secondObject[key];
					}
					return result;
				},
				replaceWithObject = function(text,object,lastProperty){
					var result = text;
					for (var property in object){
						var fullProperty = '';
						if (typeof(lastProperty) === 'undefined'){
							fullProperty = property;
						}else{
							fullProperty = lastProperty + '.' + property;
						}
						if (typeof(object[property]) === 'object'){
							result = replaceWithObject(result,object[property],property);
						}else{
							var reg = new RegExp('\\\{\\\$' + fullProperty + '\\\}','gm');
							result = result.replace(reg,object[property]);
						}
					}
					return result;
				},
				tryRenderWaits = function(){
					//if mxSignal plug-in is used in other place
					/*for (var i in $mx.signal.waits){
						if ($mx.signal.waits[i].signals[0].substr(0,9) == 'mxRender_'){
							return false;
						}
					}
					return true;*/
					//if mxSignal plug-in is only used in mxRender
					if ($mx.signal.waits.length > 0){
						return false;
					}else{
						return true;
					}
				},
				tryDoBinding = function(element){
					if (tryRenderWaits()){
						scanElementForBinding(element);
						if (confs.hideBeforeDone){
							htmlElement.appendChild(fragment);
						}
					}else{
						setTimeout(function(){
							tryDoBinding(element)
						},300);
					}
				};

			//Main Functions
			var initRender = function(){
					if (confs.hideBeforeDone){
						fragment.appendChild(bodyElement);
					}
					loadItemTemplates(function(){
						publicCSSElement.setAttribute('type','text/css');
						headElement.appendChild(publicCSSElement);
						$r.element(bodyElement);
					});
				},
				loadItemTemplates = function(callback){
					var waitSignals = [];
					for (var i in confs.itemsXmlPaths){
						waitSignals.push('mxRender_XML_' + confs.itemsXmlPaths[i]);
					}
					$mx.signal.inWaits(waitSignals,callback)
					for (var i in confs.itemsXmlPaths){
						$mx.xml.loadInByURL(confs.itemsXmlPaths[i],function(url){
							$mx.signal.flash('mxRender_XML_' + url);
							log('Template file: ' + url + ' loaded.');
						},function(url){
							log('Can not load template file: ' + url);
						});		
					}
				},
				scanElement = function(element){
					if (typeof(element) === 'object'){
						if (element.nodeName == 'ITEM' || (element.attributes && element.attributes['mx'])){
							renderItem(element);
						}else{
							scanElementChildNodes(element);
						}
					}
				},
				scanElementChildNodes = function(element){
					for (var i = 0;i < element.childNodes.length;i++){
						scanElement(element.childNodes[i]);
					}
				},
				renderItem = function(element){
					var renderedItem = document.createElement('ITEM');
					//prepare item information
					if (!element.attributes['name']){
						log([renderedItem,'does not have "name" attribute.']);
						return false;
					}
					var itemName = element.attributes['name'].value;

					var itemTemplate = $mx.xml.tag(itemName);
					if (!itemTemplate[0]){
						log([renderedItem,'has no template.']);
						return false;
					};
					
					if (!element.attributes['id']){
						element.setAttribute('id',itemName + '_' + idAutoCounter);
						idAutoCounter++;
					}
					var itemId = element.attributes['id'].value;
					
					if (!element.attributes['class']){
						element.setAttribute('class',itemName);
					}

					renderedItem.setAttribute('mx-render-item','');
					renderedItem.setAttribute('class',itemName);
					renderedItem.setAttribute('id',itemId);

					//init item sandbox data
					function initData(){
						if (typeof(sandboxData[itemId]) != 'object'){sandboxData[itemId] = {};}
						sandboxData[itemId].$this = renderedItem;
						//normal way(data = "{...}")
						if (element.attributes['data'] && element.attributes['data'].value != ''){
							sandboxData[itemId].$data = mergeObjects(itemTemplate.tag('data').toObject(),eval('(' + element.attributes['data'].value + ')'));
							$mx.signal.flash('mxRender_' + itemId + '_data');
						//ajax way(data-url = "..."[data-method = "post|get"][data-type = "json|xml|text"])
						}else if(element.attributes['data-url'] && element.attributes['data-url'].value != ''){
							var dataUrl = element.attributes['data-url'].value;		
							if (element.attributes['data-method'] && element.attributes['data-method'].value != ''){
								var dataMethod = element.attributes['data-method'].value;
							}else{
								var dataMethod = 'get';
							}
							if (element.attributes['data-type'] && element.attributes['data-type'].value != ''){
								var dataType = element.attributes['data-type'].value;
							}else{
								var dataType = 'json';
							}
							$mx.ajax({
								url: dataUrl,
								type: dataMethod,
								dataType: dataType,
								success: function(result){
									if (element.attributes['data-position']){
										var dataPosition = element.attributes['data-position'].value;
									}
									if (dataPosition){
										var data = eval('(result.' + dataPosition + ')');
									}else{
										var data = result;
									}
									sandboxData[itemId].$data = mergeObjects(itemTemplate.tag('data').toObject(),data);
									$mx.signal.flash('mxRender_' + itemId + '_data');
								},
								error: function(url){
									log([renderedItem,'get data by url failed:' + url]);
									sandboxData[itemId].$data = itemTemplate.tag('data').toObject();
									$mx.signal.flash('mxRender_' + itemId + '_data');
								}
							});
						}else{
							sandboxData[itemId].$data = itemTemplate.tag('data').toObject();
							$mx.signal.flash('mxRender_' + itemId + '_data');
						}
						//load event
						if (element.attributes['event'] && element.attributes['event'].value != ''){
							sandboxData[itemId].$event = eval('(' + element.attributes['event'].value + ')');
							$mx.signal.flash('mxRender_' + itemId + '_event');
						}else{
							sandboxData[itemId].$event = undefined;
							$mx.signal.flash('mxRender_' + itemId + '_event');
						}
						//load method
						if (element.attributes['method'] && element.attributes['method'].value != ''){
							sandboxData[itemId].$method = mergeObjects(itemTemplate.tag('method').toObject(),eval('(' + element.attributes['method'].value + ')'));
							$mx.signal.flash('mxRender_' + itemId + '_method');
						}else{
							sandboxData[itemId].$method = itemTemplate.tag('method').toObject();
							$mx.signal.flash('mxRender_' + itemId + '_method');
						}
						//load global
						if (element.attributes['global'] && element.attributes['global'].value != ''){
							sandboxData[itemId].$global = mergeObjects(itemTemplate.tag('global').toObject(),eval('(' + element.attributes['global'].value + ')'));
							$mx.signal.flash('mxRender_' + itemId + '_global');
						}else{
							sandboxData[itemId].$global = itemTemplate.tag('global').toObject();
							$mx.signal.flash('mxRender_' + itemId + '_global');
						}
					}

					//common functions
					var formFunctionString = function(main,step){
							var result = 'var $sandbox = $mx.render.sandboxData["' + itemId + '"],'
								+ '    $data = $sandbox.$data,'
								+ '    $event = $sandbox.$event,'
								+ '    $this = $sandbox.$this;'
								+ main;						
							if (step == 'preloadOnce' || step == 'callbackOnce'){
								result += '$mx.render.' + step + 'push("' + itemName + '")';
							}
								result += '$mx.render.sandboxData["' + itemId + '"].$data = $data;' + 
								'$mx.render.sandboxData["' + itemId + '"].$event = $event;' +
								'$mx.signal.flash("mxRender_' + itemId + '_' + step + '");';
							return result;
						},
						doJSJob = function(step){
							var JSText = itemTemplate.tag(step).text;
							if (JSText){
								JSText = formFunctionString(JSText,step);
								setTimeout(JSText);
							}else{
								$mx.signal.flash('mxRender_' + itemId + '_' + step);
							}	
						};

					$mx.signal.inWaits([
							'mxRender_' + itemId + '_data',
							'mxRender_' + itemId + '_event',
							'mxRender_' + itemId + '_method',
							'mxRender_' + itemId + '_global',
						],function(){

						//add to public CSS
						if (!renderRecord.css.indexOf(itemName) > -1){
							var addCSS = itemTemplate.tag('css').text;
							if (addCSS){
								addCSS = replaceWithObject(addCSS,sandboxData[itemId].$data);
								publicCSSElement.innerHTML += addCSS;
								renderRecord.css.push(itemName);
							}
						}

						//do preload once
						doJSJob('preloadOnce');
					});

					//do preload
					$mx.signal.inWaits('mxRender_' + itemId + '_preloadOnce',function(){
						doJSJob('preload');
					});

					//do render
					$mx.signal.inWaits('mxRender_' + itemId + '_preload',function(){
						var HTMLReplacer = itemTemplate.tag('template').text;
						if (HTMLReplacer){
							HTMLReplacer = HTMLReplacer.replace(/\{\$html\}/gm,element.innerHTML);
							HTMLReplacer = replaceWithObject(HTMLReplacer,sandboxData[itemId].$data);
							renderedItem.innerHTML = HTMLReplacer;
						}
						scanElementChildNodes(renderedItem);
						$mx.signal.flash('mxRender_' + itemId + '_render');
					});

					//do callback once
					$mx.signal.inWaits('mxRender_' + itemId + '_render',function(){
						doJSJob('callbackOnce');
					});

					//do callback
					$mx.signal.inWaits('mxRender_' + itemId + '_callbackOnce',function(){
						doJSJob('callback');
					});

					//insert and scan rendered item
					$mx.signal.inWaits('mxRender_' + itemId + '_callback',function(){
						element.parentNode.insertBefore(renderedItem,element);
						element.remove();
						if (sandboxData[itemId].$event){
							if (sandboxData[itemId].$event['onShow']){
								eval("(function(){" +
									"var $thisItem = renderedItem," +
										"$data = sandboxData[itemId].$data;" +
										"$this = bindItem[" + i + "];" +
									"(" + sandboxData[itemId].$event['onShow'] + ")();" +
									"sandboxData[itemId].$data = $data;" +
								"})()");
							}
						}
					});

					//start here
					initData();			
				},
				scanElementForBinding = function(element){
					if (typeof(element) === 'object'){
						if ((element.nodeName == 'ITEM' || (element.attributes && element.attributes['mx'])) && element.attributes['mx-render-item']){
							bindActionAndEventToItem(element);
						}
						scanElementChildNodesForBinding(element);
					}
				},
				scanElementChildNodesForBinding = function(element){
					for (var i = 0;i < element.childNodes.length;i++){
						scanElementForBinding(element.childNodes[i]);
					}
				},
				bindActionAndEventToItem = function(element){
					var itemName = element.attributes['class'].value,
						itemId = element.attributes['id'].value,
						itemTemplate = $mx.xml.tag(itemName),
						methods = sandboxData[itemId].$method,
						globals = sandboxData[itemId].$global,
						eventHooks = itemTemplate.tag('event').toObject(),
						events = sandboxData[itemId].$event;
					for (var methodName in methods){
						eval("element['" + methodName + "'] = function(){" +
								"var $this = element;" +
								"(" + sandboxData[itemId].$method[methodName] +")(arguments);" +
							"}");
					}
					for (var globalName in globals){
						eval("window." + globalName + " = function(){" +
								"var $this = element;" +
								"(" + globals[globalName] +")(arguments);" +
							"}");
					}
					for (var eventName in eventHooks){
						if (eventHooks[eventName]){
							var bind = eventHooks[eventName].bind,
								event = eventHooks[eventName].event;
							if (bind == 'this'){
								var bindItem = [element];
							}else{
								var bindItem = element.querySelectorAll(bind);
							}
							for (var i = 0;i < bindItem.length;i++){
								if (sandboxData[itemId].$event && sandboxData[itemId].$event[eventName]){
									var func = sandboxData[itemId].$event[eventName];
								}else if (eventHooks[eventName].func){
									var func = eventHooks[eventName].func.toString();
								}else{
									var func = undefined;
								}
								if (func){
									eval("bindItem[" + i + "]['" + event + "'] = function(){" +
										"var $thisItem = element," +
											"$data = sandboxData[itemId].$data," +
											"$this = bindItem[" + i + "];" +
										"(" + func + ")();" +
									"}");
								}
							}
						}else{
							if (eventName != "onShow"){
								log([element,'have not defined event "' + eventName + '".']);
							}
						}
					}
				};
		//Public Attributes
		$r.sandboxData = sandboxData;

		//Public Methods
		$r.start = function(){
			initRender();
		};
		$r.element = function(element){
			scanElement(element);
			setTimeout(function(){
				tryDoBinding(element)
			},300);
		};
		$r.childNodes = function(element){
			scanElementChildNodes(element);
		};
		$r.addPreloadOnce = function(itemName){
			return renderRecord.preloadOnce.push(itemName);
		};
		$r.addCallbakcOnce = function(itemName){
			return renderRecord.callbackOnce.push(itemName);
		};
	})($mx.render)
		//Auto Start
		setTimeout(function(){
			if ($mx.render.configures.autoStart){
				$mx.render.start();
			}
		});
	/**
	 * mxSelector v 0.1.0 Beta
	 */
	(function($mx){
		$mx.selector = function(query){
			var allElementsDo = function(job){
				var doType = typeof(job);
				switch(doType){
					case 'string':
						for (var i = 0;i < mxSelector.all.length;i++){
							if (typeof(mxSelector.all[i][job]) === 'function'){
								mxSelector.all[i][job](arguments);
							}
						}		
						break;
					case 'function':
						for (var i = 0;i < mxSelector.all.length;i++){
							$this = mxSelector.all[i];
							job($this);
						}
						break;
				}
			}

			var mxSelector = {};
			if (query && query.nodeName){
				mxSelector.first = query;
				mxSelector.all = [query];
			}else{
				mxSelector.first = document.querySelectorAll(query)[0];
				mxSelector.all = document.querySelectorAll(query);
			}
			mxSelector.call = function(methodName){
				allElementsDo(methodName);
			}
			mxSelector.show = function(){
				allElementsDo(function($this){
					$this.style.display = 'block';
				});
			}
			mxSelector.hide = function(){
				allElementsDo(function($this){
					$this.style.display = 'none';
				});
			}
			mxSelector.remove = function(){
				allElementsDo(function($this){
					$this.remove();
				});
			}
			mxSelector.append = function(element){
				if (!element.nodeName){
					var content = element;
					element = document.createElement('div');
					element.innerHTML = content;
				}
				allElementsDo(function($this){
					$this.appendChild(element.cloneNode(true));
				});
			}
			mxSelector.prepend = function(element){
				if (!element.nodeName){
					var content = element;
					element = document.createElement('div');
					element.innerHTML = content;
				}
				allElementsDo(function($this){
					$this.insertBefore(element.cloneNode(true),$this.childNodes[0]);
				});
			}
			mxSelector.before = function(element){
				if (!element.nodeName){
					var content = element;
					element = document.createElement('div');
					element.innerHTML = content;
				}
				allElementsDo(function($this){
					$this.parentNode.insertBefore(element.cloneNode(true),$this);
				});				
			}
			mxSelector.after = function(element){
				if (!element.nodeName){
					var content = element;
					element = document.createElement('div');
					element.innerHTML = content;
				}
				allElementsDo(function($this){
					$this.parentNode.appendChild(element.cloneNode(true),$this);
				});				
			}
			mxSelector.html = function(content){
				if (element){
					allElementsDo(function($this){
						$this.innerHTML = content;
					})
				}else{
					return mxSelector.first.innerHTML;
				}
			}
			mxSelector[0] = mxSelector.first;
			if (mxSelector.first){
				return mxSelector;
			}else{
				return undefined;
			}
		}
	})($mx)

	/**
 	 * Short Cuts
 	 */
 	$mx.l = $mx.line;
 	$mx.s = $mx.signal;
 	$mx.r = $mx.render;
 	if (typeof($r) === 'undefined'){var $r = $mx.render;}
 	$mx.x = $mx.xml;
 	if (typeof($) === 'undefined'){var $ = $mx.selector;}
 	if (typeof($$) === 'undefined'){
 		var $$ = function(query){
 			if ($mx.selector(query)){
 				return $mx.selector(query).first;
 			}else{
 				return undefined;
 			}
 		}
 	}