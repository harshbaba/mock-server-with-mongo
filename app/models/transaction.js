// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Transactions', new Schema({ 
    paidBy          : {type: 'ObjectId', ref:'User'},
    amount          : Number,
    remarks         : String,
    trackerId       : String,
    createdAt       : Date | String,
    updatedAt       : Date | String
}));