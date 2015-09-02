var express = require('express');
var request = require('request');

var router = express.Router();

var PushBullet = require('pushbullet');
var myAPI = 'Nt1zYidSE3egNH9jVK6M2CP6U6cm63MW';
var pusher = new PushBullet(myAPI);

var passport = require('passport');
var jwt = require('express-jwt');

var auth = jwt({secret: 'GETTHESECRETOUTOFHERE', userProperty: 'payload'});

router.post('/note', function(req, res, next) {
	var note = req.body;

  	pusher.note('ujBfybHhLnosjAuXDo0g56', note.title, note.body, function(error, response) {
  		res.json(response); 
  	});
});

router.get('/devices', function(req, res, next) {
	var options = {
    	limit: 10
	};
  	pusher.devices(options, function(error, response) {
  		res.json(response); 
  	});
});

router.post('/sms', auth,function(req,res,next){
	options = {
		url : 'https://api.pushbullet.com/v2/ephemerals',
		headers: {
	    	"Access-Token": myAPI,
	    	"Content-Type" : "application/json",
	  	},
		body:JSON.stringify({
	  		"type": "push",
    		"push": {
    		    "type": "messaging_extension_reply",
    		    "package_name": "com.pushbullet.android",
    		    "source_user_iden": "ujBfybHhLno",
    		    "target_device_iden": "ujBfybHhLnosjAuXDo0g56",
    		    "conversation_iden": req.body.tel,
    			"message": req.body.message
    		}
    	}),
		method: 'POST'
	};

	request(options, function(error, response, body){
	    if(error) {
	        res.send(error);
	    } else {
	        res.send(response.statusCode, body);
	    }
	});

});

module.exports = router;