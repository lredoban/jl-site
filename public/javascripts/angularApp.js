angular.module('JL', ['ui.router', 'ngAnimate', 'ngNotify', 'ngSanitize', 'n3-pie-chart', 'internationalPhoneNumber'])

.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){
		$stateProvider
			.state('home',{
				url: '/home',
				templateUrl: '/home.html',
				controller: 'HomeCtrl',
				onEnter: ['$state', 'auth', function($state, auth){
			  	}],
			  	resolve: {
			  		family: ['families', 'auth', function(families, auth){
			  			return families.get(auth.currentFamily());
			  	}]
			  }
			})
			.state('login', {
			  url: '/login',
			  templateUrl: '/login.html',
			  controller: 'AuthCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isLoggedIn()){
			      $state.go('home');
			    }
			  }]
			})
			.state('video', {
			  url: '/video',
			  templateUrl: '/video.html',
			  controller: 'VideoCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(!auth.isLoggedIn()){
			      $state.go('login');
			    }
			  }]
			})
			.state('register', {
			  url: '/register',
			  templateUrl: '/register.html',
			  controller: 'AuthCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isLoggedIn()){
			      $state.go('video');
			    }
			  }]
			})
			.state('family', {
			  url: '/family',
			  templateUrl: '/family.html',
			  controller: 'FamilyCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			  }],
			  resolve: {
			  	family: ['families', 'auth', function(families, auth){
			  		return families.get(auth.currentFamily());
			  	}]
			  }
			})		
			.state('familyId', {
			  url: '/family/{id}',
			  templateUrl: '/family.html',
			  controller: 'FamilyCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			  }],
			  resolve: {
			  	family: ['$stateParams', 'families', function($stateParams, families){
			  		return families.get($stateParams.id);
			  	}]
			  }
			})		
			.state('families', {
			  url: '/families',
			  templateUrl: '/families.html',
			  controller: 'FamiliesCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
				if(!auth.isAdmin()){
			      $state.go('home');
			    }
			  }],
			  resolve: {
			  	famPromise : ['families', function(families){
			  		return families.getAll();
			  	}]
			  }
			})
			.state('confirmed', {
			  url: '/confirmed',
			  templateUrl: '/confirmed.html',
			  controller: 'ConfirmedCtrl',
			  resolve: {
			  	family: ['families', 'auth', function(families, auth){
			  		return families.get(auth.currentFamily());
			  	}]
			  }
			});
		$urlRouterProvider.otherwise('login');
	}
])

.factory('auth', ['$http', '$window', function($http, $window){
   	var auth = {};
	auth.saveToken = function (token){
	  $window.localStorage['jl-token'] = token;
	};
	
	auth.getToken = function (){
  		return $window.localStorage['jl-token'];
	}
	auth.isLoggedIn = function(){
  		var token = auth.getToken();

		if(token){
		  var payload = JSON.parse($window.atob(token.split('.')[1]));

		  return payload.exp > Date.now() / 1000;
		} else {
		  return false;
		}
	};

	auth.isAdmin = function(){
		if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));
	
	    return payload.admin;
	  }
	};

	auth.currentUser = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));
	
	    return payload.username;
	  }
	};

	auth.currentFamily = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));
	
	    return payload.family;
	  }
	};

	auth.register = function(user){
	  return $http.post('/register', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logOut = function(){
	  $window.localStorage.removeItem('jl-token');
	};

 	return auth;
}])

.factory("pushbullet", ['$http', 'auth', function($http, auth){
	var p = {};

	p.sendSms = function (tel, message){

		var body = {
			'tel': tel,
			'message': message
		};
		return $http.post('/PushBullet/sms', body,{
  			headers: {Authorization: 'Bearer '+auth.getToken()}
  		});
	};

	return p;
}])

