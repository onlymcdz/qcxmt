var express = require("express");
var app = express();
var http = require("http");
var wechat = require("wechat");
var _ = require("underscore");
var Bmob = require("bmob").Bmob;
var API = require("wechat-api");
var bunyan=require("bunyan");
var log=bunyan.createLogger({
	name:"myapp",
	streams:[
	{
		level:"debug",
		stream:process.stdout
	},
	{
		level:"info",
		path:"./info.log"
	},
	{
		level:"error",
		path:"./error.log"
	}
	]
});



var sceneNumber=92;
var sceneString="92";
var welcomeString="欢迎收听桑兮兮老师讲课， 17号晚上8点见";
var defaultString="欢迎加入中国微商第一学院";
var teacherId1="oM3U-t7F1ylhvWQZxdFjB2i0ATpM";
var teacherId2="oM3U-t__GCnSQqZ-k6RplU3PZNZc"; //sang
var teacherSendSuccess="发送成功";
var teacherSendFail="不支持的消息类型";
var getInCode="12341";
var checkCode="88881256";
var wechat_config_token="weixin_token";
var wechat_config_appid="wx3e209f89df7fa40f";
var wechat_config_encodingAESKey="Ze2ZnZb2i7rlppqQvwr98M3PmDavWdJKULD8d8aj9Wv";

var APPID="wx790de603d7115d9b";
var SECRETID="1a06db83e64ca57b64278b7436085d5b";

var BMOB_ID="c8d31180da2d160595e5114edc54ec36";
var BMOB_REST="51c74b08082b8dc68c91f2a27f82059f";


var config = {
	token : wechat_config_token,
	appid : wechat_config_appid,
	encodingAESKey : wechat_config_encodingAESKey
};


var api=new API(APPID,SECRETID);
Bmob.initialize(BMOB_ID,BMOB_REST);
app.use(express.static(__dirname + "/"));





var removeId=function(sceneId,openId,callback){
	var Array=Bmob.Object.extend("array");
	var query=new Bmob.Query(Array);
	query.equalTo("scene",sceneId);
	query.first({success:function(object){
		if(!object){
			log.error({openId:openId,sceneId:sceneId},"query 0 list in removeId");
			return;
		}
		object.remove("list",openId);
		object.save(null,{success:function(result){
			log.debug({audienceNumber:result.attributes.list.length,openId:openId},"AudienceNumber after removeId");
			if(callback){
				callback();
			}
		},error:function(error){
			log.error({code:"201",openId:openId},"object saved failed in removeId");
		}});
	},error:function(err){
		log.error({code:"202",openId:openId,sceneId:sceneId},"query failed in removeId")
	}});
}

var addId=function(sceneId,openId,callback){
	var Array=Bmob.Object.extend("array");
	var query=new Bmob.Query(Array);
	query.equalTo("scene",sceneId);
	query.first({success:function(object){
		if(!object){
			log.error({openId:openId,sceneId:sceneId},"query 0 list in addId");
			return;
		}
		object.addUnique("list",openId);
		object.save(null,{success:function(result){
			log.debug({audienceNumber:result.attributes.list.length,openId:openId},"AudienceNumber after addId");
			if(callback){
				callback();
			}
			
		},error:function(error){
			log.error({code:"201",openId:openId},"object saved failed in addId");
			
		}});
	},error:function(err){
		log.error({code:"202",openId:openId,sceneId:sceneId},"query failed in addId")
	}});
}

/*
addId(98,"sunkuo",function(){
	console.log("add success");
});


removeId(98,"sunkuo",function(){
	console.log("remove success");
});
*/


var sendText = function(openId,content,time) {
	api.sendText(openId, content, function(err, result) {
		if (err) {
			log.error({error:err,openId:openId,content:content,time:time},"sendText failed");
		} else {
			log.info({result:result,openId:openId,content:content,time:time},"sendText successfully");
		}
	});
}
//sendText("oGlCBtzmRNaqUCf_DD1prTATJ9WY","ss",0);

var sendImage=function(openId,mediaId,time){

	api.sendImage(openId,mediaId,function(err,result){
		if(err){
			log.error({error:err,openId:openId,mediaId:mediaId,time:time},"sendImage failed");
		}else{
			log.info({result:result,openId:openId,mediaId:mediaId,time:time},"sendImage successfully");
		}
	});
	
	
}

var sendVoice=function(openId,mediaId,time){
	
	api.sendVoice(openId,mediaId,function(err,result){
		if(err){
			log.error({error:err,openId:openId,mediaId:mediaId,time:time},"sendVoice failed");
		}else{
			log.info({result:result,openId:openId,mediaId:mediaId,time:time},"sendVoice successfully");
		}
	});

	
}



