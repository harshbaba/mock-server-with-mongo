/*Tracker.findById(tracker._id, (err, data)=>{
    if(err){
        res.json({success: false, message: err});
    }else{
        console.log('New Tracker Registered successfully');
        res.json({ success: true, data: data, message: 'New Tracker Registered Successfully' });
    }
}).populate('adminDetails', 'fullName email')
*/ 