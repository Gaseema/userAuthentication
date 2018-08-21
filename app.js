var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var flash = require('connect-flash')
var User = require("./models/user.js");


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');

// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({
    secret: 'mySecretKey',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // use connect-flash for flash messages stored in session

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));


//Set up default mongoose connection
var configDb = require('./database.js');
mongoose.connect(configDb.url);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

require('./config/passport')(passport); // pass passport for configuration

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


//Handle Requests
app.get('/', function (req, res) {
    res.json('index');
});
app.get('/login', function (req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login', {
        message: req.flash('loginMessage')
    });
});
app.get('/signup', function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup', {
        message: req.flash('signupMessage')
    });
});
app.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile', {
        user: req.user
    });
});
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

//Facebook Routes
app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['public_profile', 'email']
}));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

//Google Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
}

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

// process the login form
app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
