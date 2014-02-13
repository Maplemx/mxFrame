/**
 * mxRender v 0.2 Beta
 * Author: moxin
 * Email: maplemx@gmail.com
 */
 	if (typeof($mx) != 'object'){var $mx = {};}else{
 		console.info('$mx object exist, if you\'re not using other plugins write by maplemx, there\'ll may have some compatible problems!');
 	}
 	if (typeof($mx.render) != 'object'){$mx.render = {};}
 	if (typeof($mx.render.configures) != 'object'){$mx.render.configures = {};}
	
 	/**
 	 * Configure
	 */
	//Auto Start
	$mx.render.configures.autoStart = true;

	//Console Information For Debugging
	$mx.render.configures.log = false;

	//Item XML Path
	$mx.render.configures.itemsXmlPath = 'items/default.xml';

	//Auto Load Plug-ins
	$mx.render.configures.loadPlugins = true;
	$mx.render.configures.plugins = [
		'js/jQuery.min.js',
	];

	//Auto Load CSSes
	$mx.render.configures.loadCsses = true;
	$mx.render.configures.csses = [
		'css/default.css',
	];

	/**
	 * Main
	 */
	(function($mx){
		$mx.logCounter = 0;
		$mx.autoSetIdCounter = 0;
		$mx.renderedElementCount = 0;
		$mx.itemTemplates = {};
		$mx.publicCSS = document.createElement('style');
		$mx.addedCSS = [];
		$mx.runPreloadOnce = [];
		$mx.runCallbackOnce = [];
		$mx.nowElement = {};
		$mx.tempData = [];

		$mx.autoStart = function(){
			$mx.preload(function(){
				$mx.scanElement(document.body);
			});			
			return;
		}

		$mx.ajax = function(ajaxParams){
			var type = ajaxParams.type,
				url = ajaxParams.url,
				data = ajaxParams.data,
				dataType = ajaxParams.dataType,
				success = ajaxParams.success,
				error = ajaxParams.error;

			if (typeof(type) == 'undefined'){type = 'get';}type = type.toLowerCase();
			if (typeof(dataType) != 'undefined'){dataType = dataType.toLowerCase();}
			if (url == null){log('Try to do an ajax request without url.');return false;}

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
					log('[Ajax request fail] url:' + url +'; readyState:' + ajaxObject.readyState + '; status:' + ajaxObject.status);
					error();
				}
			}
		}

		$mx.preload = function(callback){
			var confs = $mx.configures;
			//load XML
			$mx.ajax({
				url: confs.itemsXmlPath,
				dataType: 'XML',
				success: function(result){
					$mx.itemTemplates = result;
					//Auto Load Plug-ins
					if (confs.loadPlugins && confs.plugins.length > 0){
						for (var i = 0;i < confs.plugins.length;i++){
							var pluginLoader = document.createElement('script');
							pluginLoader.setAttribute('src',confs.plugins[i]);
							document.getElementsByTagName('html')[0].appendChild(pluginLoader);
						}
					}

					//load CSS
					if (confs.loadCsses && confs.csses.length > 0){
						for (var i = 0;i < confs.csses.length;i++){
							var cssLoader = document.createElement('link');
							cssLoader.setAttribute('rel','stylesheet');
							cssLoader.setAttribute('href',confs.csses[i]);
							document.getElementsByTagName('head')[0].appendChild(cssLoader);
						}
					}

					//create public CSS area
					$mx.publicCSS.setAttribute('type','text/css');
					document.getElementsByTagName('head')[0].appendChild($mx.publicCSS);

					setTimeout(callback,0);
				}
			});
		}

		$mx.renderItem = function(renderedElement){
			//preparation
			$mx.nowElement = renderedElement;
			$mx.renderedElementCount++;
			var renderedElementCount = $mx.renderedElementCount;
			$mx.tempData[renderedElementCount] = {};
			$mx.tempData[renderedElementCount].api = null;
			$mx.tempData[renderedElementCount].set = null;
			$mx.tempData[renderedElementCount].now = renderedElement;
			var itemAttributes = getElementAttributes(renderedElement),
				itemTemplateName = itemAttributes['name'],
				itemId = itemAttributes['id'],
				itemClass = itemAttributes['class'];
			if (!itemTemplateName){
				log([$mx.nowElement,'has no attribute "name".']);
				return false;
			}
			if (!itemId){
				$mx.nowElement.setAttribute('id',itemTemplateName + '_' + $mx.autoSetIdCounter);
				$mx.autoSetIdCounter++;
			}
			if (!itemClass){
				$mx.nowElement.setAttribute('class',itemTemplateName);
			}

			//load template
			var itemTemplate = $mx.itemTemplates.getElementsByTagName(itemTemplateName)[0];
			if (typeof(itemTemplate) == 'undefined'){
				log([renderedElement,'has no template.'],2);
				return false;
			}

			var itemTemplateChildNodes = getElementChildNodes(itemTemplate);

			//add additional CSS
			if (typeof(itemTemplateChildNodes['css']) != 'undefined' && !isInArray(itemTemplateName,$mx.addedCSS)){
				$mx.publicCSS.innerHTML += itemTemplateChildNodes['css'].textContent;
				$mx.addedCSS.push(itemTemplateName);
			}

			//render item when loading
			if (typeof(itemTemplateChildNodes['loading']) != 'undefined'){
				if (renderedElement.innerHTML != null){
					var itemReplacementHTML = itemTemplateChildNodes['loading'].textContent.replace(/\{\$html\}/gm,renderedElement.innerHTML);
				}else{
					var itemReplacementHTML = itemTemplateChildNodes['loading'].textContent
				}
				for (var attributeName in itemAttributes){
					var reg = new RegExp('\\\{\\\$' + attributeName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,itemAttributes[attributeName]);
				}
				renderedElement.innerHTML = itemReplacementHTML;
			}

			//do render
			$mx.loadData(itemTemplateChildNodes['data'],renderedElementCount,function(){
				$mx.doPreload(itemTemplateName,itemTemplateChildNodes['preload-once'],itemTemplateChildNodes['preload'],renderedElementCount,
					function(){
					$mx.doRender(renderedElement,itemTemplateChildNodes['template'],renderedElementCount,function(){
						$mx.doCallback(itemTemplateName,itemTemplateChildNodes['callback-once'],itemTemplateChildNodes['callback'],renderedElementCount,function(){
							$mx.tempData[renderedElementCount] = null;
							renderedElement.setAttribute('mx-rendered','true');
							$mx.scanElement(renderedElement);
						})
					});
				});
			});
		}

		$mx.loadData = function(data,renderedElementCount,callback){
			//load data
			if (typeof(data) != 'undefined'){
				var itemDataChildNodes = getElementChildNodes(data);
				if (typeof(itemDataChildNodes['api']) != 'undefined'){
					$mx.tempData.status = 'pending';
					var apiType = getElementAttributeByName(itemDataChildNodes['api'],'type');
					$mx.ajax({
						url: itemDataChildNodes['api'].textContent,
						type: apiType,
						success: function(result){
							$mx.tempData[renderedElementCount].api = result;
							if (typeof(itemDataChildNodes['set']) != 'undefined'){
								$mx.tempData[renderedElementCount].set = eval('(' + itemDataChildNodes['set'].textContent + ')');
							}
							setTimeout(callback,0);
						},
						error: function(){
							//render item when fail
							if (typeof(itemTemplateChildNodes['fail']) != 'undefined'){
								if (renderedElement.innerHTML != null){
									var itemReplacementHTML = itemTemplateChildNodes['fail'].textContent.replace(/\{\$html\}/gm,renderedElement.innerHTML);
								}else{
									var itemReplacementHTML = itemTemplateChildNodes['fail'].textContent
								}
								for (var attributeName in itemAttributes){
									var reg = new RegExp('\\\{\\\$' + attributeName + '\\\}','gm');
									itemReplacementHTML = itemReplacementHTML.replace(reg,itemAttributes[attributeName]);
								}
								renderedElement.innerHTML = itemReplacementHTML;
							}
						}
					});
				}else if (typeof(itemDataChildNodes['set']) != 'undefined'){
					$mx.tempData[renderedElementCount].set = eval('(' + itemDataChildNodes['set'].textContent + ')');
					setTimeout(callback,0);
				}else{
					setTimeout(callback,0);
				}
			}else{
				setTimeout(callback,0);
			}
		}

		$mx.doPreload = function(itemTemplateName,preloadOnce,preload,renderedElementCount,callback){
			//run preload-once JS
			if (typeof(preloadOnce) != 'undefined' && !isInArray(itemTemplateName,$mx.runPreloadOnce)){
				var preloadOnceFunctionString = $mx.formTempFunctionString(preloadOnce.textContent,renderedElementCount);
				log(preloadOnceFunctionString);
				setTimeout(preloadOnceFunctionString,0);
				$mx.runPreloadOnce.push(itemTemplateName);
			}

			//run preload JS
			if (typeof(preload) != 'undefined'){
				var preloadFunctionString = $mx.formTempFunctionString(preload.textContent,renderedElementCount);
				setTimeout(preloadFunctionString,0);
			}
			setTimeout(callback,0);
		}

		$mx._doPreload = function(itemTemplateName,preloadOnce,preload,renderedElementCount,callback){
			return function(){
				$mx.doPreload(itemTemplateName,preloadOnce,preload,renderedElementCount,callback);
			}
		}

		$mx.doRender = function(renderedElement,template,renderedElementCount,callback){
			//render item when finish data loading
			if (typeof(template) != 'undefined'){
				if (renderedElement.innerHTML != null){
					var itemReplacementHTML = template.textContent.replace(/\{\$html\}/gm,renderedElement.innerHTML);
				}else{
					var itemReplacementHTML = template.textContent;
				}
				itemAttributes = getNowElementAttributes();
				for (var attributeName in itemAttributes){
					var reg = new RegExp('\\\{\\\$' + attributeName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,itemAttributes[attributeName]);
				}
				for (var dataName in $mx.tempData[renderedElementCount].api){
					var reg = new RegExp('\\\{\\\$api\\\.' + dataName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,$mx.tempData[renderedElementCount].api[dataName]);					
				}
				for (var dataName in $mx.tempData[renderedElementCount].set){
					var reg = new RegExp('\\\{\\\$set\\\.' + dataName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,$mx.tempData[renderedElementCount].set[dataName]);	
				}
				renderedElement.innerHTML = itemReplacementHTML;
			}
			setTimeout(callback,0);
		}

		$mx.doCallback = function(itemTemplateName,callbackOnce,callback,renderedElementCount,finish){
			//run callback-once JS
			if (typeof(callbackOnce) != 'undefined' && !isInArray(itemTemplateName,$mx.runCallbackOnce)){
				var callbackOnceFunctionString = $mx.formTempFunctionString(callbackOnce.textContent,renderedElementCount);
				setTimeout(callbackOnceFunctionString,0);
				$mx.runCallbackOnce.push(itemTemplateName);
			}

			//run callback JS
			if (typeof(callback) != 'undefined'){
				var callbackFunctionString = $mx.formTempFunctionString(callback.textContent,renderedElementCount);
				setTimeout(callbackFunctionString,0);
			}
			setTimeout(finish,0);
		}

		$mx.formTempFunctionString = function(functionString,renderedElementCount){
			var tempFunctionString =
				'var tempFunction = function(){' +
					'var $dataCode = ' + renderedElementCount + ',' +
						'$api = $mx.render.tempData[$dataCode].api,' +
						'$set = $mx.render.tempData[$dataCode].set,' +
						'$this = $mx.render.tempData[$dataCode].now;' +
					functionString +
					'$mx.render.tempData[$dataCode].api = $api;' +
					'$mx.render.tempData[$dataCode].set = $set;' +
				'};' +
				'tempFunction();';
			log(tempFunctionString);
			return tempFunctionString;
		}

		$mx.scanElement = function(scanedElement,callback){
			//log(scanedElement);
			if (typeof(scanedElement) == 'object' && scanedElement.hasOwnProperty('childNodes')){
				for (var i = 0;i < scanedElement.childNodes.length;i++){
					$mx.scanElement(scanedElement.childNodes[i]);
				}
				if (scanedElement.nodeName == 'MXITEM' && !scanedElement.attributes['mx-rendered']){
					$mx.renderItem(scanedElement);
				}
			}
			if(typeof(callback) == 'function'){callback();}
		}
	})($mx.render);

	/**
	 * Auto Start
	 */
	if ($mx.render.configures.autoStart){
		$mx.render.autoStart();
	}

	/**
	 * Useful Functions
	 */
	function log(content,type){
		if ($mx.render.configures.log){
			switch(type){
				case 0:
				default:
					console.log(['[' + $mx.render.logCounter + ']', content]);
					break;
				case 1:
					console.info(['[' + $mx.render.logCounter + ']' , content]);
					break;
				case 2:
					console.warn(['[' + $mx.render.logCounter + ']' , content]);
					break;
				case 3:
					console.error(['[' + $mx.render.logCounter + ']' , content]);
					break;
				case '+':
					$mx.render.logCounter++;
					console.log(['[' + $mx.render.logCounter + ']' , content]);
					break;
			}
		}
		return;
	}

	function isInArray(item,container){
		for (var i = 0;i < container.length;i++){
			if (item == container[i]){
				return true;
			}
		}
		return false;
	}

	function getElementAttributeByName(element,attributesName){
		if(element.attributes[attributesName]){
			return element.attributes[attributesName].value;
		}else{
			return false;
		}
	}

	function getElementAttributes(element){
		var elementAttrs = element.attributes,
			elementAttrsResult = {};

		for(var i = 0;i < elementAttrs.length;i++){
			elementAttrsResult[elementAttrs[i].name] = elementAttrs[i].value;
		}

		return elementAttrsResult;
	}

	function getElementChildNodes(element){
		var elementChildNodes = element.childNodes,
			elementChildNodesResult = {};

		for (var i = 0;i < elementChildNodes.length;i++){
			 elementChildNodesResult[elementChildNodes[i].nodeName] = elementChildNodes[i];
		}

		return elementChildNodesResult;
	}

	function getNowElementAttributeByName(attributesName){
		return getElementAttributeByName($mx.render.nowElement,attributesName);
	}

	function getNowElementAttributes(){
		return getElementAttributes($mx.render.nowElement);
	}

	function getFirstElementFromChildNodesByTagName(element,targetNodeName){
		if (typeof(element) == 'undefined'){return false;}
		for (var i = 0;i < element.childNodes.length;i++){
			if (element.childNodes[i].nodeName == targetNodeName){
				return element.childNodes[i];
			}
		}
		return;
	}