.factory("families", [ '$http', 'auth', function($http, auth){
	var o = {
	  families: []
	};

	o.getAll = function(){
		return $http.get('/Families', {
  			headers: {Authorization: 'Bearer '+auth.getToken()}
  		}).success(function(data){
			angular.copy(data, o.families);
		});
	};

	o.create = function(family) {
  		return $http.post('/Families', family,{
  			headers: {Authorization: 'Bearer '+auth.getToken()}
  		}).success(function(data){
    		o.families.push(data);
  		});
	};

	o.get = function(id) {
	  return $http.get('/Families/' + id, {
  			headers: {Authorization: 'Bearer '+auth.getToken()}
  		}).then(function(res){
	    return res.data;
	  });
	};

	o.addGuest = function(id, guest) {
 		return $http.post('/Families/' + id + '/guests', guest, {
 			headers: {Authorization: 'Bearer '+auth.getToken()}
 		});
	};

	o.removeGuest = function(id, family){
		return $http.delete('/Guests/' + id +'/'+ family,{
 			headers: {Authorization: 'Bearer '+auth.getToken()}
 		}); 
	};

	o.confirmation = function(family){
		return $http.put('/Families/confirm', family, {
 			headers: {Authorization: 'Bearer '+auth.getToken()}
 		})
	};

	o.switchRecu = function (family){
		return $http.put('/Families/recu', family,{			
 			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};	

	o.switchDodo = function (family){
		return $http.put('/Families/dodo', family,{			
 			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	o.covoiturage = function (family){
		return $http.put('/Families/covoiturage', family, {
 			headers: {Authorization: 'Bearer '+auth.getToken()}
 		});
	};

	o.participation = function (family){
		return $http.put('/Families/participation', family, {
 			headers: {Authorization: 'Bearer '+auth.getToken()}
 		});
	};

	return o;
}])

.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
'ngNotify',
function($scope, $state, auth, ngNotify){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      	ngNotify.set(error.message, {position:'top',type: 'error',theme: 'pitchy'});
    }).then(function(){
      $state.go('video');
    });
  };

  $scope.logIn = function(){
  	$scope.user.username = $scope.user.username.toLowerCase();
    auth.logIn($scope.user).error(function(error){
      	ngNotify.set(error.message, {position:'top',type: 'error',theme: 'pitchy'});
    }).then(function(){
      $state.go('home');
    });
  };
}])

.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
  $scope.isAdmin = auth.isAdmin;
}])

.controller('VideoCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
}])

