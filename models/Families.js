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
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

FamilySchema.methods.delGuest = function(idGuest){
	for (var i = 0, len = this.guests.length; i < len; i++) {
  		console.log("i:" + i + " idGuest:" + idGuest + "this.guest i:" + this.guests[i] );
  		if(idGuest == this.guests[i])
  		{
  			this.guests.splice(i, 1);
  			return this.guests;
  		}
	}
	return("guest not found");
};

mongoose.model('Family', FamilySchema);