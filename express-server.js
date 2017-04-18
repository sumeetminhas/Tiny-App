const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");

// ejs as engine declaration
app.set("view engine", "ejs");
//init middleware
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || "bunny",
  maxAge: 24 * 60 * 60 * 1000
}));

/* TODO
function checkUserLoggedIn(req, res, next) {
  if (req.session.userid) {
    res.locals.userid = req.session.userid;
    next();
  } else {
    res.status(401).send('Not logged in <a href="/login">Login</a>');
  }
}

app.get('/someroute', checkUserLoggedIn, function (req, res) {
  // You no longer have to check if the user is logged in or not
});
*/

//OBJECTS
const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userid: "userRandomID"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userid: "user2RandomID"
  }
};

const userDB = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$GZ3Q6IpblYbiwucBjuTTgu4sraD6twaz9dhiHmWX8fqeqd/0NkU7y",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$BdBP9gCxLkqKeJ0wJVKGkOzJU4WuyVMMiPTwP0abSO66SKjsgjiHe"
  }
}

//FUNCTIONS
//generate random 6 alphanumeric string for shortURL
function generateRandomString() {
var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

app.get("/", (req, res) => {
  if (req.session['userid']) {
    res.redirect('/urls');
  } else {
  res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const userid = req.session['userid'];
  if (userid) {
    let userURL = {};
    // Retrieve only the short and long URLs that belong to the logged in
    for(var shortURL in urlDatabase) {
      if (userid === urlDatabase[shortURL].userid) {
        userURL[shortURL] = urlDatabase[shortURL];
      }
    };
    let templateVars = {
      urls: userURL,
      user: userDB[userid]
      // "req": req
    };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send('Not logged in <a href="/login">Login</a>');
  }
});

app.get("/urls/new", (req, res) => {
  const userid = req.session['userid'];
  if (userid) {
    let templateVars = {
      urls: urlDatabase,
      user: userDB[userid]
      // req: req
    };
    res.render('urls_new', templateVars);
  } else {
    res.status(401).send('Not logged in <a href="/login">Login</a>');
  }
});

app.get("/urls/:id", (req, res) => {
  const userid = req.session['userid'];
  const urlEntry = urlDatabase[req.params.id];
  if (!urlEntry) {
    res.status(404).send('Invalid short URL');
  } else {
    if (userid) {
      // If user is logged in, but short URL was
      // created by another user, then send error message
      if (userid !== urlEntry.userid) {
        res.status(403).send('unauthorized user');
      } else {
        // Logged in user is the one who created the short URL,
        // so render the page
        let templateVars = {
          shortURL: req.params.id,
          userDB: userDB,
          longURL: urlEntry.url,
          user: userDB[userid]
        };
        res.render("urls_show", templateVars);
      }
    } else {
      res.redirect("/login");
    }
  }
});

app.get("/login", (req, res) => {
  if (req.session['userid']) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});

app.get("/logout", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session['userid']) {
    res.redirect("/");
  } else {
    res.render("register");
  }
});

app.get("/u/:shortURL", (req, res) => {
  let urlEntry = urlDatabase[req.params.shortURL];
  if (urlEntry) {
    let longURL = urlEntry.url;
    res.redirect(longURL);
  } else {
    res.status(404).send('Bad short URL');
  }
});


app.post("/urls", (req, res) => {
  if (req.session['userid']) {
    let longURL = (!req.body.longURL.startsWith('http') ? "http://" : "") + req.body.longURL;
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      url: longURL,
      userid: req.session['userid']
    };
    res.redirect('/urls/' + shortURL);
  } else {
    res.status(401).send('Not logged in <a href="/login">Login</a>');
  }
});

app.post("/login", (req, res) => {
  let user = null;
  // Find user with that email
  for (let username in userDB) {
    if (userDB[username]['email'] === req.body.email){
      user = userDB[username];
      break;
    }
  }
  if (user){
    if (bcrypt.compareSync(req.body.password, user.password)){
      req.session['userid'] = user.id
      res.redirect('/urls');
    } else {
      res.status(401).render('401');
    }
  } else {
      res.status(401).render('401');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const urlEntry = urlDatabase[req.params.id];
  if (urlEntry) {
    let userid = req.session['userid'];
    if (userid) {
      if (userid !== urlEntry.userid) {
        res.status(403).send('unauthorized user');
      } else {
        // TODO: Make the optional adding of the http:// prefix a function on its own
        let longURL = (!req.body.longURL.startsWith('http') ? "http://" : "") + req.body.longURL;
        urlEntry.url = longURL;
        res.redirect("/urls/" + req.params.id);
      }
    } else {
      res.status(401).send('Not logged in <a href="/login">Login</a>');
    }
  } else {
    res.status(404).send('invalid short url');
  }
  // if (req.session['userid']){
  //   urlDatabase[req.params.id].url = req.body.longURL;
  //   res.redirect("/urls");
  // } else {
  //   res.redirect("/login");
  // }
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (!password.length || !email.length){
    res.status(400).send('enter valid email/password');
  } else {
    // Make sure that email is not already taken
    for (let user in userDB) {
      if (email === userDB[user]['email']){
        res.status(400).send('email in use');
        return;
      }
    }
    let hashed_password = bcrypt.hashSync(password, 10);
    let id = generateRandomString();
    userDB[id] = {
      id: id,
      email: req.body.email,
      password: hashed_password
    }
    req.session['userid'] = id;
    console.log(`saved new user ${id}`);
    console.log('Entire userDB:');
    console.dir(userDB, {color: true});
    res.redirect('/');
  }
});

app.post('/logout', (req, res) => {
  delete req.session.userid
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});