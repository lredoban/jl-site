var mongoose = require('mongoose');

var ParticipationSchema = new mongoose.Schema({
    categorie: String,
    name: String,
    number: {type: Number, default: 0},
    limit: {type: Number, default: 10},
    enable: { type: Boolean, default: true },
});

var SettingSchema = new mongoose.Schema({
  name: String,
  data: [ParticipationSchema],
});

mongoose.model('Settings', SettingSchema);