.controller('HomeCtrl', [
	'$scope',
	'families',
	'family',
	'auth',
	'ngNotify',
	'$location',
	'$anchorScroll',
	function($scope, families, family, auth, ngNotify, $location, $anchorScroll){
		$scope.family = family;
		$scope.participation = family.participation;
		$scope.liste = [
			{categorie:"cook", name:"Sablés au parmesan"},
			{categorie:"cook", name:"Verrines saumon fumé et mascarpone citronné"},
			{categorie:"cook", name:"Verrines de melon, mozzarella, jambon cru"},
			{categorie:"cook", name:"Gâteaux, cakes"},
			{categorie:"cook", name:"J'ai une recette perso qui va épater tout le monde"},
			{categorie:"drink", name:"Mojito - L'incontournable"},
			{categorie:"drink", name:"Sangria blanche - L'exquise"},
			{categorie:"drink", name:"Sangria rouge - La chaleureuse"},
			{categorie:"drink", name:"Spritz - Le cocktail le plus coté du Canal Saint Martin"},
			{categorie:"drink", name:"Autre cocktail (ex: punch à Jaquet) ou softs"},
			{categorie:"bring", name:"Légumes, Fruits"},
			{categorie:"bring", name:"Oléagineux (Amandes, noisettes,noix) "},
			{categorie:"bring", name:"Chips à l'ancienne, cacahuètes"},
		];

		if (!family.hasOwnProperty('covoit')){
			family.covoit = true;
		}

		$scope.scrollTo = function(id) {
    		$location.hash(id);
    		$anchorScroll();
		}

		$scope.switchDodo = function(family){
			families.switchDodo({_id:family._id}).success(function(data, status){
					family.dodo = data.dodo;
					ngNotify.set('Vos changements ont bien été pris en compte',
						 {position:'top',type: 'success',theme: 'pitchy', sticky: false, duration: 1400});
				}).error(function(err){
					ngNotify.set(err, {
						position:'top',
						type: 'error',
						sticky:true,
    					theme: 'pitchy',
    					html: true
					});
				});
		}

		$scope.covoiturage = function(family){
			families.covoiturage($scope.family).success(function(data, status){
				ngNotify.set('Vos changements ont bien été pris en compte ' + data.login,
						 {position:'top',type: 'success',theme: 'pitchy', sticky: false, duration: 1400});
			}).error(function(err){
				ngNotify.set('Il y a eu un problème: ' + err, {
						position:'top',
						type: 'error',
						sticky:true,
    					theme: 'pitchy',
    					html: true
					});
			});
		}

		$scope.validParticipation = function(family){
			if (family.participation.length <= 0){
				ngNotify.set('Sélectionnez une participation <i class="fa fa-cart-plus green"></i> avant de valider', {
						position:'top',
						type: 'error',
						duration: 1400,
    					theme: 'pitchy',
    					html: true
					});
				return;
			}
			families.participation($scope.family).success(function(data, status){
				ngNotify.set('Vos changements ont bien été pris en compte ' + data.login,
						 {position:'top',type: 'success',theme: 'pitchy', sticky: false, duration: 1400});
			}).error(function(err){
				ngNotify.set('Il y a eu un problème: ' + err, {
						position:'top',
						type: 'error',
						sticky:true,
    					theme: 'pitchy',
    					html: true
					});
			});
		}
		$scope.addPart = function(item){
			item = angular.copy(item)
			console.log(item);
			for (var i = $scope.family.participation.length - 1; i >= 0; i--) {
				if ($scope.family.participation[i].name == item.name)
					return;
			};
			$scope.family.participation.push(item);
			console.log($scope.family.participation);
		}

		$scope.removePart = function(index){
			$scope.family.participation.splice(index,1);
			console.log($scope.family.participation);
		}
	}])

