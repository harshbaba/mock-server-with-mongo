// expose the routes to our app with module.exports
module.exports = function(app) {
    
    var port                    = process.env.PORT || 2525; // used to create, sign, and verify tokens

    //cors request
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // api ---------------------------------------------------------------------
    
    // basic route
    app.get('/', function(req, res) {
        res.send('Hello! The API is at http://localhost:' + port);
    });

    
};
