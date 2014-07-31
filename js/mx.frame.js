/**
 * mxFrame v 0.5.1 Beta
 * Make It Easy To Write Items For Everybody
 * Author: maplemx
 * Email: maplemx@gmail.com
 */

//"use strict"; 
var $mx = $mx ? $mx : {};
/**
 * mxSignal v 0.3.0 Beta
 */
(function($mx){
	var tunnels = [];
	var Signal = function(tunnelName){
		tunnelName = tunnelName ? tunnelName : 'defaultTunnel';
		tunnels[tunnelName] = tunnels[tunnelName] ? tunnels[tunnelName] : 
		{
			signals: [],
			lines: [],
			empty: [],
		};

		var trySignal = function(signal){
			var index = tunnels[tunnelName].signals.indexOf(signal);
			if (index > -1 && tunnels[tunnelName].lines[signal]){
				tunnels[tunnelName].lines[signal]();
				tunnels[tunnelName].signals.splice(index,1);
			}
		},
		tryEmpty = function(){
			if (tunnels[tunnelName].signals.length == 0){
				for (var i = 0;i < tunnels[tunnelName].empty.length;i++){
					tunnels[tunnelName].empty.splice(i,1)[0]();
				}
			}
		};
		this.name = tunnelName;
		this.add = function(signal){
			if (tunnels[tunnelName].signals.indexOf(signal) < 0){
				tunnels[tunnelName].signals.push(signal);
				trySignal(signal);
			}
		}
		this.remove = function(signal){
			var index = tunnels[tunnelName].signals.indexOf(signal)
			if (index > -1){
				tunnels[tunnelName].signals.splice(index,1);
			}
			tryEmpty();
		}
		this.count = tunnels[tunnelName].signals.length;
		this.when = function(signal,func){
			tunnels[tunnelName].lines[signal] = func;
			trySignal(signal);
		}
		this.empty = function(func){
			if (tunnels[tunnelName].empty.indexOf(func) < 0){
				tunnels[tunnelName].empty.push(func);
			}
			tryEmpty();
		}
		this.debug = function(){
			return tunnels;
		}
		return this;
	}

	$mx.signal = function(tunnelName){
		return new Signal(tunnelName);
	}
})($mx);

/**
 * mxAjax v 0.2.0 Beta
 */
