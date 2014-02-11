/**
 * mxRender v 0.2 Beta
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
	$mx.render.configures.log = true;

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
		$mx.autoSetIdCounter = 0;
		$mx.itemTemplates = {};
		$mx.publicCSS = document.createElement('style');
		$mx.addedCSS = [];
		$mx.runPreloadOnce = [];
		$mx.runCallbackOnce = [];
		$mx.nowElement = {};
		$mx.tempData = {};
		$mx.tempData.api = [];
		$mx.tempData.set = {};
		$mx.tempData.status = 'norequest';//norequest|pending|ready|fail

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

					callback();
				}
			});
		}

		$mx.renderItem = function(renderedElement){
			//preparation
			$mx.nowElement = renderedElement;
			$mx.tempData.status = 'norequest';
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

			//load data
			if (typeof(itemTemplateChildNodes['data']) != 'undefined'){
				var itemDataChildNodes = getElementChildNodes(itemTemplateChildNodes['data']);
				if (typeof(itemDataChildNodes['api']) != 'undefined'){
					$mx.tempData.status = 'pending';
					var apiType = getElementAttributeByName(itemDataChildNodes['api'],'type');
					$mx.ajax({
						url: itemDataChildNodes['api'].textContent,
						type: apiType,
						success: function(result){
							$mx.tempData.api = result;
							$mx.tempData.status = 'ready';
						},
						error: function(){
							$mx.tempData.status = 'fail';
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
				}
				if (typeof(itemDataChildNodes['set']) != 'undefined'){
					$mx.tempData.set = itemDataChildNodes['set'].textContent;
					$mx.tempData.status = 'ready';
				}
			}else{
				$mx.tempData.status = 'ready';
			}

			//run preload-once JS & preload JS
			$mx.preloadJS(itemTemplateName,itemTemplateChildNodes['preload-once'],itemTemplateChildNodes['preload']);

			//render item when finish data loading
			if (typeof(itemTemplateChildNodes['template']) != 'undefined'){
				if (renderedElement.innerHTML != null){
					var itemReplacementHTML = itemTemplateChildNodes['template'].textContent.replace(/\{\$html\}/gm,renderedElement.innerHTML);
				}else{
					var itemReplacementHTML = itemTemplateChildNodes['template'].textContent
				}
				for (var attributeName in itemAttributes){
					var reg = new RegExp('\\\{\\\$' + attributeName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,itemAttributes[attributeName]);
				}
				for (var dataName in $mx.tempData.api){
					var reg = new RegExp('\\\{\\\$api\\\.' + dataName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,$mx.tempData.api[dataName]);					
				}
				for (var dataName in $mx.tempData.set){
					var reg = new RegExp('\\\{\\\$set\\\.' + dataName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,$mx.tempData.set[dataName]);	
				}
				renderedElement.innerHTML = itemReplacementHTML;
			}

			//run callback-once JS
			if (typeof(callbackOnce) != 'undefined' && !isInArray(itemTemplateName,$mx.runCallbackOnce)){
				var callbackOnceFunctionString = 'var callbackOnceFunction = function(){var $api = $mx.tempData.api,$set = $mx.tempData.set;';
				callbackOnceFunctionString += callbackOnce.textContent + '};callbackOnceFunction();';
				eval(callbackOnceFunctionString);
				$mx.runCallbackOnce.push(itemTemplateName);
			}

			//run callback JS
			if (typeof(callback) != 'undefined'){
				var callbackFunctionString = 'var callbackFunction = function(){var $api = $mx.tempData.api,$set = $mx.tempData.set;';
				callbackFunctionString += callback.textContent + '};callbackFunction();';
				eval(callbackFunctionString);
			}

			renderedElement.setAttribute('mx-rendered','true');
			$mx.scanElement(renderedElement);
		}

		$mx.scanElement = function(scanedElement){
			//log(scanedElement);
			if (typeof(scanedElement) == 'object' && scanedElement.hasOwnProperty('childNodes')){
				for (var i = 0;i < scanedElement.childNodes.length;i++){
					$mx.scanElement(scanedElement.childNodes[i]);
				}
				if (scanedElement.nodeName == 'MXITEM' && !scanedElement.attributes['mx-rendered']){
					$mx.renderItem(scanedElement);
				}
			}
		}

		$mx.preloadJS = function(itemTemplateName,preloadOnce,preload){
			if ($mx.tempData.status == 'ready'){
				//run preload-once JS
				if (typeof(preloadOnce) != 'undefined' && !isInArray(itemTemplateName,$mx.runPreloadOnce)){
					var preloadOnceFunctionString = 'var preloadOnceFunction = function(){var $api = $mx.tempData.api,$set = $mx.tempData.set;';
					preloadOnceFunctionString += preloadOnce.textContent + '};preloadOnceFunction();';
					eval(preloadOnceFunctionString);
					$mx.runPreloadOnce.push(itemTemplateName);
				}

				//run preload JS
				if (typeof(preload) != 'undefined'){
					var preloadFunctionString = 'var preloadFunction = function(){var $api = $mx.tempData.api,$set = $mx.tempData.set;';
					preloadFunctionString += preload.textContent + '};preloadFunction();';
					eval(preloadFunctionString);
				}
			}else if ($mx.tempData.status == 'pending'){
				setTimeout(300,'$mx.preloadJS(itemTemplateName,preloadOnce,preload)');
			}
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
					console.log(content);
					break;
				case 1:
					console.info(content);
					break;
				case 2:
					console.warn(content);
					break;
				case 3:
					console.error(content);
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