.controller('FamiliesCtrl', [
	'$scope',
	'families',
	'pushbullet',
	'auth',
	'ngNotify',
	'$timeout',
	'$interpolate',
	function($scope, families, pushbullet, auth, ngNotify, $timeout, $interpolate){
		$scope.test = "We are getting Married!!! \\o/";
		$scope.families = families.families;
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.isAdmin = auth.isAdmin;
		$scope.ffDeMars = $scope.families;
		$scope.liste = [
			{categorie:"cook", name:"Sablés au parmesan", number:0, limit:10},
			{categorie:"cook", name:"Verrines saumon fumé et mascarpone citronné", number:0, limit:10},
			{categorie:"cook", name:"Verrines de melon, mozzarella, jambon cru", number:0, limit:10},
			{categorie:"cook", name:"Gâteaux, cakes", number:0, limit:10},
			{categorie:"cook", name:"J'ai une recette perso qui va épater tout le monde", number:0, limit:10},
			{categorie:"drink", name:"Mojito - L'incontournable", number:0, limit:10},
			{categorie:"drink", name:"Sangria blanche - L'exquise", number:0, limit:8},
			{categorie:"drink", name:"Sangria rouge - La chaleureuse", number:0, limit:8},
			{categorie:"drink", name:"Spritz - Le cocktail le plus coté du Canal Saint Martin", number:0, limit:6},
			{categorie:"drink", name:"Autre cocktail (ex: punch à Jaquet) ou softs", number:0, limit:5},
			{categorie:"bring", name:"Légumes, Fruits", number:0, limit:100},
			{categorie:"bring", name:"Oléagineux (Amandes, noisettes,noix) ", number:0, limit:100},
			{categorie:"bring", name:"Chips à l'ancienne, cacahuètes", number:0, limit:100},
		];

		var loadChart = function(){
			$timeout(function(){
				var recu = 0;
				var present = 0;
				var pasRep = 0;
				var brunch = 0;
				var mairie = 0;
				var soiree = 0;
				var invites = 0;
				var dodo = 0;
				var covoit = 0;
				var seats = 0;
				var car = 0;

				for (var i = 0; i < $scope.ffDeMars.length; i++)
				{
					if ($scope.ffDeMars[i].presence === true)
					{
						present += 1;
						invites += $scope.ffDeMars[i].guests.length;
						if ($scope.ffDeMars[i].fetes.mairie)
							mairie += 1;
						if ($scope.ffDeMars[i].fetes.brunch)
							brunch += 1;
						if ($scope.ffDeMars[i].fetes.soiree)
							soiree += 1;
						if ($scope.ffDeMars[i].dodo)
							dodo += $scope.ffDeMars[i].guests.length;
						if ($scope.ffDeMars[i].covoit){
							covoit += $scope.ffDeMars[i].guests.length;
							if ($scope.ffDeMars[i].covoitInfo.rider){
								seats += $scope.ffDeMars[i].covoitInfo.seats;
								car += 1;
							}
						}
						if ($scope.ffDeMars[i].participation.length > 0){
							for (var l = $scope.ffDeMars[i].participation.length - 1; l >= 0; l--) {
								for (var j = $scope.liste.length - 1; j >= 0; j--) {
									if ($scope.liste[j].name == $scope.ffDeMars[i].participation[l].name)
										$scope.liste[j].number ++;
								};
							};
						}
					}
					if ($scope.ffDeMars[i].recu)
						recu += 1;
					if ($scope.ffDeMars[i].recu && !$scope.ffDeMars[i].presence)
						pasRep += 1;
				}
				$scope.present = present;
				$scope.invites = invites;
				$scope.dodo = dodo;
				$scope.covoit = covoit;
				$scope.seats = seats;
				$scope.car = car;
				if ($scope.ffDeMars.length <= 0)
					pasRep = 0;
				else
					pasRep = pasRep * 100 / recu;
				if (present <= 0){
					mairie, soiree, brunch = 0;
				}
				else{
					mairie = mairie * 100 / present;
					soiree = soiree * 100 / present;
					brunch = brunch * 100 / present;
				}
				if ($scope.ffDeMars.length <= 0)
				{
					recu, present = 0, 0;
				}
				else{
					recu = recu * 100 / $scope.ffDeMars.length;
					present = present * 100 / $scope.ffDeMars.length;
				}
				$scope.pieOptions = {thickness: 5, mode: "gauge", total: 100};
				$scope.pieChart =  [
  					{label: "Présent", value: Math.round(present), suffix: "%", color: "#005f2f"}
				];
				$scope.pieOptions2 = {thickness: 5, mode: "gauge", total: 100};
				$scope.pieChart2 =  [
  					{label: "Reçu", value: Math.round(recu), suffix: "%", color: "#0e3a5d"}
				];
				$scope.pieOptions3 = {thickness: 5, mode: "gauge", total: 100};
				$scope.pieChart3 =  [
  					{label: "Pas Répondu", value: Math.round(pasRep), suffix: "%", color: "#8c0000"}
				];
				$scope.mairieOptions = {thickness: 5, mode: "gauge", total: 100};
				$scope.mairieChart =  [
  					{label: "Mairie", value: Math.round(mairie), suffix: "%", color: "black"}
				];
				$scope.soireeOptions = {thickness: 5, mode: "gauge", total: 100};
				$scope.soireeChart =  [
  					{label: "Soirée", value: Math.round(soiree), suffix: "%", color: "black"}
				];
				$scope.brunchOptions = {thickness: 5, mode: "gauge", total: 100};
				$scope.brunchChart =  [
  					{label: "Brunch", value: Math.round(brunch), suffix: "%", color: "black"}
				];
			}, 250);
		}

		loadChart();

		$scope.loadChart = loadChart;

		$scope.switchRecu = function(family){
			families.switchRecu({_id:family._id}).success(function(data, status){
					family.recu = data.recu;
					loadChart();
				}).error(function(err){
					ngNotify.set(err, {
						position:'top',
						type: 'error',
						sticky:true,
    					theme: 'pitchy',
    					html: true
					});
				});
		};

		$scope.confirm = function(family){
			families.confirmation(family).success(function(data, status){
				ngNotify.set('Changements effectué: ' + data, {position:'top',type: 'success',theme: 'pitchy'});
			}).error(function(err){
				ngNotify.set(err, {
					position:'top',
					type: 'error',
					sticky:true,
    				theme: 'pitchy',
    				html: true
				});
			});

		};

		$scope.sendSms = function(family, message){
			pushbullet.sendSms(family.tel, message).success(function(data, status){
				ngNotify.set('Sms envoyé: ' + data, {position:'top',type: 'success',theme: 'pitchy'});
			}).error(function(err){
				ngNotify.set(err, {
					position:'top',
					type: 'error',
					sticky:true,
    				theme: 'pitchy',
    				html: true
				});
			});
		}

		$scope.bulkSendSms = function(message, test){
			var template = $interpolate(message);
			var fams = $scope.ffDeMars;
			if (test)
				n = 0;
			else
				n = fams.length - 1;
			for (var i = n; i >= 0; i--) {
				if (typeof fams[i].tel != 'undefined' && fams[i].tel.length == 10 && (fams[i].tel.slice(0,2) == '17' || fams[i].tel.slice(0,2) == '07' || fams[i].tel.slice(0,2) == '06' )){
					if (!test){
						console.log(template({f:fams[i]}));
						$scope.sendSms(fams[i],template({f:fams[i]}));
					}
					else
						$scope.messageSmsLauncherTest = template({f:fams[i]});
				}
			};
		}

		$scope.addFamily = function(){
			if(!$scope.login || $scope.login === "" || 
					!$scope.address || $scope.address === "" || 
					!$scope.zipCode || $scope.zipCode === "" ||
					!$scope.password || $scope.password === "" || 
					!$scope.city || $scope.city === "") 
				return;
		  	families.create({
		  		login: $scope.login,
		  		address: $scope.address,
		  		city: $scope.city,
		  		zipCode: $scope.zipCode,
		  		password: $scope.password,
		  	})
		  	$scope.login = '';
		  	$scope.address = '';
		  	$scope.city = '';
		  	$scope.zipCode = '';
		  	$scope.password = '';
		};
}])

