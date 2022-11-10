const { getMaxListeners } = require('./models/transaction');


// expose the routes to our app with module.exports
module.exports = function(app) {
    
    var port                    = process.env.PORT || 2525; 
    var jwt                     = require('jsonwebtoken'); // used to create, sign, and verify tokens
    const Transactions          = require('./models/transaction'); // get our mongoose model
    const User                  = require('./models/user');
    const Tracker               = require('./models/tracker');
    var cors                    = require('cors');

    //cors request
    // app.use(function(req, res, next) {
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //     next();
    // });

    app.use(cors());

    

    // api ---------------------------------------------------------------------
    
    // basic route
    app.get('/', function(req, res) {
        res.send('Hello! The API is at http://localhost:' + port);
    });

    app.get('/test', function(req, res) {
        res.send('Hello this is a test!');
    });

    //for register a new user
    app.post('/registerUser', function(req, res){
        //console.log(req.body);

        var user = new User({
            fullName                : req.body.fullName,
            email                   : req.body.email,
            password                : req.body.password,
            trackers                : []
        });

        User.findOne({email: req.body.email}, function(userErr, isUser){
            if(isUser){
                res.json({success: false, message: "This emailId has been already taken!"});
            }
            else{
                // save the transaction
                user.save(function(err) {
                    if (err){
                        res.json({success: false, message: err});
                    }
                    else{
                        console.log('New User Registered successfully');
                        res.json({ success: true, message: 'Your account has registered successfully.' });
                    }
                });
            }
        });

    });

    //login user
    app.post('/login', function(req, res){
        console.log(req.body);
        User.findOne({email: req.body.email},(err, user)=>{
            if(user){
                if(user.password == req.body.password){
                    var token = jwt.sign(user, app.get('superSecret'), {
                    expiresInMinutes: 1460*30 // expires in 24 hours * 30 days
                    });
                    res.json({success:true, token: token, fullName:user.fullName, email:user.email, id:user._id});
                }else{
                    res.json({success: false, message: "Password is not correct"});
                }
            }
            else{
                res.json({success: false, message: "Email Id not found"});
            }
        })
    });

    //login user
    app.post('/getTrackersByUserId', function(req, res){
        //need user objectId
        console.log(req.body._id);
        User.findOne({_id: req.body._id}).populate({path:'trackers', populate:[{
            path:'members',
            model:'User',
            select: 'fullName email'
        },
        {
            path:'transactions',
            model:'Transactions',
        }]
        }).exec((err, user)=>{
            if(user){
                res.json({success:true, trackers: user.trackers});
            }
            else{
                res.json({success: false, message: "Object Id not found"});
            }
        })
    });

    //for register a new tracker
    app.post('/addTracker', function(req, res){
        console.log(req.body);
        var tracker = new Tracker({
            trackerName             : req.body.trackerName,
            adminDetails            : req.body._id, //admin objectId
            members                 : [req.body._id]
        }); 

        //save the tracker
        tracker.save(function(err,data) {
            if (err){
                res.json({success: false, message: err});
            }
            else{
                User.findOneAndUpdate(
                    {  _id:req.body._id},
                    { $push: { trackers: tracker._id } }
                ).then(()=>{
                    res.json({ success: true, data: data, message: 'New Tracker Registered Successfully' });
                })
            }
        });
    });

    //for adding a new member in a tracker
    app.post('/addMember', function(req, res){
        //need member emailId
        //need Tracker Object Id
        console.log(req.body.memberEmailId)
        console.log(req.body.trackerId);
        User.findOneAndUpdate(
            {  email: req.body.memberEmailId},
            { $push: { trackers: req.body.trackerId } }
        ).then((user)=>{
            Tracker.findOneAndUpdate(
                {  _id:req.body.trackerId},
                { $push: { members: user._id } }
            ).then((tracker)=>{
                const data = {fullName: user.fullName, _id: user._id, email:user.email}
                res.json({ success: true, data: data, message: 'New Member Added Successfully' });
            })
        })
        /*Tracker.findOneAndUpdate(
            {  _id:req.body.trackerId},
            { $push: { members: req.body.memberId } }
        ).then(()=>{
            User.findOneAndUpdate(
                {  _id:req.body.memberId},
                { $push: { trackers: req.body.trackerId } }
            ).then((user)=>{
                const data = {fullName: user.fullName, _id: user._id, email:user.email}
                res.json({ success: true, data: data, message: 'New Member Added Successfully' });
            })
        })
        */

    });

    //get all trackers
    app.get('/allTrackers', (req, res)=>{
        Tracker.find({})
        .populate('members', 'fullName email')
        .populate('adminDetails', 'fullName email')
        .exec((err, trackers)=>{
            if(err){
                res.json({success: false, message: err});
            }
            else{
                res.json({success: true, data: trackers});
            }
        })
    })

    //for register a new transaction
    app.post('/addTransaction', async function(req, res){
        console.log(req.body);
        var transaction = new Transactions({
            paidBy              : req.body.paidBy, //'633f1d88792d3d1aa3d12d2a',
            amount              : req.body.amount,
            remarks             : req.body.remarks,
            trackerId           : req.body.trackerId,
        }); 

        // save the transaction
        transaction.save(function(err) {
            if (err){
                res.json({success: false, message: err});
            }
            else{
                Tracker.findOneAndUpdate(
                    {  _id:req.body.trackerId},
                    { $push: { transactions: transaction._id } }
                ).then(()=>{
                    console.log('Transaction saved successfully');
                    res.json({ success: true, data:transaction, message: 'Transaction Saved Successfully' });
                })

                
            }
        });

    });

    //for update a transaction
    app.post('/updateTransaction', async function(req, res){
        // save the transaction
        Transactions.findOneAndUpdate(
            {  _id:req.body.transactionId}, req.body, {new:true}
        ).then((data)=>{
            console.log('Transaction saved successfully');
            res.json({ success: true, data:data, message: 'Transaction Update Successfully' });
        })
        

    });
    

     //get all transactions (Super admin Routes)
    app.get('/allTransactions', function(req, res){
        Transactions.find({}).populate('paidBy', 'userName').exec(function (err, transactions){
            if(err){
                res.json({success: false, message: err});
            }
            else{
                res.json({success: true, data: transactions});
            }
        });
        //res.json({success: false, message: ''});
    });

    //delete a transaction
    app.delete('/deleteTransaction', function(req, res) {
        console.log(req.body.transactionId);
        Transactions.deleteOne({ _id: req.body.transactionId })
        .then((transaction)=>{
            res.send('Transaction Deleted Successfully');
        });
    });

    //get all users
    app.get('/allUsers', (req, res)=>{
        User.find({}).populate({path:'trackers', populate:{
                        path:'members',
                        model:'User',
                        select: 'fullName email'
                    }
                    }).exec((err, users)=>{
            if(err){
                res.json({success: false, message: err});
            }
            else{
                res.json({success: true, data: users});
            }
        })
    })

    //delete a user
    app.delete('/deleteUser', function(req, res) {
        console.log('Hi', req.body.userId);
        User.deleteOne({ _id: req.body.userId })
        .then((user)=>{
            res.send('User Deleted Successfully');
        });
        
    });

    //delete tracker
    app.delete('/deleteTracker', function(req, res) {
        console.log(req.body.trackerId);
        Tracker.deleteOne({ _id: req.body.trackerId })
        .then((tracker)=>{
            res.send('Tracker Deleted Successfully');
        });
        
    });

    /*==================(Don't use these urls) Only for development =====*/
    //for update a transaction
    // app.get('/updateTracker', async function(req, res){
    //     Tracker.findOneAndUpdate(
    //         {  _id:'6341c71c98af556aeeb1b469'}, {transactions:[
    //             '6347a795199f124dc3285e58',
    //             '6347a810199f124dc3285e59',
    //             '6347a830199f124dc3285e5a'
    //         ]}, {new:true}
    //     ).then((data)=>{
    //         console.log('Transaction saved successfully');
    //         res.json({ success: true, data:data, message: 'Transaction Update Successfully' });
    //     })
        

    // });

    // app.get('/updateUser', async function(req, res){
    //     User.findOneAndUpdate(
    //         {  _id:'6341af412b2bbb62f4c73a8a'}, {trackers:[
    //             '6341c71c98af556aeeb1b469',
    //             '6347b987ceb38674da3901f7'
    //         ]}, {new:true}
    //     ).then((data)=>{
    //         console.log('Transaction saved successfully');
    //         res.json({ success: true, data:data, message: 'Transaction Update Successfully' });
    //     })
        

    // });
    
};


