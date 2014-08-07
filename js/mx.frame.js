/***
 * mxFrame v 0.6.0
 * Author: Maplemx
 * Email: Maplemx@gmail.com
 * I hope this is the final beta version!!!
 */

var mxFrame = mxFrame ? mxFrame : {};
(function($mx){
	"use strict";
	$mx.cache = {};

	var mergeObjects = function(firstObject,secondObject){
			var result = firstObject;
			if (!result){return secondObject;}
			for (var key in secondObject){
				result[key] = secondObject[key];
			}
			return result;		
		},
		getValueFromObjectByPosition = function(originObject,positionString){
			var positionArray = positionString.split('.'),
				result = originObject;
			for (var i = 0;i < positionArray.length;i++){
				if (result[positionArray[i]]){
					result = result[positionArray[i]];
				}else{
					console.warn('[mxFrame]Get "' + positionString + '" value from object fail, please check if position attribute exsit:');
					console.log(originObject);
					return false;
				}
			}
			return result;
		};

	/***
	 * mxFrame Configures
	 */
	$mx.configures = mergeObjects({
		debug: false,
		autoStartRender: true,
		itemLibrary: ['library/default.xml'],
		renderMark:{
			tags: ['item'],
			attributes: ['mx'],
		},
		templateNameAttribute: 'name',
	},$mx.configures);
	$mx.info = {
		version: 'v 0.6.0',
		author: 'Maplemx',
		email: 'Maplemx@gmail.com',
		url: "https://github.com/maplemx/mxFrame"
	}

	/***
	 * mxSignal: thread controller using signal
	 */
	var mxFrameThreads = {};
	var MxSignal = function(threadName){
		this.name = threadName;
		var threadInfo = mxFrameThreads[threadName] = mxFrameThreads[threadName] ? mxFrameThreads[threadName] : 
			{
				signals: [],
				waits: {},
				empty: [],
			};

		var addSignal = function(signal){
				if (threadInfo.signals.indexOf(signal) == -1){
					threadInfo.signals.push(signal);
				}
			},
			removeSignal = function(signal){
				var index = threadInfo.signals.indexOf(signal);
				if (index > -1){
					threadInfo.signals.splice(index,1);
				}
			},
			addWait = function(signal,execFunc){
				var waitFuncs = threadInfo.waits[signal] = threadInfo.waits[signal] ? threadInfo.waits[signal] : [];
				if (waitFuncs.indexOf(execFunc) == -1){
					waitFuncs.push(execFunc);
				}
			},
			removeWait = function(signal,execFunc){
				var waitFuncs = threadInfo.waits[signal] = threadInfo.waits[signal] ? threadInfo.waits[signal] : [],
					index = waitFuncs.indexOf(execFunc);
				if (index > -1){
					waitFuncs.splice(index,1);
				}
			},
			addEmpty = function(execFunc){
				if (threadInfo.empty.indexOf(execFunc) == -1){
					threadInfo.empty.push(execFunc);
				}
			},
			removeEmpty = function(execFunc){
				var index = threadInfo.empty.indexOf(execFunc);
				if (index > -1){
					threadInfo.empty.splice(index,1);
				}
			},
			tryEmpty = function(){
				if (threadInfo.signals.length == 0){
					for (var i = 0,len = threadInfo.empty.length;i < len;i++){
						threadInfo.empty.splice(i,1)[0]();
						i--;
						len--;
					}
				}
			},
			trySignal = function(signal,removeSignalWhenActived){
				removeSignalWhenActived = removeSignalWhenActived ? removeSignalWhenActived : false;
				if (threadInfo.signals.length > 0){
					if (signal){
						if (threadInfo.signals.indexOf(signal) > -1 && threadInfo.waits[signal]){
							for (var i = 0,len = threadInfo.waits[signal].length;i < len;i++){
								threadInfo.waits[signal].splice(i,1)[0]();
								i--;
								len--;
								if (removeSignalWhenActived){
									removeSignal(signal);
								}
							}
						}
					}else{
						for (var waitSignal in threadInfo.waits){
							var index = threadInfo.signals.indexOf(waitSignal);
							if (index > -1){
								for (var i = 0,len = threadInfo.waits[waitSignal].length; i < len;i++){
									threadInfo.waits[waitSignal].splice(i,1)[0]();
									i--;
									len--;
									if (removeSignalWhenActived){
										removeSignal(waitSignal);
									}
								}
							}
						}
					}
				}
			};

		this.add = function(signal){
			addSignal(signal);
			trySignal(signal);
		}
		this.remove = function(signal){
			removeSignal(signal);
			tryEmpty();
		}
		this.when = function(signal,execFunc){
			addWait(signal,execFunc);
			trySignal(signal);
		}
		this.cancelWhen = function(signal,execFunc){
			removeWait(signal,execFunc);
		}
		this.empty = function(execFunc){
			addEmpty(execFunc);
			tryEmpty();
		}
		this.cancelEmpty = function(execFunc){
			removeEmpty(execFunc);
		}
		this.flash = function(signal){
			trySignal(signal);
		}
		this.selfScan = function(){
			trySignal();
		}
		this.have = function(signal){
			return (threadInfo.signals.indexOf(signal) > -1);
		}
		this.isEmpty = function(){
			return (threadInfo.singals.length == 0);
		},
		this.threadInfo = threadInfo;

		return this;
	}
	$mx.signal = function(threadName){
		return new MxSignal(threadName);
	}

	/***
	 * mxAjax: ajax requester
	 */
	/*Require this function:
	getValueFromObjectByPosition = function(originObject,positionString){
			var positionArray = positionString.split('.'),
				result = originObject;
			for (var i = 0;i < positionArray.length;i++){
				if (result[positionArray[i]]){
					result = result[positionArray[i]];
				}else{
					console.warn('[mxFrame]Get "' + positionString + '" value from object fail, please check if position attribute exsit:');
					console.log(originObject);
					return false;
				}
			}
			return result;
		};
	*/
	var ajaxRequest = function(ajaxArguments){
		if (!ajaxArguments){console.warn('[Ajax request fail] no ajax argument object!');return false;}
		var url = ajaxArguments.url,
			method = ajaxArguments.method ? ajaxArguments.method.toLowerCase() : (ajaxArguments.type ? ajaxArguments.type.toLowerCase() : 'get'),
			dataType = ajaxArguments.dataType ? ajaxArguments.dataType.toLowerCase() : null,
			data = ajaxArguments.data ? ajaxArguments.data : null,
			headers = (typeof(ajaxArguments.headers) === 'object') ? ajaxArguments.headers : null,
			success = (typeof(ajaxArguments.success) === 'function') ? ajaxArguments.success : null,
			error = (typeof(ajaxArguments.error) === 'function') ? ajaxArguments.error : null,
			async = typeof(ajaxArguments.async) === 'boolean' ? ajaxArguments.async : true,
			position = ajaxArguments.position ? ajaxArguments.position : null,
			errorCallbackCount = 0,
			requestUrl = url,
			requestData;
		if (!url){console.warn('[Ajax request fail] url is empty!');return false;}
		if ($mx.configures.debug){console.info('[Ajax request process]request start: ' + url);}

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
		},
		handleResult = function(){
			if ($mx.configures.debug){
				console.info('[Ajax request process] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
			}
			if (ajaxObject.readyState == 4 && ((ajaxObject.status >= 200 && ajaxObject.status < 300) || ajaxObject.status == 304)){
				var result = null;
				switch (dataType){
					case 'text':
						result = ajaxObject.responseText;
						break;
					case 'xml':
						result = ajaxObject.responseXML ? (position ? ajaxObject.responseXML.getElementsByTagName(position) : ajaxObject.responseXML) : null;
						break;
					case 'json':
					default:
						result = ajaxObject.response ? (position ? getValueFromObjectByPosition(JSON.parse(ajaxObject.response),position) : JSON.parse(ajaxObject.response)) : null;
						break;
				}
				if (typeof(success) == 'function'){
					success(result,url);
				}
			}else if (ajaxObject.readyState > 1 && !((ajaxObject.status >= 200 && ajaxObject.status < 300) || ajaxObject.status == 304)){
				console.warn('[Ajax request fail] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
				if (typeof(error) === 'function' && errorCallbackCount == 0){error(url);errorCallbackCount++;}
			}
		};

		var ajaxObject = createXHR();
		requestData = dataFormat(data);
		if (ajaxObject){
			if (async){
				ajaxObject.onreadystatechange = function(){
					handleResult();
				}
			}
			if (method === 'get'){
				requestUrl = addDataToParam(url,data);
			}
			ajaxObject.open(method,requestUrl,async);
			//default headers
			//ajaxObject.setRequestHeader('X-Requested-With','XMLHttpRequest');
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
			if (!async){
				handleResult();
			}
		}else{
			return false;
		}
	};
	$mx.ajax = function(ajaxArguments){
		ajaxRequest(ajaxArguments);
	}
	

	/***
	 * mxXMLReader: XML file load in, multiple files merge and node quick fetch
	 **/
	var MxXML = function(groupName){
		//Create default XML content
		if (!document.all){
			XMLDocument.prototype.__defineGetter__('xml',function(){
				return new XMLSerializer().serializeToString(this);
			});
		}
		var createXML = function(defaultContent){
			if (document.all){
				var result = new ActiveXObject('Microsoft.XMLDOM');
				result.loadXML(defaultContent);
				return result;
			}else{
				return new DOMParser().parseFromString(defaultContent,"text/xml");
			}
		};
		var xmlContent = createXML('<mxFrameItemLibrary></mxFrameItemLibrary>');

		var xmlLoadInByObject = function(xmlObject,callback){
				if (xmlContent){
					var resultObject = xmlContent;
					while (xmlObject.documentElement.hasChildNodes()){
						resultObject.documentElement.appendChild(xmlObject.documentElement.childNodes[0]);
					}
					xmlContent = resultObject;
					if (typeof(callback) === 'function'){
						callback();
					}
				}else{
					xmlContent = xmlObject;
					if (typeof(callback) === 'function'){
						callback();
					}
				}
			},
			xmlLoadInByUrl = function(url,callback,errorCallback){
				ajaxRequest({
					url: url,
					dataType: 'XML',
					success: function(result,url){
						if (result){
							xmlLoadInByObject(result,function(){
								if ($mx.configures.debug){
									console.info('[XML load in success] ' + url);
								}
								if (typeof(callback) === 'function'){
									callback(url);
								}
							});
						}else{
							console.warn('[XML load in fail]Can\'t read XML file or XML file does not follow XML standard: ' + url);
						}
					},
					error: function(url){
						console.warn('[XML load in fail]Can\'t load XML file: ' + url);
						if (typeof(errorCallback) === 'function'){
							errorCallback(url);
						}
					},
				});
			};

		var XMLNode = function(nodeName,nodeNumber,parentNode,onlyChildNodes){
				parentNode = parentNode ? parentNode : xmlContent;
				nodeNumber = nodeNumber ? nodeNumber : 0;
				onlyChildNodes = onlyChildNodes ? onlyChildNodes : false;
				this.content = undefined;
				if (!xmlContent){
					console.warn('[Empty XML content]No content in XMLReader now!');
					return false;
				}
				if (!nodeName){
					this.content = xmlContent;
				}else if (onlyChildNodes){
					var childNodes = parentNode.childNodes,
						childCount = 0;
					for (var i = 0;i < childNodes.length;i++){
						if (childNodes[i].tagName && childNodes[i].tagName.toLowerCase() == nodeName.toLowerCase()){
							if (childCount == nodeNumber){
								this.content = childNodes[i];
								break;
							}else{
								childCount++;
							}
						}
					}
				}else{
					this.content = parentNode.getElementsByTagName(nodeName)[nodeNumber];
				}

				if (this.content){
					this.tag = function(nodeName,nodeNumber){
						return new XMLNode(nodeName,nodeNumber,this.content,false);
					}
					this.child = function(nodeName,nodeNumber){
						return new XMLNode(nodeName,nodeNumber,this.content,true);
					}
					this.text = this.content.textContent;
					this.html = this.content.innerHTML;
				}else{
					if ($mx.configures.debug){
						console.info('[no XML node]"' + nodeName + '" node can not be found in this node: "' + parentNode.nodeName + '"');
					}
				}

				return this;
			};

		this.name = groupName;
		this.getContent = function(){
			return xmlContent;
		}
		this.load = function(url,callback,errorCallback){
			xmlLoadInByUrl(url,callback,errorCallback);
		}
		this.addXML = function(xmlObject,callback){
			xmlLoadInByObject(xmlObject,callback);
		}
		this.node = function(nodeName,nodeNumber,parentNode,onlyChildNodes){
			return new XMLNode(nodeName,nodeNumber,parentNode,onlyChildNodes);
		}
		return this;
	};
	$mx.xml = function(groupName){
		return new MxXML(groupName);
	}

	/***
	 * mxJSSandbox: run JS in sandbox
	 */
	var mxJSSandboxProcessCounter = 0;
	window.__mxFrame__sandboxData = window.__mxFrame__sandboxData ? window.__mxFrame__sandboxData : [];
	var runJS = function(JSString){
			if ($mx.configures.debug){
				console.info('[mxSandbox]run JS code:');
				console.log(JSString);
			}
			var script = document.createElement('script');
			script.setAttribute('type','text/javascript');
			script.innerHTML = JSString;
			document.body.appendChild(script);
			script.remove();
		},
		sandboxJS = function(sandboxData,JSString){
			var sandboxId = mxJSSandboxProcessCounter;
			mxJSSandboxProcessCounter++;
			var sandboxJSString = ';var ';
			window.__mxFrame__sandboxData[sandboxId] = sandboxData;
			for (var key in sandboxData){
				sandboxJSString += key + '=window.__mxFrame__sandboxData[' + sandboxId + ']["' + key + '"],';
			}
			sandboxJSString = sandboxJSString.substr(0,sandboxJSString.length - 1) + ';\r\n\r\n\r\n';
			sandboxJSString += JSString + ';\r\n\r\n\r\n';
			for (var key in sandboxData){
				sandboxJSString += 'window.__mxFrame__sandboxData[' + sandboxId + ']["' + key + '"] = ' + key + ';';
			}
			runJS(sandboxJSString);
			sandboxData = window.__mxFrame__sandboxData[sandboxId];
			window.__mxFrame__sandboxData[sandboxId] = null;
			return sandboxData;
		},
		convertStringToValue = function(JSString,withArea){
			var result;
			if (JSString && JSString.replace(/(\t|\s|\r|\n)/gm,'')){
				if (withArea){
					runJS('with(' + withArea + '){var __mxFrame__sandboxTemp = '+ JSString + ';}');
				}else{
					runJS('var __mxFrame__sandboxTemp = '+ JSString + ';');
				}
				var result = __mxFrame__sandboxTemp;
				__mxFrame__sandboxTemp = null;
			}
			return result;
		};
	$mx.run = runJS;
	$mx.sandbox = sandboxJS;
	$mx.toValue = convertStringToValue;

	/***
 	 * mxSelector: jQuery-like selector to boot develop
 	 */
 	var getContentFromAttribute = function(element,attributeName){
			return $mx.toValue(element.getAttribute(attributeName));
		},
		getContentFromAPIByAttribute = function(element,attributeName){
			var APIInfo = $mx.toValue(element.getAttribute(attributeName)),
				APIData = {};
			if (APIInfo){
				APIInfo.async = false;
				APIInfo.success = function(result){
					APIData = result;
				};
				APIInfo.error = function(url){
					console.warn('[mxRender]Load element data from API fail:');
					console.log(element);
				};
				$mx.ajax(APIInfo);
				return APIData;
			}else{
				return false;
			}
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
		replaceTextWithObject = function(text,object,lastProperty){
			var result = text,
				fullProperty = '';
			if (result && object){
				for (var property in object){
					if (typeof(lastProperty) === 'undefined'){
						fullProperty = property;
					}else{
						fullProperty = lastProperty + '.' + property;
					}
					//make sure content is not a HTML element
					if (typeof(object[property]) === 'object' && !(object[property] && object[property].nodeName)){
						result = replaceTextWithObject(result,object[property],fullProperty);
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
		humpToHyphen = function(string){
			return string.replace(/([A-Z])/g,"-$1").toLowerCase(); 
		},
		hyphenToHump = function(string){
			return string.replace(/-(\w)/g,function(x){return x.slice(1).toUpperCase();});
		},
		getAttributesObject = function(element){
			var attributes = element.attributes,
				result = {};
			for (var i = 0;i < attributes.length;i++){
				result[hyphenToHump(attributes[i].name)] = attributes[i].value;
			}
			return result;
		},
		bindEventToElement = function(element,event,handlerFunction){
			if (element.addEventListener){
				element.addEventListener(event,handlerFunction,false);
			}else if (element.attachEvent){
				element.attachEvent('on' + event,handlerFunction);
			}else{
				element['on' + event] = handlerFunction;
			}
		},
		removeEventFromElement = function(element,event,handlerFunction){
			if (element.removeEventListner){
				element.removeEventListener(event,handlerFunction,false);
			}else if (element.datachEvent){
				element.detachEvent('on' + event,handlerFunction);
			}else{
				element['on' + event] = null;
			}
		};

 	var MxSelector = function(selectQuery,elementNumber){
 		if (!document.querySelector(selectQuery)){
 			console.warn('[mxSelector]This query can not select any element in this page: "' + selectQuery+ '"');
 			return false;
 		}
 		var MxAttr = function(element,attrName){
 				this.text = element.getAttribute(attrName);
	 			this.value = getContentFromAttribute(element,attrName);
	 			this.apiValue = getContentFromAPIByAttribute(element,attrName);
	 			return this;
	 		},
	 		MxClass = function(element){
	 			this.text = this.value = element.getAttribute('class');
	 			this.classArray = getClassArray(element);
	 			this.add = function(className){
	 				addClass(element,className);
	 			};
	 			this.remove = function(className){
	 				removeClass(element,className);
	 			}
	 		};
 		this.elements = elementNumber ? [document.querySelectorAll(selectQuery)[elementNumber]] : document.querySelectorAll(selectQuery);
 		this.first = this.elements[0];
 		this.last = this.elements[this.elements.length - 1];
 		if (!this.first){
 			console.warn('[mxSelector]This query and element order number can not select any element in this page: query:"' + selectQuery+ '", order number:"' + elementNumber + '"');
 			return false;
 		}
 		this.attr = function(attrName){
 			return new MxAttr(this.first,attrName);
 		}
 		this.class = (function(element){
 			return new MxClass(element);
 		})(this.first);
 		this.replaceWithObject = function(object){
 			this.first.innerHTML = replaceTextWithObject(this.first.innerHTML,object);
 		}
 		this.attrs = getAttributesObject(this.first);
 		this.addEvent = function(event,handlerFunction){
 			bindEventToElement(this.first,event,handlerFunction);
 		};
 		this.removeEvent = function(event,handlerFunction){
 			removeEventFromElement(this.first,event,handlerFunction);
 		}
 		return this;
 	}

 	$mx.selector = function(selectQuery){
 		return new MxSelector(selectQuery);
 	}

	/***
	 * mxRender: item tag auto render
	 */
	$mx.render = {};
	(function($r){
		var targetItemQuery = (function(){
				var result = '',
					renderTags = $mx.configures.renderMark.tags,
					renderAttributes = $mx.configures.renderMark.attributes;
				for (var i = 0;i < renderTags.length;i++){
					result += renderTags[i] + ',';
				}
				for (var i = 0;i < renderAttributes.length;i++){
					result += '[' + renderAttributes[i] + '],';
				}
				result = result.substr(0,result.length - 1);
				return result;
			})(),
			headElement = document.getElementsByTagName('head')[0] ? document.getElementsByTagName('head')[0] : (function(){
				var newHeadElement = document.createElement('head');
				document.body.appendChild(newHeadElement);
				return newHeadElement;
			})(),
			publicCSSElement = (function(){
				var newPublicCSSElement = document.createElement('style');
				headElement.appendChild(newPublicCSSElement);
				return newPublicCSSElement;
			})(),
			loadItemLibraryThread = $mx.signal('mxRender_loadItemlibrary'),
			itemLibrary = $mx.xml('mxRenderlibrary'),
			idAutoCounter = 0,
			renderRecord = {
				CSS: [],
			};		

		var processRender = function(element,onlyChildNodes){
				if (!element){
					console.warn('[mxRender]Need input an element to be rendered.');
					return false;
				}
				if (!targetItemQuery){
					console.warn('[mxRender]At least one render target query rule must be set. Please check mxFrame configures. (renderTags, renderAttributes)');
					return false;
				}
				onlyChildNodes = onlyChildNodes ? onlyChildNodes : false;
				var rootElement = element;
				
				var loadLibrary = function(){
						if (!loadItemLibraryThread.have('loadSuccess')){
							if ($mx.configures.debug){
								console.info('[mxRender]Start loading library...');
							}
							var itemLibraryList = $mx.configures.itemLibrary;
							for (var i = 0;i < itemLibraryList.length;i++){
								var url = itemLibraryList[i];
								loadItemLibraryThread.add(url);
								itemLibrary.load(url,function(url){
									if ($mx.configures.debug){
										console.info('[mxRender]Load library success: ' + url);
									}
									loadItemLibraryThread.remove(url);
								},function(url){
									console.warn('[mxRender]Load library fail: ' + url);
									//Forbid next line if you don't want render start without all library loaded
									loadItemLibraryThread.remove(url);
								});
							}
							loadItemLibraryThread.empty(function(){
								if ($mx.configures.debug){
									console.info('[mxRender]Finish loading library...');
								}
								loadItemLibraryThread.add('loadSuccess');
							});
						}
					},
					createPlaceHoldElement = function(element){
						//place-hold element with content
						var newPlaceHoldElement = element.cloneNode(false);
						newPlaceHoldElement.style = element.style;
						newPlaceHoldElement.innerHTML = 'Rendering...';
						newPlaceHoldElement.style.background = '#CCC';
						newPlaceHoldElement.style.textAlign = 'center';
						//or you can choose show nothing in place-hold element
						/*
						var newPlaceHoldElement = element.cloneNode(false);
						newPlaceHoldElement.style = element.style;
						newPlaceHoldElement.innerHTML = '';	
						*/
						return newPlaceHoldElement;
					},
					startRender = function(element,onlyChildNodes){
						if (onlyChildNodes){
							scanElementForDataBinding(rootElement);
							bindDataThread.empty(function(){
								scanElementChildNodesForRender(element);
							});
						}else{
							scanElementForDataBinding(rootElement);
							bindDataThread.empty(function(){
								scanElementForRender(element);
							});
						}
					},
					scanElementForDataBinding = function(element){
						if (element && element.nodeType === 1){
							var dataBindingId = ['bindData',element];
							bindDataThread.add(dataBindingId);
							setTimeout(function(){
								bindDataToElement(element);
								bindDataThread.remove(dataBindingId);
							});
						}
						if (element && element.hasChildNodes()){
							for (var i = 0;i < element.childNodes.length;i++){
								scanElementForDataBinding(element.childNodes[i]);
							}
						}
					},
					bindDataToElement = function(element){
						var separateDataAndEvent = function(attributeObject){
							var result = {
								data: {},
								event: {},
							};

							for (var key in attributeObject){
								if (key.substr(0,2) == 'on'){
									result.event[key.substr(2,key.length - 2)] = $mx.toValue(attributeObject[key]);
								}else{
									result.data[key] = attributeObject[key];
								}
							}
							return result;
						},
						makeChildNodesInheritData = function(data,element,attributeName){
							if (data){
								for (var key in data){
									if (data[key] && data[key].targetItem && data[key].targetKey && key.substr(0,1) === '$' && key.length > 1){
										var pinToKey = key.substr(1,key.length - 1),
											targetElements = element.querySelectorAll(data[key].targetItem),
											targetKey = data[key].targetKey;
										for (var i = 0; i < targetElements.length;i++){
											targetElements[i].mxFrame = targetElements[i].mxFrame ? targetElements[i].mxFrame : {};
											targetElements[i].mxFrame[attributeName] = targetElements[i].mxFrame[attributeName] ? targetElements[i].mxFrame[attributeName] : {};
											targetElements[i].mxFrame[attributeName][targetKey] = data[pinToKey];
										}
									}
								}
							}
						};

						var dataInAttribute = getContentFromAttribute(element,'data'),
							eventInAttribute = getContentFromAttribute(element,'event'),
							dataFromAPI = getContentFromAPIByAttribute(element,'data-api'),
							eventFromAPI = getContentFromAPIByAttribute(element,'event-api');

						element.mxFrame = element.mxFrame ? element.mxFrame : {};
						//Edit here to set priorty of data(default: data&event attribute value > other attributes > api > mxFrameObject)
						//In case it's easy to code, request that get data from API is set to "sync" (will block process until get data)
						//load large data to element from API or load from API in one element many times in different part is extremely not recommended!!!
						element.mxFrame.data = mergeObjects(dataInAttribute,mergeObjects(dataFromAPI,element.mxFrame.data));
						element.mxFrame.event = mergeObjects(eventInAttribute,mergeObjects(eventFromAPI,element.mxFrame.event));
						element.removeAttribute('data');
						element.removeAttribute('event');
						element.removeAttribute('data-api');
						element.removeAttribute('event-api');
						var attributeObject = separateDataAndEvent(getAttributesObject(element));
						element.mxFrame.data = mergeObjects(attributeObject.data,element.mxFrame.data);
						element.mxFrame.event = mergeObjects(attributeObject.event,element.mxFrame.event);
						makeChildNodesInheritData(element.mxFrame.data,element,'data');
						makeChildNodesInheritData(element.mxFrame.event,element,'event');
					},
					scanElementForRender = function(element){
						var scanJobId = ['scan',element];
						renderThread.add(scanJobId);

						var isTarget = function(element,targetItemQuery){
							var targetGroup = element.parentNode.querySelectorAll(targetItemQuery);
							for (var i = 0;i < targetGroup.length;i++){
								if (element === targetGroup[i]){
									return true;
								}
							}
							return false;
						}

						if (element && element.nodeType === 1 && isTarget(element,targetItemQuery)){
							var renderJobId = ['render',element]; 
							renderThread.add(renderJobId);
							setTimeout(function(){
								renderElement(element);
								renderThread.remove(renderJobId);
							});
						}else{
							scanElementChildNodesForRender(element);
						}
						renderThread.remove(scanJobId);
					},
					scanElementChildNodesForRender = function(element){
						if (element && element.childNodes){
							for (var i = 0;i < element.childNodes.length;i++){
								scanElementForRender(element.childNodes[i]);
							}
						}
					},
					renderElement = function(element){
						if ($mx.configures.debug){
							console.info('[mxRender]Start render element:');
							console.log(element);
						}
						//fullfill basic information
						var templateName = element.getAttribute($mx.configures.templateNameAttribute);
						if (!templateName){
							console.warn('[mxRender]Can\'t find template name attribute "' + $mx.configures.templateNameAttribute + '" in element, or this attribute has no value:');
							console.log(element);
							startRender(element,true);
							return false;
						}
						element.mxFrame.data.templateName = templateName;
						var itemName = element.getAttribute('name');
						if (!itemName){
							itemName = templateName;
							element.setAttribute('name',itemName);
						}
						var itemId = element.getAttribute('id');
						if (!itemId){
							itemId = templateName + '_' + idAutoCounter;
							element.setAttribute('id',itemId);
							idAutoCounter++;
						}
						addClass(element,templateName);
						element.mxFrame.data = mergeObjects(getAttributesObject(element),element.mxFrame.data);

						//load template
						var template = itemLibrary.node(templateName);
						if (!template || !template.content){
							element.setAttribute('mxRender-no-template','');
							console.warn('[mxRender]Can\'t find template "' + templateName + '":');
							console.log(element);
							startRender(element,true);
							return false;
						}

						//fullfill data with default data in library
						var defaultData = template.child('data').text;
						defaultData = $mx.toValue(defaultData);
						element.mxFrame.data = mergeObjects(defaultData,element.mxFrame.data);
						
						//append CSS
						if (template.child('css').content && renderRecord.CSS.indexOf(templateName) == -1){
							var CSSString = replaceTextWithObject(template.child('css').text,element.mxFrame.data);
							publicCSSElement.innerHTML += CSSString;
							renderRecord.CSS.push(templateName);
						}

						//event-change methods
						//(put here in case that preload and callback may edit events)
						element.mxFrame.event = element.mxFrame.event ? element.mxFrame.event : {};
						var setEvent = function(element,eventName,handlerFunction){
								if (element && eventName && typeof(handlerFunction) === 'function'){
									element.mxFrame.event[eventName.toLowerCase()] = handlerFunction;
								}
							},
							removeEvent = function(element,eventName){
								if (element && eventName){
									element.mxFrame.event[eventName.toLowerCase()].remove();
								}
							};
						element.setEvent = function(eventName,handlerFunction){
							setEvent(element,eventName,handlerFunction);
						},
						element.removeEvent = function(eventName){
							removeEvent(element,eventName);
						}
						element.eventList = element.mxFrame.event;

						var setMethod = function(element,methodName,methodFunction,injectFunctions){
								if (element && methodName && typeof(methodFunction) === 'function'){
									element[methodName] = function(){
										var sandboxData = {
											$this: element,
											$data: element.mxFrame.data,
											$mxFrame: element.mxFrame,
										};
										if (injectFunctions){
											for (var key in injectFunctions){
												sandboxData[key] = injectFunctions[key];
											}
										}
										element.mxFrame = $mx.sandbox(
											sandboxData,
											'(' + methodFunction.toString() + ')()'
										)['$mxFrame'];
									};
								}
							},
							removeMethod = function(element,methodName){
								if (element && methodName){
									element[methodName].remove();
								}
							},
							runDefaultEvent = function(element,eventName){
								element.mxFrame = $mx.sandbox({
									$this: element,
									$data: element.mxFrame.data,
									$mxFrame: element.mxFrame
								},
								'(' + element.mxFrame.event[eventName.toLowerCase()].toString() + ')()'
								)['$mxFrame'];
							};
						element.setMethod = function(methodName,methodFunction){
							setMethod(element,methodName,methodFunction);
						}
						element.removeMethod = function(methodName){
							removeMethod(element,methodName);
						}

						//preload
						if (template.child('preload').content){
							element.mxFrame = $mx.sandbox({
								$this: element,
								$data: element.mxFrame.data,
								$mxFrame: element.mxFrame,
							},
							template.child('preload').text
							)['$mxFrame'];
						}

						//fill HTML content
						if (template.child('html').content){
							var itemInnerHTML = template.child('html').text.replace(/\{\{html\}\}/gm,element.innerHTML);
							itemInnerHTML = replaceTextWithObject(itemInnerHTML,element.mxFrame.data);
							element.innerHTML = itemInnerHTML;
						}

						//callback
						if (template.child('callback').content){
							element.mxFrame = $mx.sandbox({
								$this: element,
								$data: element.mxFrame.data,
								$mxFrame: element.mxFrame,
							},
							template.child('callback').text
							)['$mxFrame'];
						}

						//hook events
						element.mxFrame.event = element.mxFrame.event ? element.mxFrame.event : {};
						if (template.child('event').content){
							var events = $mx.toValue(template.child('event').text);
							for (var eventName in events){
								if (eventName.toLowerCase() != 'itemcreate' && eventName.toLowerCase() != 'itemshow' && eventName.toLowerCase() != 'itemhide'){
									var targetElements = events[eventName].target ? element.querySelectorAll(events[eventName].target) : {};
									for (var i = 0;i < targetElements.length;i++){
										element.mxFrame.event[eventName.toLowerCase()] = (element.mxFrame.event && element.mxFrame.event[eventName.toLowerCase()]) ? element.mxFrame.event[eventName.toLowerCase()] : events[eventName].default;
										bindEventToElement(targetElements[i],events[eventName].event,function(){
											element.mxFrame = $mx.sandbox({
												$this: element,
												$me: this,
												$data: element.mxFrame.data,
												$mxFrame: element.mxFrame,
											},
											'(' + element.mxFrame.event[eventName.toLowerCase()].toString() + ')()'
											)['$mxFrame'];
										});
									}
								}else{
									element.mxFrame.event[eventName.toLowerCase()] = element.mxFrame.event && element.mxFrame.event[eventName.toLowerCase()] ? element.mxFrame.event[eventName.toLowerCase()] : events[eventName].default;
								}
							}
						}

						//create methods
						//default methods
						setMethod(element,'hide',function(){
							if ($this.style.display != 'none'){
								$mxFrame.lastDisplay =  $this.style.display;
								$this.style.display = 'none';
								if (typeof($this.mxFrame.event['itemhide']) === 'function'){
									runDefaultEvent($this,'itemhide');
								}
							}
						},{
							runDefaultEvent: runDefaultEvent,
						});
						setMethod(element,'show',function(){
							if ($this.style.display == 'none'){
								$this.style.display = $mxFrame.lastDisplay ? $mxFrame.lastDisplay : 'block';
								if (typeof($this.mxFrame.event['itemshow']) === 'function'){
									runDefaultEvent($this,'itemshow');
								}
							}
						},{
							runDefaultEvent: runDefaultEvent,
						});
						//user define methods
						if (template.child('method').content){
							var methods = $mx.toValue(template.child('method').text);
							for (var methodName in methods){
								if (!element[methodName]){
									setMethod(element,methodName,methods[methodName].default);
								}							
								var publicMethodName = methods[methodName].public;
								if (publicMethodName){
									window[publicMethodName] = window[publicMethodName] ? window[publicMethodName] : function(){
										element[methodName]();
									}
								}
								
							}
						}

						//onCreate
						if (typeof(element.mxFrame.event['itemcreate']) === 'function'){
							runDefaultEvent(element,'itemcreate');
						}

						//onShow(when finish render and show all items)
						renderThread.when('renderFinish',function(){
							if (typeof(element.mxFrame.event['itemshow']) === 'function'){
								runDefaultEvent(element,'itemshow');
							}
						});

						//render this rendered item's child nodes, in case of nesting
						//data in this rendered item will be rebinded
						startRender(element,true);
					};

				var bindDataThread = $mx.signal(['mxRender_bindData_',element]),
					renderThread = $mx.signal(['mxRender_render_',element]),
					placeHoldElement = createPlaceHoldElement(element),
					renderFragment = document.createDocumentFragment();

				if (loadItemLibraryThread.have('loadSuccess')){
					if (!itemLibrary.getContent()){
						console.warn('[mxRender]No item library loaded. Please make sure at least one library was loaded.');
						return false;
					}
					element.parentNode.insertBefore(placeHoldElement,element);
					renderFragment.appendChild(element);
					startRender(element,onlyChildNodes);
					renderThread.empty(function(){
						renderThread.add('renderFinish');
					});
					renderThread.when('renderFinish',function(){
						placeHoldElement.parentNode.insertBefore(renderFragment,placeHoldElement);
						placeHoldElement.remove();
					});
				}else{
					loadLibrary();
					loadItemLibraryThread.when('loadSuccess',function(){
						startRender(element,onlyChildNodes);
					});
				}
			};
			

		$r.element = function(element){
			processRender(element,false);
		}
		$r.childNodes = function(element){
			processRender(element,true);
		}
	})($mx.render);
	if ($mx.configures.autoStartRender){
		$mx.render.element(document.getElementsByTagName('body')[0]);
	}
})(mxFrame);

var $mx = $mx ? $mx : mxFrame,
	$$mx = $$mx ? $$mx : $mx.selector;