.controller('FamilyCtrl',[
	'$scope',
	'families',
	'family',
	'auth',
	'$location',
	'ngNotify',
	function($scope, families, family, auth, $location, ngNotify){

		$scope.family = family;
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.isAdmin = auth.isAdmin;
		
		$scope.removeGuest = function(guest, index){
			families.removeGuest(guest._id, family._id).success(function(data){
				ngNotify.set(data, {position:'top',type: 'success',theme: 'pitchy'});
				$scope.family.guests.splice(index,1);
			}).error(function(err){
				ngNotify.set(err, {
					position:'top',
					type: 'error',
					sticky:true,
    				theme: 'pitchy',
    				html: true
				});
			});
		};

		$scope.addGuest = function(){
		  if($scope.firstName === "") { return; }
		  families.addGuest(family._id, {
		  	firstName: $scope.firstName,
		    lastName: $scope.lastName
		  }).success(function(data){
		  		$scope.family.guests.push(data);
		 		$scope.firstName = '';
		  		$scope.lastName = '';
		  });
		};

		$scope.confirm = function(){
			families.confirmation($scope.family).success(function(data, status){
				ngNotify.set('Changements effectué: ' + data, {position:'top',type: 'success',theme: 'pitchy'});
			}).error(function(err){
				ngNotify.set(err, {
					position:'top',
					type: 'error',
					sticky:true,
    				theme: 'pitchy',
    				html: true
				});
			});

		};

}])
.controller('ConfirmedCtrl',[
	'$scope',
	'families',
	'family',
	'auth',
	'$location',
	function($scope, families, family, auth, $location){

		$scope.family = family;
		$scope.isLoggedIn = auth.isLoggedIn;

}]);