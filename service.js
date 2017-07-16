var logger = require ('morgan');
var path = require ('path');
var express = require ('express')
    , session = require ('express-session')
    , bodyparser = require ("body-parser")
    , cookieparser = require ("cookie-parser")
    , flash = require ('connect-flash');
var passport = require ("passport")
    , LocalStrategy = require ("passport-local").Strategy;
var db = require ('./database');

var app = express ();

app.use (logger ('dev'));
app.use (cookieparser ());
app.use (bodyparser.urlencoded ( {extended: false} ));
app.use (bodyparser.json ());
app.use (session ({
  secret: 'donkey kong',
  saveUninitialized: false,
  resave: false
}));

app.use (passport.initialize());
app.use (passport.session ());
app.use (flash ());


// ================================================
// View engine and static files
app.set ('/views', path.join(__dirname, 'views'));
app.set ('view engine', 'pug');
app.use ("/bootstrap", express.static(path.join(__dirname, "/static/bootstrap")));
app.use ("/stylesheets", express.static(path.join(__dirname, "/static/stylesheets")));
app.use ("/img", express.static(path.join(__dirname, "/static/img")));


// ================================================
// Passport
passport.use ('local', new LocalStrategy ((username, password, done) => {
  db.find_user ({'username': username}, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
        return done (null, false, {'error': 'Invalid username or password'} );
    }

    db.verify_password (password, user.hash, res => {
      if (res) {
        return done (null, user);
      }
      return done (null, false, {'error': 'Invalid username or password'} );
    });
  });
}));

passport.serializeUser ((user, done) => {
  done (null, user._id);
});

passport.deserializeUser ((id, done) => {
  db.find_user ({'_id': id}, (err, user) => {
    if (err) { return done (err); }
    return done (null, user);
  });
});


// ================================================
// Routing

app.get ('/', (req, rsp) => {
  rsp.render ('index');
});

app.get ('/login', (req, rsp) => {
  var messages = req.flash('error');
  rsp.render ('user-form', {
    'action': '/login',
    'title' : 'Please login',
    'buttonSubmit': 'Login',
    'messages': messages
  });
});

app.post ('/login',
    passport.authenticate ('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: 'Username or password not valid'
    })
);

app.get ('/register', (req, rsp) => {
  rsp.render ('user-form', {
    'action': '/register',
    'title' : 'Please register',
    'buttonSubmit': 'Register',
    messages: req.flash('error')
  });
});

app.post ('/register', (req, rsp, next) => {
  db.find_user ({'username': req.body.username}, (err, user) => {
    if (err) {
      req.flash ('error', 'Unknown error');
      return rsp.redirect ('/register');
    }

    if (user) {
      req.flash ('error', 'Username already exists');
      return rsp.redirect ('/register');

    }

    const new_user = {
      'username': req.body.username,
      'password': req.body.password,
    }

    db.add_user (new_user, (res, registered_user) => {
      if (res) {
        req.login (registered_user, (err) => {
          if (err) return next (err);
          rsp.redirect ('/');
        });
      }
    });
  });
});


app.get ('/logout', (req, rsp) => {
  req.logout ();
  rsp.redirect ('/');
});

var port = process.env.PORT || 3000;
app.listen (port);
console.log ('Bookshare listening at http://localhost:' + port);