app.use("/wechat", wechat(config, function(req, res, next) {
	//console.log(req.weixin);
	var message = req.weixin;
	if(_.isMatch(message,{MsgType:"text",Content:checkCode})){
		console.log("checkout code find "+message.FromUserName);
		res.reply("欢迎你，讲师！");
		log.info({message:message},"checkout code find","checkcode find");
	}else if (_.isMatch(message, {FromUserName : teacherId1})||_.isMatch(message,{FromUserName:teacherId2})){
		if (_.isMatch(message, {MsgType : "text"})){
			var timeDelay=0;
			log.debug({message:message},"teacher send text");
			var Array = Bmob.Object.extend("array");
			var query = new Bmob.Query(Array);
			query.equalTo("scene",sceneNumber);
			query.first({
				
				success : function(object) {
					if(!object){
						log.error("query 0 list in teacher sendtext section");
						return
					}
					var _list = object.attributes.list;
					_.each(_list, function(id) {
						timeDelay=timeDelay+20;
						_.delay(sendText,timeDelay,id,message.Content,null);
						
					});
					res.reply(teacherSendSuccess);
	
				},
				error : function(error) {
					log.error({error:error},"query failed in teacher sendtext section");
					res.reply(teacherSendFail);
				}
			});
		}else if(_.isMatch(message, {MsgType : "image"})){
			var timeDelay=0;
			log.debug({message:message},"teacher send image");
			var Array = Bmob.Object.extend("array");
			var query = new Bmob.Query(Array);
			query.equalTo("scene",sceneNumber);
			query.first({
				success : function(object) {
					if(!object){
						log.error("query 0 list in teacher sendiamge section");
						return
					}
					var _list = object.attributes.list;
					_.each(_list, function(id) {
						timeDelay=timeDelay+40;
						_.delay(sendImage,timeDelay,id,message.MediaId,0);
					});
					res.reply(teacherSendSuccess);
	
				},
				error : function(error) {
					res.reply(teacherSendFail+" baas error");
				}
			});
		}else if(_.isMatch(message, {MsgType : "voice"})){
			var timeDelay=0;
			log.debug({message:message},"teacher send voice");
			var Array = Bmob.Object.extend("array");
			var query = new Bmob.Query(Array);
			query.equalTo("scene",sceneNumber);
			query.first({
				success : function(object) {
					if(!object){
						log.error("query 0 list in teacher sendvoice section");
						return
					}
					var _list = object.attributes.list;
					_.each(_list, function(id) {
						timeDelay=timeDelay+30;
						_.delay(sendVoice,timeDelay,id,message.MediaId,0);
					});
					res.reply(teacherSendSuccess);
	
				},
				error : function(error) {
					res.reply(teacherSendFail+"！baas error");
				}
			});
		}else{
			res.reply(teacherSendFail);
		}
		
	} else if (_.isMatch(message, {MsgType : "event",Event : "SCAN",EventKey : sceneString}) || _.isMatch(message, {MsgType : "event",Event : "subscribe",EventKey : "qrscene_"+sceneString}) || _.isMatch(message, {MsgType : "text",Content : getInCode})) {
		log.debug("someone scan the ercode  "+message.FromUserName);
		var Array = Bmob.Object.extend("array");
		var query = new Bmob.Query(Array);
		query.equalTo("scene",sceneNumber);
		query.first({
			success : function(object) {
				if(!object){
					log.error("query 0 list in student scancode section");
					return
				}
				
				if(object&&object.attributes.list){
					console.log("current people is "+object.attributes.list.length);
				}
				object.addUnique("list", message.FromUserName);
				object.save(null, {
					success : function(object) {
						res.reply(welcomeString);
					},
					error : function(error) {
						log.error("people save failed");
						res.reply("请重新扫描");
					}
				});

			},
			error : function(error) {
				log.error("people list query failed");
				res.reply("请重新扫描");
			}
		});
	} else if(_.isMatch(message,{Event:"unsubscribe"})){
		log.debug("someone unsubscribe");
		var Array = Bmob.Object.extend("array");
		var query = new Bmob.Query(Array);
		query.equalTo("scene",sceneNumber);
		
		query.first({success:function(object){
			if(!object){
				log.error("query 0 list in unsubscribe section");
				return
			}
			
			
			object.remove("list",message.FromUserName);
			object.save(null,{success:function(object){
				res.reply("");
				log.debug({currentPeople:object.attributes.list.length},"unsubscribe user remove success");
				
			},error:function(error){
				log.error({id:message.FromUserName},"fail to remove unsubscribe user");
			}});
		},error:function(error){
			
		}});
	}else {
		log.debug({message:message},'someone '+message.FromUserName);
		res.reply(defaultString);
	}

}));

http.createServer(app).listen(80, function() {
	console.log("listen to port 80");
});

