angular.module('JL', ['ui.router', 'ngAnimate', 'ngNotify', 'ngSanitize', 'n3-pie-chart', 'internationalPhoneNumber'])

.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){
		$stateProvider
			.state('home',{
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				onEnter: ['$state', 'auth', function($state, auth){
			    	if(!auth.isAdmin()){
			     		$state.go('welcome');
			    	}
			  	}],
				resolve: {
					famPromise : ['families', function(families){
						return families.getAll();
					}]
				}
			})
			.state('login', {
			  url: '/login',
			  templateUrl: '/login.html',
			  controller: 'AuthCtrl',
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isAdmin()){
			      $state.go('home');
			    }
			    if(auth.isLoggedIn()){
			      $state.go('welcome');
			    }
			  }]
			})
			.state('welcome', {
			  url: '/welcome',
			  templateUrl: '/welcome.html',
			  controller: 'WelcomeCtrl',
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
			      $state.go('welcome');
			    }
			  }]
			})
			.state('family', {
			  url: '/family',
			  templateUrl: '/families.html',
			  controller: 'FamiliesCtrl',
			  resolve: {
			  	family: ['families', 'auth', function(families, auth){
			  		return families.get(auth.currentFamily());
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
			})		
			.state('families', {
			  url: '/families/{id}',
			  templateUrl: '/families.html',
			  controller: 'FamiliesCtrl',
			  resolve: {
			  	family: ['$stateParams', 'families', function($stateParams, families){
			  		return families.get($stateParams.id);
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
 		});
	};

	o.switchRecu = function (family){
		return $http.put('/Families/recu', family,{			
 			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};


	o.sms = function (family){
		return $http.post('https://api.pushbullet.com/v2/ephemerals', 
		{
			"type": "push",
    		"push": {
    		    "type": "messaging_extension_reply",
    		    "package_name": "com.pushbullet.android",
    		    "source_user_iden": "ujBfybHhLno",
    		    "target_device_iden": "ujBfybHhLnosjAuXDo0g56",
    		    "conversation_iden": family.tel,
    			"message": "[J&L] Hello " + family.login + "!"
    		}
		},
		{			
 			headers: {Authorization: 'Bearer '+ 'Nt1zYidSE3egNH9jVK6M2CP6U6cm63MW'},

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
      $state.go('welcome');
    });
  };

  $scope.logIn = function(){
  	$scope.user.username = $scope.user.username.toLowerCase();
    auth.logIn($scope.user).error(function(error){
      	ngNotify.set(error.message, {position:'top',type: 'error',theme: 'pitchy'});
    }).then(function(){
		if(auth.isAdmin()){
		  $state.go('home');
		}
      $state.go('welcome');
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
}])

.controller('WelcomeCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
}])

.controller('MainCtrl', [
	'$scope',
	'families',
	'auth',
	'ngNotify',
	'$timeout',
	function($scope, families, auth, ngNotify, $timeout){
		$scope.test = "We are getting Married!!! \\o/";
		$scope.families = families.families;
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.isAdmin = auth.isAdmin;
		$scope.ffDeMars = $scope.families;

		var loadChart = function(){
			$timeout(function(){
				var recu = 0;
				var present = 0;
				var pasRep = 0;
				var brunch = 0;
				var mairie = 0;
				var soiree = 0;
				var invites = 0;
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
					}
					if ($scope.ffDeMars[i].recu)
						recu += 1;
					if ($scope.ffDeMars[i].recu && !$scope.ffDeMars[i].presence)
						pasRep += 1;
				}
				$scope.present = present;
				$scope.invites = invites;
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
		}

		$scope.testSMS = function(family){
			families.sms(family).success(function(data, status){
				console.log(data);
				console.log(status);
				ngNotify.set(data, {position:'top',type: 'success',theme: 'pitchy', sticky: true});
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

.controller('FamiliesCtrl',[
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
			if($scope.family.presence !== true && $scope.family.presence !== false) { 
				ngNotify.set("Ce cas ne devrait pas arriver. Contecter l'administrateur du site.", {position:'top', type: 'error', theme: 'pitchy'});
				return; 
			}
			if($scope.family.presence === true && ($scope.family.email === "" || $scope.family.tel === "")) {
				ngNotify.set("Nous avons besoin d'une adresse email et d'un numéro de téléphone.", {position:'top', type: 'error', theme: 'pitchy'});
				return;
			}
			if($scope.family.presence === true 
				&& $scope.family.fetes.mairie === false && $scope.family.fetes.soiree === false 
					&& $scope.family.fetes.brunch === false ){
				ngNotify.set("Venez vous: - A la maire? a la soiree? au brunch?", {position:'top', type: 'error', theme: 'pitchy'});
				return;
			}
			if($scope.family.presence === true 
				&& $scope.family.guests.length <= 0){
				ngNotify.set("Veuillez ajouter un invité à 'combien serez vous?'", {position:'top', type: 'error', theme: 'pitchy'});
				return;
			}


			families.confirmation($scope.family).success(function(data, status){
				$location.path( "/confirmed" );
			}).error(function(data, status){
				console.log(status);
				console.log(data);
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