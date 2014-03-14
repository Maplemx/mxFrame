var scanCounter = 0;
/**
 * mxRender v 0.3.2 Beta
 * An auto render frame (only for Chrome now)
 * Author: Maplemx
 * Email: maplemx@gmail.com
 */
 	if (typeof($mx) != 'object'){var $mx = {};}	

	/**
	 * mxTraffic v 0.1.0 Beta
	 */
	$mx.traffic = {};
	(function($t){
		//Private Attributes
		var signals = [],
			waits = [];

		//Private Methods
		var addSignal = function(signal){
				if (signals.indexOf(signal) > -1){
					return true;
				}else{
					return signals.push(signal);
				}
			},
			removeSignal = function(signal){
				var index = signals.indexOf(signal);
				if (index > -1){
					return signals.splice(index,1);
				}else{
					return true;
				}
			},
			checkWait = function(waitObject){
				if (typeof(waitObject) != 'object'){return false;}
				if (typeof(waitObject.signal) == 'undefined'){return false;}
				if (typeof(waitObject.do) != 'function'){return false;}
				if (waitObject.sort != 'always'){waitObject.sort = 'once';}
				return waitObject;
			},
			addWait = function(waitObject){
				if (waits.indexOf(waitObject) > -1){
					return true;
				}else{
					return waits.push(waitObject);
				}
			},
			removeWait = function(waitObject){
				var index = waits.indexOf(waitObject);
				if (index > -1){
					return waits.splice(index,1);
				}else{
					return true;
				}
			},
			inSignals = function(signal){
				return (signals.indexOf(signal) > -1);
			},
			doWait = function(waitObject){
				setTimeout(waitObject.do);
				if (waitObject.sort != 'always'){
					removeWait(waitObject);
				}
			},
			tryWait = function(waitObject){
				if (inSignals(waitObject.signal)){
					doWait(waitObject);				
				}
			},
			trySignal = function(signal){
				for (var i in waits){
					if (waits[i].signal == signal){
						doWait(waits[i]);
					}
				}
			};

		//Public Attributes
		//$t.signals = signals;
		//$t.waits = waits;

		//Public Methods
		$t.flash = function(signal){
			trySignal(signal);
		};
		$t.turnOn = function(signal){
			addSignal(signal);
			trySignal(signal);
		};
		$t.turnOff = function(signal){
			removeSignal(signal);		
		};
		$t.inLine = function(waitObject){
			if (waitObject = checkWait(waitObject)){
				addWait(waitObject);
				tryWait(waitObject);
			}
		};
		$t.outLine = function(waitObject){
			removeWait(waitObject);
		};
		$t.doFullScan = function(){
			for (var waitObject in waits){
				tryWait(waitObject);
			}
		};
	})($mx.traffic);

	/**
	 * mxAjax v 0.1.0 Beta
	 */
	(function($mx){
		$mx.ajax = function(ajaxParams){
			var type = ajaxParams.type,
				url = ajaxParams.url,
				data = ajaxParams.data,
				dataType = ajaxParams.dataType,
				success = ajaxParams.success,
				error = ajaxParams.error;

			if (typeof(type) == 'undefined'){type = 'get';}type = type.toString().toLowerCase();
			if (typeof(dataType) != 'undefined'){dataType = dataType.toLowerCase();}
			if (url == null){console.warn('[Ajax request fail] have no url!');return false;}

			if (window.XMLHttpRequest){
				var ajaxObject = new XMLHttpRequest();
			}else{
				var ajaxObject = new ActiveXObject('Microsoft.XMLHTTP');
			}

			ajaxObject.open(type,url,true);
			if (type == 'post'){
				ajaxObject.setRequestHeader('content-type','application/x-www-form-urlencoded');
				ajaxObject.send(data);
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
							result = eval('(' + ajaxObject + ')');
							break;
					}
					if (typeof(success) == 'function'){
						success(result);
					}
				}else if (ajaxObject.status != 200){
					console.warn('[Ajax request fail] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
					error();
				}
			}
		}
	})($mx);

	/**
	 * mxRender v 0.3.2 Beta
	 */
	if (typeof($mx.render) != 'object'){$mx.render = {};}
	(function($render){
		/**
		 * mxRender info
		 */
		$render.info = {
			author: "moxin",
			email: "maplemx@gmail.com",
			version: "0.3.2 Beta"
		}
		/**
		 * Set Default Configures
		 */
		$render.defaultConfigures = {
			//Auto Start
			autoStart: true,
			//Debug Log
			log: true,
			//Item XML Path
			itemsXmlPath: 'items/default.xml',
			//Auto Load Modules
			loadModules: false,
			modules: [],
			//Auto Load Plug-ins
			loadPlugins: true,
			plugins: [
				'js/jQuery.min.js'
			],
			//Auto Load CSSes
			loadCsses: true,
			csses: [
				'css/default.css'
			],
			//Preload Waiting Timing(ms)
			preloadWaiting: 0,
		};

		/**
		 * Properties
		 */
		$render.itemTemplates = {};
		$render.autoSetIdCounter = 0;
		$render.publicCSS = document.createElement('style');
		$render.addedCSS = [];
		$render.runPreloadOnce = [];
		$render.runCallbackOnce = [];
		$render.data = [];

		/**
		 * Useful Variety & Functions
		 */
		var htmlElement = document.getElementsByTagName('html')[0],
			headElement = document.getElementsByTagName('head')[0],
			log = function(content){
				if ($render.configures.log){console.log(content);}
			},
			mergeObjects = function(firstObject,secondObject){
				var result = {};
				for (var property in firstObject){
					result[property] = firstObject[property];
				}
				for (var property in secondObject){
					result[property] = secondObject[property];
				}
				return result;
			},
			getElementAttributes = function(element){
				var result = {};
				for (var i = 0; i < element.attributes.length;i++){
					result[element.attributes[i].name] = element.attributes[i].value;
				}
				return result;
			},
			getChildNodeByTagName = function(element,nodeTagName){
				for (var i = 0;i < element.childNodes.length;i++){
					if (element.childNodes[i].nodeName == nodeTagName){
						return element.childNodes[i];
					}
				}
				return false;
			},
			replaceWithObject = function(text,object){
				var result = text;
				for (var property in object){
					var reg = new RegExp('\\\{\\\$' + property + '\\\}','gm');
					result = result.replace(reg,object[property]);
				}
				return result;
			},
			getChildNodes = function(element){
				var childNodes = element.childNodes,
					result = {};
				for (var i = 0;i < childNodes.length;i++){
					result[childNodes[i].nodeName] = childNodes[i];
				}
				return result;
			},
			formFunctionString = function(funcString,itemId){
				var result = 'var tempFunction = function(){' +
								'var $data = $mx.render.data["' + itemId + '"],' +
									'$this = $data.$this;' + 
									funcString + 
								'$mx.render.data["' + itemId + '"] = $data;' +
								'};tempFunction();';
				return result;
			},
			transportDataStringToData = function(object,itemId){
				var result = {};
				for (var key in object){
					if (object[key].substr(0,2) == '$='){
						result[key] = eval('(' + object[key].substr(2) + ')');
					}
				}
				return result;
			}

		/**
		 * Activate Configures
		 */
		if (typeof($mxRenderConfigures) == 'undefined'){
			$render.configures = $render.defaultConfigures;
		}else{
			$render.configures = mergeObjects($render.defaultConfigures,$mxRenderConfigures);
		}


		/**
		 * Main
		 */

			/**
			 * Start
			 */
			$render.start = function(){
				$render.preload();
				$mx.traffic.inLine({
					signal: 'mxRender preload done',
					do: function(){
							$render.scanElement(document.body,1);
						},
				});
			}
			
			/**
			 * Preload
			 */
			$render.preload = function(){
				var configures = $render.configures;
				//load XML
				$mx.ajax({
					url: configures.itemsXmlPath,
					dataType: 'XML',
					success: function(result){
						$render.itemTemplates = result;
						//load plug-ins
						if (configures.loadPlugins && configures.plugins.length > 0){
							for (var i = 0;i < configures.plugins.length;i++){
								var pluginLoader = document.createElement('script');
								pluginLoader.setAttribute('src',configures.plugins[i]);
								htmlElement.appendChild(pluginLoader);
							}
						}
						//load modules
						if (configures.loadModules && configures.modules.length > 0){
							for (var i = 0;i < configures.modules.length;i++){
								var moduleLoader = document.createElement('script');
								moduleLoader.setAttribute('src',configures.modules[i]);
								htmlElement.appendChild(moduleLoader);
							}
						}						
						//load css
						if (configures.loadCsses && configures.csses.length > 0){
							for (var i = 0;i < configures.csses.length;i++){
								var cssLoader = document.createElement('link');
								cssLoader.setAttribute('rel','stylesheet');
								cssLoader.setAttribute('href',configures.csses[i]);
								headElement.appendChild(cssLoader);
							}
						}
						//create public CSS area
						$render.publicCSS.setAttribute('type','text/css');
						headElement.appendChild($render.publicCSS);

						//finish preload
						$mx.traffic.flash('mxRender preload done');
					},
					error: function(){
						log('Fail when loading item XML.');
					}
				});
			}

			/**
			 * Render
			 */
			$render.scanElement = function(element,renderMe,callback,debug){
				//if (typeof(debug) == 'undefined'){debug = 1;scanCounter++;}else{debug++;}
				//console.log([scanCounter,debug,element,]);
				if (typeof(renderMe) == 'undefined'){renderMe = false;}
				if (typeof(element) == 'object' && element.hasOwnProperty('nodeName')){
					if (element.nodeName == 'ITEM' && renderMe){
						//console.log([scanCounter,debug,element,]);
						$render.renderItem(element);
					}else{
						for (var i = 0;i < element.childNodes.length;i++){
							$render.scanElement(element.childNodes[i],1,function(){},debug);
						}
					}
				}
			}

			$render.renderItem = function(element){
				//prepare
				if (!element.attributes['name']){
					log([element,'has no attribute "name".']);
					return false;
				}
				var itemName = element.attributes['name'].value;
				if (!element.attributes['id']){
					element.setAttribute('id',itemName + '_' + $render.autoSetIdCounter);
					$render.autoSetIdCounter++;
				}
				var itemId = element.attributes['id'].value;
				if (typeof($render.data[itemId]) != 'object'){$render.data[itemId] = {};}
				$render.data[itemId].$this = element;
				if (!element.attributes['class']){
					element.setAttribute('class',itemName);
				}

				//load template
				var itemTemplate = $render.itemTemplates.getElementsByTagName(itemName)[0];
				if (typeof(itemTemplate) == 'undefined'){
					log([element,'has no template.']);
					return false;
				}
				var itemTemplateChildNodes = getChildNodes(itemTemplate);

				//load data
				var loadData = function(){
					var itemAttributes = getElementAttributes(element);
					if (itemTemplateChildNodes['data']){
						var templateSetData = eval('(' + itemTemplateChildNodes['data'].textContent + ')');
					}else{
						var templateSetData = {};
					}
					if (typeof($render.data[itemId]) == 'object'){
						var renderData = $render.data[itemId];
					}else{
						var renderData = {};
					}
					var tempData = mergeObjects(templateSetData,itemAttributes);
					tempData = mergeObjects(tempData,renderData);
					tempData = mergeObjects(tempData,transportDataStringToData(itemAttributes,itemId));
					$render.data[itemId] = tempData;
					if (typeof($render.data[itemId].data) != 'undefined'){$render.data[itemId] = mergeObjects($render.data[itemId],$render.data[itemId].data);}
					$mx.traffic.flash(itemId + ' load data done');
				}

				//add additional CSS
				var addCss = function(){
					if (itemTemplateChildNodes['css'] && !$render.addedCSS.indexOf(itemName) > -1){
						var addCSS = itemTemplateChildNodes['css'].textContent;
						addCSS = replaceWithObject(itemTemplateChildNodes['css'].textContent,$render.data[itemId]);
						$render.publicCSS.innerHTML += addCSS;
						$render.addedCSS.push(itemName);
					}
					$mx.traffic.flash(itemId + ' add css done');
				}

				//do preload-once
				var doPreloadOnce = function(){
					if (itemTemplateChildNodes['preload-once'] && !$render.runPreloadOnce.indexOf(itemName) > -1){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['preload-once'].textContent,itemId) + '$mx.traffic.flash("' + itemId + ' do preload once done");$mx.render.runPreloadOnce.push("' + itemName + '")';
						setTimeout(tempFunctionString,0);
					}else{
						$mx.traffic.flash(itemId + ' do preload once done');
					}
				}

				//do preload
				var doPreload = function(){
					if (itemTemplateChildNodes['preload']){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['preload'].textContent,itemId) + '$mx.traffic.flash("' + itemId + ' do preload done");';
						setTimeout(tempFunctionString,0);
					}else{
						$mx.traffic.flash(itemId + ' do preload done');
					}
				}

				//render item
				var doRender = function(){
					if (itemTemplateChildNodes['template']){
						var itemReplacementHTML = itemTemplateChildNodes['template'].textContent;
						if (element.innerHTML != null){
							itemReplacementHTML = itemReplacementHTML.replace(/\{\$html\}/gm,element.innerHTML);
						}
						itemReplacementHTML = replaceWithObject(itemReplacementHTML,$render.data[itemId]);
						element.innerHTML = itemReplacementHTML;
					}
					$mx.traffic.flash(itemId + ' do render done');
				}

				//do callback-once
				var doCallbackOnce = function(){
					if (itemTemplateChildNodes['callback-once'] && !$render.runPreloadOnce.indexOf(itemName) > -1){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['callback-once'].textContent,itemId) + '$mx.traffic.flash("' + itemId + ' do callback once done");$mx.render.runCallbackOnce.push("' + itemName + '")';
						setTimeout(tempFunctionString,0);
					}else{
						$mx.traffic.flash(itemId + ' do callback once done');
					}
				}

				//do callback
				var doCallback = function(){
					if (itemTemplateChildNodes['callback']){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['callback'].textContent,itemId);
						setTimeout(tempFunctionString,0);
					}
					$mx.traffic.flash(itemId + ' do callback done');
				}

				$mx.traffic.inLine({
					signal: itemId + ' load data done',
					do: addCss
				});
				$mx.traffic.inLine({
					signal: itemId + ' add css done',
					do: doPreloadOnce
				});
				$mx.traffic.inLine({
					signal: itemId + ' do preload once done',
					do: doPreload
				});
				$mx.traffic.inLine({
					signal: itemId + ' do preload done',
					do: doRender
				});
				$mx.traffic.inLine({
					signal: itemId + ' do render done',
					do: doCallbackOnce
				})
				$mx.traffic.inLine({
					signal: itemId + ' do callback once done',
					do: doCallback
				});
				$mx.traffic.inLine({
					signal: itemId + ' do callback done',
					do: function(){
							$render.scanElement(element,0);
						}						
				});
				loadData();
			}
		/**
		 * Auto Start
		 **/
		if ($render.configures.autoStart){
			$render.start();
		}
	})($mx.render);