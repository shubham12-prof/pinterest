const dotenv = require('dotenv');
dotenv.config();
console.log("MONGODB_URI:", process.env.MONGODB_URI); 
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressSession = require('express-session');
const passport = require('passport');
const { mongooseConnect } = require('./config');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

mongooseConnect().then(() => {
    console.log("Mongoose connected and server starting");

  
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    
    app.use(expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.SECRET_KEY || 'default_secret_key',
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    passport.serializeUser(usersRouter.serializeUser());
    passport.deserializeUser(usersRouter.deserializeUser());


    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

   
    app.use('/', indexRouter);
    app.use('/users', usersRouter);

  
    app.use((req, res, next) => {
        next(createError(404));
    });

    app.use((err, req, res, next) => {
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        res.status(err.status || 500);
        res.render('error');
    });

    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to connect to MongoDB, server not started:", err);
});

module.exports = app;
