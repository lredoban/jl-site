var mongoose = require('mongoose');

var GuestSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  family: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' }
});

mongoose.model('Guest', GuestSchema);