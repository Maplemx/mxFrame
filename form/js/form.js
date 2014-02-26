var _app = {
	//头部配置
	header:{
		//LOGO配置
		logo:{
			text1: "Event",
			text2: "Manager",			
		},
		//导航条配置
		nav:{
			list:[
				{
					do: "eventsList",
					text: "全部事件列表",
				},
				{
					do: "workSheet",
					text: "开发任务列表",
				}
			],
			do:{
				eventsList: function(){
					console.log('eventsList');
				},
				workSheet: function(){
					console.log('workSheet');
				}
			}
		},
	},	
};