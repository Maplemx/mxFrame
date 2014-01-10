/***
!!!IMPORTANT: This frame is based on jQuery
***/

/***
Auto Start
***/
$(document).ready(function(){
	$mx.preload();
});

/***
Main
***/
if (typeof($mx) == 'undefined'){var $mx = {};}
(function($mx){
	//$mx.preloadItemContainerId = 'mxFramePreloadItemContainer';
	//$mx.preloadItemHTML = 'mxFrame/items/default.html';
	$mx.preloadItemXML = 'mxFrame/items/default.xml';
	$mx.preloadItemCSS = 'mxFrame/items/default.css';
	$mx.preloadModelJS = 'mxFrame/models/default.js';
	$mx.autoSetIdCounter = 0;
	$mx.logSwitcher = 'ON';
	$mx.itemTemplates = {};
	$mx.item = {};
	$mx.itemAttrs = {};

	$mx.loadXML = function(XMLLocation){
		if (window.XMLHttpRequest){
			var XMLObject = new XMLHttpRequest();
		}else{
			var XMLObject = new ActiveXObject('Microsoft.XMLHTTP');
		}
		XMLObject.open('GET',$mx.preloadItemXML,false);
		XMLObject.send();
		XMLDoc = XMLObject.responseXML;
		return XMLDoc;
	}

	$mx.preload = function(){
		$mx.itemTemplates = $mx.loadXML($mx.preloadItemJSON);
		$('head').append('<link rel = "stylesheet" href = "' + $mx.preloadItemCSS + '" />');
		$('body').after('<script type = "text/javascript" src = "' + $mx.preloadModelJS + '"></script>');
		//$('#' + $mx.preloadItemContainerId).load($mx.preloadItemHTML,function(){
		$mx.renderItems();
		//});
		return;
	}

	$mx.renderItems = function($scanElement){
		if ($scanElement == null){$scanElement = $('body');}
		if (!$scanElement.length > 0){log('Fail to scan an item that not exist.');}
		$scanElement.find('item').each(function(){
			var $item = $(this);
			$mx.renderItem($item);
		});
		return;
	}

	$mx.renderItem = function($item){
		//Information Preparation
		$mx.itemAttrs = $item.attrs();
		var itemName = $mx.itemAttrs['name'],
			itemId = $mx.itemAttrs['id'],
			itemClass = $mx.itemAttrs['class'],
			itemType = $mx.itemAttrs['type'],
			itemHTML = $item.html();

		if (itemName == null){
			log('Fail to render an item without name:');
			log($item);
			return false;
		}
		if (itemId == null){
			itemId = itemName + '_' + $mx.autoSetIdCounter;
			$mx.autoSetIdCounter++;
			$item.attr('id',itemId);
			log('Auto set an item ID as [' + itemId + ']:');
			log($item);
		}
		if (itemClass == null){
			itemClass = itemName + '_default';
			log('Auto set an item Class as [' + itemClass + ']:');
			log($item);
		}else{
			itemClass = itemName + '_' + itemClass;
		}
		$item.attr('class',itemClass);

		//Load Template
		itemTemplate = $mx.itemTemplates.getElementsByTagName(itemName);
		if (!itemTemplate.length > 0){
			log('Fail to render an item that have no template:');
			log($item);
			return false;
		}
		$mx.item = itemTemplate[0];

		//Preload
		var itemTemplatePreload = $mx.item.getElementsByTagName('preload')[0].textContent;
		if (itemTemplatePreload){
			eval(itemTemplatePreload);
		}
		
		//Render
		var itemTemplateHTML = $mx.item.getElementsByTagName('item')[0].textContent;
		if (itemTemplateHTML){
			if (itemHTML != null){
				var itemReplacementHTML = itemTemplateHTML.replace(/\{\$html\}/gm,itemHTML);	
			}else{
				var itemReplacementHTML = itemTemplateHTML;
			}
			for (var attrName in $mx.itemAttrs){
				var reg = new RegExp('\\\{\\\$' + attrName + '\\\}','gm');
				itemReplacementHTML = itemReplacementHTML.replace(reg,$mx.itemAttrs[attrName]);
			}
			$item.html(itemReplacementHTML);
		}else{
			log('[' + itemName + '] have no item HTML template.');
		}
		
		//Callback
		var itemTemplateCallback = $mx.item.getElementsByTagName('callback')[0].textContent;
		if (itemTemplateCallback){
			eval(itemTemplateCallback);	
		}

		$mx.item = {};
		$mx.itemAttrs = {};
		return;
	}
})($mx);

/***
jQuery Plug-in
***/
(function($){
	$.fn.attrs = function(){
		var $tag = $(this),
			tagAttrs = $tag[0].attributes,
			tagAttrsCount = tagAttrs.length,
			tagAttrsResult = {};

		for (var i = 0;i < tagAttrsCount;i++){
			tagAttrsResult[tagAttrs[i].name.toLowerCase()] = tagAttrs[i].value;
		}

		return tagAttrsResult;
	}

	$.fn.render = function(){
		$mx.renderItem($(this));
		return;
	}
})(jQuery)

/***
Log Tools
***/
function log(content){
	if ($mx.logSwitcher == 'ON'){
		if (content != null){
			console.log(content);
		}else{
			console.log('nothing!');
		}
	}
}
