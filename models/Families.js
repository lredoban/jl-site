var mongoose = require('mongoose');

var FamilySchema = new mongoose.Schema({
  login: String,
  address: String,
  zipCode: String,
  city: String,
  modified: { type: Date, default: Date.now },
  email: String,
  presence: { type: Boolean, default: false },
  tel: String,
  recu:{ type: Boolean, default: false },
  fetes:{mairie:{ type: Boolean, default: false }, soiree:{ type: Boolean, default: false }, brunch:{ type: Boolean, default: false }},
  dodo:{ type: Boolean, default: false },
  covoit:{ type: Boolean, default: true },
  covoitInfo:{rider:{ type: Boolean, default: false }, seats: {type: Number, default: 0}, driver:{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }},
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  oldmdp:{type: Number, default: 0},
  participation:{cook: {type: String, quantity: Number}, drink: {type: String, quantity: Number}, bring: {type: String, quantity: Number}}
});

FamilySchema.methods.delGuest = function(idGuest){
	for (var i = 0, len = this.guests.length; i < len; i++) {
  		console.log("i:" + i + " idGuest:" + idGuest + "this.guest i:" + this.guests[i] );
  		if(idGuest === this.guests[i])
  		{
  			this.guests.splice(i, 1);
  			return this.guests;
  		}
	}
	return("guest not found");
};

mongoose.model('Family', FamilySchema);