var $mx = $mx ? $mx : {};
(function($mx){
	$mx.ajax = function(ajaxArguments){
		if (!ajaxArguments){console.warn('[Ajax request fail] no ajax argument object!');return false;}
		var url = ajaxArguments.url,
			method = ajaxArguments.method ? ajaxArguments.method.toLowerCase() : (ajaxArguments.type ? ajaxArguments.type.toLowerCase() : 'get'),
			dataType = ajaxArguments.dataType ? ajaxArguments.dataType.toLowerCase() : null,
			data = ajaxArguments.data ? ajaxArguments.data : null,
			headers = (typeof(ajaxArguments.headers) === 'object') ? ajaxArguments.headers : null,
			success = (typeof(ajaxArguments.success) === 'function') ? ajaxArguments.success : null,
			error = (typeof(ajaxArguments.error) === 'function') ? ajaxArguments.error : null,
			sync = ajaxArguments.sync ? (typeof(ajaxArguments.sync) === 'boolean' ? ajaxArguments.sync : true) : true,
			errorCallbackCount = 0,
			requestUrl = url,
			requestData;
		if (!url){console.warn('[Ajax request fail] url is empty!');return false;}

		var createXHR = function(){
			if (window.XMLHttpRequest){
				return new XMLHttpRequest();
			}else if (window.ActiveXObject){
				if (typeof(arguments.callee.activeXString) != 'string'){
					var versions = ['MSXML2.XMLHttp.6.0','MSXML2.XMLHttp.3.0','MSXML2.XMLHttp'];
					for (var i=0;i < versions.length;i++){
						try{
							new ActiveXObject(versions[i]);
							arguments.callee.activeXString = versions[i];
							break;
						}catch(ex){}
					}
				}
				return new ActiveXObject(arguments.callee.activeXString);
			}else{
				console.warn('[Ajax Request Fail] no XHR object available!');
				return false;
			}
		},
		dataFormat = function(data){
			if (typeof(data) === 'object'){
				var dataArray = [];
				for (var key in data){
					dataArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
				}
				return dataArray.join('&');
			}else{
				return data;
			}
		},
		addDataToParam = function(url,data){
			if (data){
				url += (url.indexOf('?') > -1) ? '' : '?';
				url += (url.substr(-1) == '&' || url.substr(-1) == '?') ? data : '&' + data;
			}
			return url;
		}

		var ajaxObject = createXHR();
		requestData = dataFormat(data);
		if (ajaxObject){
			ajaxObject.onreadystatechange = function(){
				//console.info('[Ajax request process] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
				if (ajaxObject.readyState == 4 && ((ajaxObject.status >= 200 && ajaxObject.status < 300) || ajaxObject.status == 304)){
					var result = null;
					switch (dataType){
						case 'text':
							result = ajaxObject.responseText;
							break;
						case 'xml':
							result = ajaxObject.responseXML;
							break;
						case 'json':
						default:
							result = ajaxObject.response ? JSON.parse(ajaxObject.response) : null;
							break;
					}
					if (typeof(success) === 'function'){
						success(result,url);
					}
				}else if (ajaxObject.readyState > 1 && !((ajaxObject.status >= 200 && ajaxObject.status < 300) || ajaxObject.status == 304)){
					console.warn('[Ajax request fail] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
					if (typeof(error) === 'function' && errorCallbackCount == 0){error(url);errorCallbackCount++;}
					return false;
				}
			}
			if (method === 'get'){
				requestUrl = addDataToParam(url,data);
			}
			ajaxObject.open(method,requestUrl,sync);
			//default headers
			ajaxObject.setRequestHeader('X-Requested-With','XMLHttpRequest');
			if (dataType){
				switch (dataType){
					case "text":
						ajaxObject.setRequestHeader('Accept','text/plain');
						break;
					case "json":
						ajaxObject.setRequestHeader('Accept','application/json');
						break;
					case "html":
						ajaxObject.setRequestHeader('Accept','text/html');
						break;
					case "xml":
						ajaxObject.setRequestHeader('Accept','application/xml, text/xml');
						break;
					default:
						ajaxObject.setRequestHeader('Accept','*/*');
						break;
				}
			}
			if (method === 'post' && !(headers && headers['Content-Type'])){
				ajaxObject.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			}
			//modify headers
			if (headers){
				for (var headerName in headers){
					ajaxObject.setRequestHeader(headerName,headers[headerName]);
				}
			}
			ajaxObject.send(requestData);
		}else{
			return false;
		}
	}
})($mx);

/**
 * mxXMLReader v 0.1.3 Beta
 */
//REQUIRE:mxAjax
$mx.xml = $mx.xml ? $mx.xml : {};
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
	var Tag = function(tagName,orderNum,lastTarget,onlyChild){
		orderNum = orderNum ? orderNum : 0;
		onlyChild = onlyChild ? onlyChild : false;
		lastTarget = lastTarget ? lastTarget : $x.content;
		if (onlyChild){
			var childNodes = lastTarget.childNodes,
				childCount = 0;
			for (var i = 0;i < childNodes.length;i++){
				if (childNodes[i].tagName == tagName || childNodes[i].tagName == tagName.toUpperCase()){
					if (childCount == orderNum){
						this[0] = childNodes[i];
						break;
					}else{
						childCount++;
					}
				}
			}
		}else{
			this[0] = lastTarget ? lastTarget.getElementsByTagName(tagName)[orderNum] : undefined;
		}
		this.tag = function(tagName,orderNum){
			return new Tag(tagName,orderNum,this[0],false);
		};
		this.child = function(tagName,orderNum){
			return new Tag(tagName,orderNum,this[0],true);
		}
		if (this[0] && this[0].childNodes.length > 0){
			this.text = this[0].textContent;
			this.html = this[0].innerHTML;
		}else{
			this.text = undefined;
			this.html = undefined;
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
				if (result){
					$x.loadInByObject(result,function(){
						callback(url);
					});
				}else{
					console.error('[mxXMLReader]Can\'t read XML file, perhaps it does not follow XML standard: [' + url + '];');
					if (typeof(callback) === 'function'){callback(url);}
				}				
			},
			error: function(url){
				if (typeof(errorCallback) === 'function'){errorCallback(url);}
			}
		});	
	}
	$x.tag = function(tagName,orderNum){
		return new Tag(tagName,orderNum,$x.content,false);
	}
	$x.child = function(tagName,orderNum){
		return new Tag(tagName,orderNum,$x.content,true);
	}
})($mx.xml);
var $x = $x ? $x : $mx.xml;

