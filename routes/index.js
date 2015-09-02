var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Family = mongoose.model('Family');
var Guest = mongoose.model('Guest');
var User = mongoose.model('User');

var passport = require('passport');
var jwt = require('express-jwt');

var auth = jwt({secret: 'GETTHESECRETOUTOFHERE', userProperty: 'payload'});

router.param('family', function(req, res, next, id) {
  var query = Family.findById(id);

  query.exec(function (err, family){
    if (err) { return next(err); }
    if (!family) { return next(new Error('can\'t find Family')); }

    req.family = family;
    return next();
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//AUTH
router.post('/register', auth, function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Veuillez remplir tous les champs'});
  }

  if(req.body.username.length <= 6){
      return res.status(400).json({message: 'Le login doit faire plus de 6 caractères'});
  }

  if(req.body.password.length <= 6){
      return res.status(400).json({message: 'Le password doit faire plus de 6 caractères'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Veuillez remplir tous les champs'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});


//API
router.get('/Families', auth, function(req, res, next) {
  Family.find(function(err, families){
    if(err){ return next(err); }

    res.json(families);
  });
});

router.get('/Families/:family', auth, function(req, res, next) {
	req.family.populate('guests covoitInfo.driver', function(err, family){
		if (err){return next(err);}
  		res.json(family);		
	});
});

router.post('/Families', auth, function(req, res, next) {
  var f = new Family(req.body);
  var u = new User();
  u.username = f.login;
  u.setPassword(req.body.password);
  u.family = f;

  u.save(function (err){
    if(err){ return next(err); }
  });

  f.user = u;

  f.save(function(err, family){
    if(err){ return next(err); }
      res.json(req.body);
  });
});

router.put('/Families/confirm', auth, function(req, res, next) {
  var fam = req.body;
  console.log(fam._id);
  Family.findById(fam._id,function(err, f){
    if(err || !f){ return next(err); }
    f.presence = fam.presence;
    f.email = fam.email;
    f.tel = fam.tel;
    f.fetes = fam.fetes;
    f.recu = true;
    f.login = fam.login;
    f.address = fam.address;
    f.zipCode = fam.zipCode;
    f.city = fam.city;
    f.oldmdp = fam.oldmdp;
    f.modified = new Date();
    f.save(function(err){
      if(err){ return next(err); }
        res.json(f);
    });
  });
});

router.put('/Families/recu', auth, function(req, res, next) {
  var fam = req.body;
  Family.findById(fam._id,function(err, f){
    if(err || !f){ return next(err); }
    f.recu = !f.recu;
    f.modified = new Date();
    f.save(function(err){
      if(err){ return next(err); }
        res.json(f);
    });
  });
});

router.put('/Families/dodo', auth, function(req, res, next) {
  var fam = req.body;
  Family.findById(fam._id,function(err, f){
    if(err || !f){ return next(err); }
    f.dodo = !f.dodo;
    f.modified = new Date();
    f.save(function(err){
      if(err){ return next(err); }
        res.json(f);
    });
  });
});

router.put('/Families/participation', auth, function(req, res, next) {
  var fam = req.body;
  Family.findById(fam._id,function(err, f){
    if(err || !f){ return next(err); }
    f.participation = fam.participation;
    f.modified = new Date();
    f.save(function(err){
      if(err){ return next(err); }
        res.json(f);
    });
  });
});

router.put('/Families/covoiturage', auth, function(req, res, next) {
  var fam = req.body;
  Family.findById(fam._id,function(err, f){
    if(err || !f){ return next(err); }
    f.modified = new Date();
    f.covoit = fam.covoit;
    if (f.covoit){
      f.covoitInfo.rider = fam.covoitInfo.rider;
      if (f.covoitInfo.rider){
        f.covoitInfo.seats = fam.covoitInfo.seats;
        console.log(fam.covoitInfo.driver._id);
        Guest.findById(fam.covoitInfo.driver._id, function(err,g){
            if(err || !f){ return next(err);}
            f.covoitInfo.driver = g;
            f.save(function(err){if(err){ return next(err); }});
          });
      }
      else
        f.covoitInfo.seats = 0;
        f.covoitInfo.driver = null;
    }
    else{
      f.covoitInfo.rider = false;
      f.covoitInfo.driver = null;
      f.covoitInfo.seats = 0;
    }
    f.save(function(err){
      if(err){ return next(err); }
        res.json(f);
    });
  });
});

router.post('/Families/:family/guests', auth, function(req, res, next){
	var g = new Guest(req.body);
	g.family = req.family;

	g.save(function(err, g){
		if(err){return next(err);}

		req.family.guests.push(g);
		req.family.save(function(err, family){
			if (err){return next(err);}
			res.json(g);
		});
	});
});

router.delete('/Guests/:guest/:family', auth, function(req, res, next){
  var guest = req.params.guest;
  var f = req.family;
  
  f.save(function(err){
    if(err){ return next(err); }
    Guest.remove({_id:req.params.guest}, function(err){
          if(err){ return next(err); }

        res.json("L'invité a été supprimé ");
      });
  });
});

module.exports = router;
