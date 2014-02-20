/**
 * mxRender v 0.3.0 Beta
 * An auto render frame
 * Author: Maplemx
 * Email: maplemx@gmail.com
 */
 	if (typeof($mx) != 'object'){var $mx = {};}	

	/**
	 * mx.say.js v 0.2.0 Beta
	 */
	if (typeof($mx.Say) == 'undefined'){$mx.Say = {};};
	(function($mx){
		$mx.Say.words = [];

		$mx.say = function(word,wait){
			if (typeof(wait) != 'number'){wait = 0;}
			if (!$mx.Say.words.indexOf(word) > -1){
				var _say = function(){
					return $mx.Say.words.push(word);
				}
				setTimeout(_say,wait);
				return true;
			}else{
				return false;
			}
		}

		$mx.unsay = function(word){
			var index = $mx.Say.words.indexOf(word);
			if (index > -1){
				$mx.Say.words.splice(index,1);
				return true;
			}else{
				return false;
			}
		}

		$mx.wait = function(word,func,sleepTime){
			if (typeof(sleepTime) == 'undefined'){sleepTime = 30;}
			if ($mx.Say.words.indexOf(word) > -1){
				func();
			}else{
				var _wait = function(){
					return $mx.wait(word,func,sleepTime);
				}
				setTimeout(_wait,sleepTime);
			}
		}
	})($mx);

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
	 * mxRender v 0.3.0 Beta
	 */
	if (typeof($mx.render) != 'object'){$mx.render = {};}
	(function($render){
		/**
		 * Configures
		 */
		$render.configures = {
			//Auto Start
			autoStart: true,
			//Debug Log
			log: true,
			//Item XML Path
			itemsXmlPath:'items/default.xml',
			//Auto Load Plug-ins
			loadPlugins: true,
			plugins: [
				'js/jQuery.min.js'
			],
			//Auto Load CSSes
			loadCsses:true,
			csses: [
				'css/default.css'
			],
			//Preload Waiting Timing(ms)
			preloadWaiting:0
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
			replaceBreakLine = function(text){
				var reg = new RegExp('[\\\n\\\r]+','gm');
				return text.replace(reg,'');
			}

		/**
		 * Main
		 */

			/**
			 * Start
			 */
			$render.start = function(){
				$render.preload();
				$mx.wait(
					'mxRender preload done',
					function(){
						$mx.unsay('mxRender preload done');
						$render.scanElement(document.body);
					}
				)
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
						$mx.say('mxRender preload done',configures.preloadWaiting);
					},
					error: function(){
						log('Fail when loading item XML.');
					}
				});
			}

			/**
			 * Render
			 */
			$render.scanElement = function(element,callback){
				if (typeof(element) == 'object' && element.hasOwnProperty('childNodes')){
					for (var i = 0;i < element.childNodes.length;i++){
						$render.scanElement(element.childNodes[i]);
					}
					if (element.nodeName == 'ITEM' && !element.attributes['mx-rendered']){
						$render.renderItem(element);
					}
				}
				if (typeof(callback) == 'function'){callback();}
			}

			$render.renderItem = function(element){
				//prepare
				delete element.attributes['mx-rendered'];
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
					$render.data[itemId] = tempData;
					$mx.say(itemId + ' load data done');
				}

				//add additional CSS
				var addCss = function(){
					$mx.unsay(itemId + ' load data done');
					if (itemTemplateChildNodes['css'] && !$render.addedCSS.indexOf(itemName) > -1){
						var addCSS = replaceBreakLine(itemTemplateChildNodes['css'].textContent);
						addCSS = replaceWithObject(itemTemplateChildNodes['css'].textContent,$render.data[itemId]);
						$render.publicCSS.innerHTML = addCSS;
						$render.addedCSS.push(itemName);
					}
					$mx.say(itemId + ' add css done');
				}

				//do preload-once
				var doPreloadOnce = function(){
					$mx.unsay(itemId + ' add css done');
					if (itemTemplateChildNodes['preload-once'] && !$render.runPreloadOnce.indexOf(itemName) > -1){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['preload-once'].textContent,itemId) + '$mx.say("' + itemId + ' do preload once done");$mx.render.runPreloadOnce.push("' + itemName + '")';
						setTimeout(tempFunctionString,0);
					}else{
						$mx.say(itemId + ' do preload once done');
					}
				}

				//do preload
				var doPreload = function(){
					$mx.unsay(itemId + ' do preload once done');
					if (itemTemplateChildNodes['preload']){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['preload'].textContent,itemId) + '$mx.say("' + itemId + ' do preload done");';
						setTimeout(tempFunctionString,0);
					}else{
						$mx.say(itemId + ' do preload done');
					}
				}

				//render item
				var doRender = function(){
					$mx.unsay(itemId + ' do preload done');
					if (itemTemplateChildNodes['template']){
						var itemReplacementHTML = replaceBreakLine(itemTemplateChildNodes['template'].textContent);
						if (element.innerHTML != null){
							itemReplacementHTML = itemReplacementHTML.replace(/\{\$html\}/gm,element.innerHTML);
						}
						itemReplacementHTML = replaceWithObject(itemReplacementHTML,$render.data[itemId]);
						element.innerHTML = itemReplacementHTML;
					}
					$mx.say(itemId + ' do render done');
				}

				//do callback-once
				var doCallbackOnce = function(){
					$mx.unsay(itemId + ' do render done');
					if (itemTemplateChildNodes['callback-once'] && !$render.runPreloadOnce.indexOf(itemName) > -1){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['callback-once'].textContent,itemId) + '$mx.say("' + itemId + ' do preload once done");$mx.render.runCallbackOnce.push("' + itemName + '")';
						setTimeout(tempFunctionString,0);
					}else{
						$mx.say(itemId + ' do callback once done');
					}
				}

				//do callback
				var doCallback = function(){
					$mx.unsay(itemId + ' do callback once done');
					if (itemTemplateChildNodes['callback']){
						var tempFunctionString = formFunctionString(itemTemplateChildNodes['callback'].textContent,itemId);
						setTimeout(tempFunctionString,0);
					}
					$mx.say(itemId + ' do callback done');
				}

				loadData();
				$mx.wait(
					itemId + ' load data done',
					addCss
				);
				$mx.wait(
					itemId + ' add css done',
					doPreloadOnce
				);
				$mx.wait(
					itemId + ' do preload once done',
					doPreload
				);
				$mx.wait(
					itemId + ' do preload done',
					doRender
				);
				$mx.wait(
					itemId + ' do render done',
					doCallbackOnce
				);
				$mx.wait(
					itemId + ' do callback once done',
					doCallback
				);
				$mx.wait(
					itemId + ' do callback done',
					function(){
						$mx.unsay(itemId + ' do callback done');
						element.setAttribute('mx-rendered',true);
						$render.scanElement(element);
					}
				);
			}
		/**
		 * Auto Start
		 **/
		if ($render.configures.autoStart){
			$render.start();
		}
	})($mx.render);