/**
 * mxFrame v 0.5.1 Beta
 */
$mx.frame = $mx.frame ? $mx.frame : {};
(function($f){
	//Default Configures
	$f.configures = {
		autoStart: true,
		library: ['library/mxFrameDefault.xml'],
	}

	//Private
	var publicCSSElement = document.createElement('style'),
		idAutoCounter = 0,
		sanboxTempVarCounter = 0,
		renderRecord = {
			onRender: [],
			css: [],
			preloadOnce: [],
			callbackOnce: [],
		},
		loading = $mx.signal('mxFrame'),
		frameStartStatus = false,
		mxFrameReadyFunction;
	publicCSSElement.setAttribute('type','text/css');
	document.getElementsByTagName('head')[0].appendChild(publicCSSElement);

	var	runJS = function(JSString){
		var script = document.createElement('script');
		//see what code was run
		if ($f.configures.debug){console.log(JSString);}
		script.innerHTML = JSString;
		document.querySelector('html').appendChild(script);
		script.remove();
	},
	getValueFromString = function(JSString){
		if (JSString.replace(/(\t|\s|\r|\n)/gm,'')){
			runJS('var __mxFrameTemp__ = ' + JSString);
			var result = __mxFrameTemp__;
			__mxFrameTemp__ = null;
			return result;
		}else{
			return '';
		}
	},
	sandboxJS = function(sandboxData,JSString){
		var nowCounter = sanboxTempVarCounter;
		sanboxTempVarCounter++;
		window.__mxFrameSandboxTempData__ = window.__mxFrameSandboxTempData__ ? window.__mxFrameSandboxTempData__ : [];
		window.__mxFrameSandboxTempData__[nowCounter] = sandboxData;
		var fullJSString = 'var ';
		for (var key in sandboxData){
			fullJSString += key + '=window.__mxFrameSandboxTempData__[' + nowCounter + ']["' + key + '"],'
		}
		fullJSString = fullJSString.substr(0,fullJSString.length - 1) + ';';
		fullJSString += JSString;
		runJS(fullJSString);
		for (var key in sandboxData){
			sandboxData[key] = window.__mxFrameSandboxTempData__[nowCounter][key];
		}
		window.__mxFrameSandboxTempData__[nowCounter] = null;
		return sandboxData;
	},
	createMethodInSandbox = function(sandboxData,element,methodName,methodFunction){
		var nowCounter = sanboxTempVarCounter;
		sanboxTempVarCounter++;
		window.__mxFrameSandboxTempData__ = window.__mxFrameSandboxTempData__ ? window.__mxFrameSandboxTempData__ : [];
		window.__mxFrameSandboxTempData__[nowCounter] = sandboxData;
		var fullJSString = 'var __mxFrameTemp__ = (function(){';
		for (var key in sandboxData){
			fullJSString += key + '=window.__mxFrameSandboxTempData__[' + nowCounter + ']["' + key + '"],'
		}
		fullJSString = fullJSString.substr(0,fullJSString.length - 1) + ';';
		fullJSString += 'return ' + methodFunction.toString() + '})();';
		runJS(fullJSString);
		var result = __mxFrameTemp__;
		__mxFrameTemp__ = null;
		element[methodName] = result;
		for (var key in sandboxData){
			sandboxData[key] = window.__mxFrameSandboxTempData__[nowCounter][key];
		}
		window.__mxFrameSandboxTempData__[nowCounter] = null;
		return sandboxData;
	},
	mergeObjects = function(firstObject,secondObject){
		var result = firstObject;
		if (!result){return secondObject;}
		for (var key in secondObject){
			result[key] = secondObject[key];
		}
		return result;
	},
	getClassArray = function(element){
		return element.className ? element.className.split(' ') : [];
	},
	addClass = function(element,className){
		var classArray = getClassArray(element);
		if (classArray.indexOf(className) < 0){
			classArray.push(className);
			element.className = classArray.join(' ');
		}
	},
	removeClass = function(element,className){
		var classArray = getClassArray(element),
			i = classArray.indexOf(className);		
		if (i > -1){
			classArray.splice(i,1);
			element.className = classArray.join(' ');
			if (!element.className){
				element.removeAttribute('class');
			}
		}
	},
	replaceWithObject = function(text,object,lastProperty){
		var result = text,
			fullProperty = '';
		if (result){
			for (var property in object){
				if (typeof(lastProperty) === 'undefined'){
					fullProperty = property;
				}else{
					fullProperty = lastProperty + '.' + property;
				}
				//make sure content is not a HTML element
				if (typeof(object[property]) === 'object' && !(object[property] && object[property].nodeName)){
					result = replaceWithObject(result,object[property],fullProperty);
				}else{
					var reg = new RegExp('\\\{\\\{' + fullProperty + '\\\}\\\}','gm');
					result = result.replace(reg,object[property]);
				}
			}
			if (result && !lastProperty){result = result.replace(/\{\{.*\}\}/gm,'');};
			return result;
		}else{
			return false;
		}
	},
	addEvent = function(element,event,handlerFunction){
		if (element.addEventListener){
			element.addEventListener(event,handlerFunction,false);
		}else if (element.attachEvent){
			element.attachEvent('on' + event,handlerFunction);
		}else{
			element['on' + event] = handlerFunction;
		}
	},
	removeEvent = function(element,event,handlerFunction){
		if (element.removeEventListner){
			element.removeEventListener(event,handlerFunction,false);
		}else if (element.datachEvent){
			element.detachEvent('on' + event,handlerFunction);
		}else{
			element['on' + event] = null;
		}
	};

	var	initFrame = function(element,type){
		if (!element && !element.nodeName){
			console.log('[mxFrame]Input argument is not a HTML element.');
			return false;
		}
		loadLibrary($f.configures.library,function(){
			frameStartStatus = true;
			startRender(element,type);
		});
	},
	loadLibrary = function(libraryArray,callback){
		for (var i = 0;i < libraryArray.length;i++){
			var xmlUrl = libraryArray[i];
			loading.add('mxFrame_load_' + xmlUrl);
			$mx.xml.loadInByURL(libraryArray[i],function(url){
				loading.remove('mxFrame_load_' + url);
			});
		}
		if (typeof(callback) === 'function'){
			loading.empty(callback);
		}
	},
	startRender = function(element,type){
		var fragment = document.createDocumentFragment(),
			parentNode = element.parentNode,
			nextNode = element.nextElementSibling;
		fragment.appendChild(element);
		if (type){
			scanElement(element)
		}else{
			scanChildNodes(element)
		}
		var doOnshow = function(element){
			if (element.event && element.event.onshow){
				var $this = element,
					$data = element.data;
				element.event.onshow();
			}
			for (var i = 0;i < (element.childNodes ? element.childNodes.length : 0);i++){
				doOnshow(element.childNodes[i]);
			} 
		};
		/*checkAndFillBackFromFragment = function(element){
			if (renderRecord.onRender.length < 1){
				parentNode.insertBefore(fragment,nextNode);
				doOnshow(element);
			}else{
				setTimeout(function(){checkAndFillBackFromFragment(element);
				},50);
			}
		}
		setTimeout(function(){
			checkAndFillBackFromFragment(element);
		},100);
		*/
		loading.empty(function(){
			parentNode.insertBefore(fragment,nextNode);
			doOnshow(element);
		});
	},
	initDataInHTML = function(element,callback){
		//if you want to scan and init all element with attribute "data".
		/*if (element && element.nodeName.substr(0,1) != '#'){*/
		var dataLoading = $mx.signal(['mxFrameData',element]);
		if (element && (element.nodeName == 'ITEM' || (element.attributes && element.attributes['mx']))){
			element.data = element.data ? element.data : {};
			if (element.attributes['data']){
				element.data = mergeObjects(element.data,getValueFromString(element.getAttribute('data')));
				element.removeAttribute('data');
			}
			var dataUrl = element.attributes['data-url'] ? element.attributes['data-url'].value : null;
			if (dataUrl){
				var dataPosition = element.attributes['data-position'] ? element.attributes['data-position'].value : null,
					dataMethod = element.attributes['data-method'] ? element.attributes['data-method'].value : null,
					dataInput = element.attributes['data-input'] ? element.attributes['data-input'].value : null,
					dataHeaders = element.attributes['data-headers'] ? getValueFromString(element.attributes['data-headers'].value) : [],
					dataType = element.attributes['data-type'] ? element.attributes['data-type'] : 'json';
				dataInput = (dataInput.indexOf('obj') === 0) ? getValueFromString(dataInput.substr(3)) : dataInput;
				dataLoading.add(dataUrl);
				$mx.ajax({
					url: dataUrl,
					type: dataMethod,
					dataType: dataType,
					data: dataInput,
					success: function(result,url){
						if (dataPosition){
							var dataPositionArray = dataPosition.split('.'),
								data = result;
							for (var i = 0;i < dataPositionArray.length;i++){
								data = data[dataPositionArray[i]];
							}
							element.data.api = data;
						}else{
							element.data.api = result;
						}
						dataLoading.remove(url);
					},
					error: function(url){
						dataLoading.remove(url);
					},
					headers: dataHeaders,
				})
			}
			dataLoading.empty(function(){
				for (var key in element.data){
					var matchChildNode = element.querySelector('[name="' + key + '"],[id="' + key + '"]');
					if (matchChildNode){
						matchChildNode.data = element.data[key];
					}
				}
				if (typeof(callback) === 'function'){callback();}
			});
			if (element.attributes['event']){
				element.event = mergeObjects(getValueFromString(element.getAttribute('event')),element.event);
				element.removeAttribute('event');
			}
			for (var key in element.event){
				var matchChildNode = element.querySelector('[name="' + key + '"],[id="' + key + '"]');
				if (matchChildNode){
					matchChildNode.event = element.event[key];
				}
			}
		}
		//if you want to scan and init all element with attribute "data".
		/*for (var i = 0;i < element.childNodes.length;i++){
			initDataInHTML(element.childNodes[i]);
		}*/
		var childNodes = element.querySelectorAll('[mx],item');
		for (var i = 0;i < childNodes.length;i++){
			initDataInHTML(childNodes[i]);
		}
	},
	scanElement = function(element){
		if (element && (element.nodeName == 'ITEM' || (element.attributes && element.attributes['mx']))){
			loading.add(element);
			setTimeout(function(){
				//see who is rendered
				//console.log(element);
				initDataInHTML(element,function(){
					renderElement(element);
				});
			});
		}else{
			scanChildNodes(element);
		}
	},
	scanChildNodes = function(element){
		if (element && element.childNodes){
			for (var i = 0;i < element.childNodes.length;i++){
				scanElement(element.childNodes[i]);
			}
		}
	},
	renderElement = function(element){
		//console.log([element,element.data]);
		//get basic info
		var itemName = element.getAttribute('name');
		if (!itemName){
			console.info(['[mxFrame]',element,'have no name']);
			scanChildNodes(element);
			return false;
		}
		element.data.itemName = itemName;
		var itemId = element.getAttribute('id');
		if (!itemId){
			itemId = itemName + '_' + idAutoCounter;
			element.setAttribute('id',itemId);
			idAutoCounter++;
		}
		element.data.itemId = itemId;
		renderRecord.onRender.push(itemId);
		var itemClass = element.getAttribute('class');
		if (!itemClass){
			itemClass = itemName;
			addClass(element,itemClass);
		}
		element.data.itemClass = itemClass;
		
		var template = $mx.xml.tag(itemName);
		if (!template[0]){
			element.setAttribute('no-template','');
			console.info(['[mxFrame]',element,'have no template "' + itemName + '"']);
			renderRecord.onRender.splice(renderRecord.onRender.indexOf(itemId),1);
			scanChildNodes(element);
			return false;
		}

		//default data complete
		var defaultData = template.child('data')[0] ? getValueFromString(template.child('data').text) : {};
		element.data = mergeObjects(defaultData,element.data);

		//append CSS
		if (renderRecord.css.indexOf(itemName) < 0 && template.child('css')[0]){
			var CSSString = replaceWithObject(template.child('css').text,element.data);
			publicCSSElement.innerHTML += CSSString;
			renderRecord.css.push(itemName);
		}

		//preload once & preload
		if (renderRecord.preloadOnce.indexOf(itemName) < 0 && template.child('preloadOnce')[0]){
			element.data = sandboxJS({
				$this: element,
				$data: element.data,
			},
			template.child('preloadOnce').text
			)['$data'];
			renderRecord.preloadOnce.push(itemName);
		}
		if (template.child('preload')[0]){
			element.data = sandboxJS({
				$this: element,
				$data: element.data,
			},
			template.child('preload').text
			)['$data'];
		}

		//complete html content
		if (template.child('template')[0]){
			var itemInnerHTML = template.child('template').text.replace(/\{\{html\}\}/gm,element.innerHTML);
			itemInnerHTML = replaceWithObject(itemInnerHTML,element.data);
			element.innerHTML = itemInnerHTML;
		}

		//hook event
		if (template.child('eventHooks')[0]){
			var eventHooks = getValueFromString(template.child('eventHooks').text);
			for (var eventName in eventHooks){
				if (eventName && eventName != 'oncreate' && eventName != 'onshow' && eventName != 'onhide'){
					var targetItems = element.querySelectorAll(eventHooks[eventName].target);
					for (var i = 0;i < targetItems.length;i++){
						var hookFunction = (element.event && element.event[eventName]) ? element.event[eventName] : eventHooks[eventName].do;
						if (hookFunction){
							addEvent(targetItems[i],eventHooks[eventName].event,(function(){
								return function(event){
									element.data = sandboxJS({
										$thisItem: element,
										$this: this,
										$data: element.data,
									},
									'(' + hookFunction.toString() + ')(event)'
									)['$data'];
								};
							})());
							if (eventHooks[eventName].public){
								window[eventName] = function(eventFunction){
									return addEvent(targetItems[i],eventHooks[eventName].event,(function(){
										return function(event){
											element.data = sandboxJS({
												$thisItem: element,
												$this: this,
												$data: element.data,
											},
											'(' + eventFunction.toString() + ')(event)'
											)['$data'];
										};
									})());
								}
							}
						}
					}
				}
			}
			if (eventHooks.oncreate && !element.event.oncreate){element.event.oncreate = eventHooks.oncreate.do;}
			if (eventHooks.onshow && !element.event.onshow){element.event.onshow = eventHooks.onshow.do;}
			if (eventHooks.onhide && !element.event.onhide){element.event.onhide = eventHooks.onhide.do;}
		}

		//create methods
			//default methods
			element.show = function(){
				if (this.style.display == 'none'){
					this.style.display = 'block';
					if (this.event && this.event.onshow){
						var $this = element,
							$data = element.data;
						this.event.onshow();
					}
				}
			}
			element.hide = function(){
				if (this.style.display != 'none'){
					this.style.display = 'none';
					if (this.event && this.event.onhide){
						var $this = element,
							$data = element.data;
						this.event.onhide();
					}
				}
			}
			//modified methods
			if (template.child('methods')[0]){
				var methods = getValueFromString(template.child('methods').text);
				for (var methodName in methods){
					element.data = createMethodInSandbox({
						$this: element,
						$data: element.data,
					},
					element,
					methodName,
					methods[methodName])['$data'];
				}
			}

		//register private methods to public
		if (template.child('public')[0]){
			var register = getValueFromString(template.child('public').text);
			for (var publicName in register){
				window[publicName] = element[register[publicName]];
			}
		}

		//callback once & callback
		if (renderRecord.callbackOnce.indexOf(itemName) < 0 && template.child('callbackOnce')[0]){
			element.data = sandboxJS({
				$this: element,
				$data: element.data,
			},
			template.child('callbackOnce').text
			)['$data'];
			renderRecord.callbackOnce.push(itemName);
		}
		if (template.child('callback')[0]){
			element.data = sandboxJS({
				$this: element,
				$data: element.data,
			},
			template.child('callback').text
			)['$data'];
		}

		if (element.event && element.event.oncreate){
			var $this = element,
				$data = element.data;
			element.event.oncreate();
		}

		//finish
		initDataInHTML(element,function(){
			loading.remove(element);
			scanChildNodes(element);
		});
	};

	//Public
	$f.render = function(element){
		if (frameStartStatus){
			startRender(element,true);
		}else{
			initFrame(element,true);			
		}
	}
	$f.renderChildNodes = function(element){
		if (frameStartStatus){
			startRender(element,false);
		}else{
			initFrame(element,false);
		}
	}
	$f.ready = function(readyFunction){
		mxFrameReadyFunction = readyFunction;
	}
	//Auto Start
	setTimeout(function(){
		if ($f.configures.autoStart){
			$f.renderChildNodes(document.body);
		}
	});
})($mx.frame)
var $f = $f ? $f : $mx.frame;