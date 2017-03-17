const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());



//generate random 6 alphanumeric string for shortURL
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i = 0; i < 6; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  console.log(text);
  return text;
}
// generateRandomString();

function generateRandomUserID() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i = 0; i < 6; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  console.log(text);
  return text;
}

function generateRandomString() {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",

  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function addUser(email, password) {
  var newUser = generateRandomUserID();
  users[newUser] = {};

  users[newUser].id = newUser;
  users[newUser].email = email;
  users[newUser].password = password;
  console.log(users[newUser]);
  return newUser;
}

function findUserByEmail(email){
  for (var userId in users) {
    user = users[userId];
    if (email === user.email) {
      return user;
    }
  }
  return false;
}
//Return the list of urls compare logged in id with urldatabase user id
function urlsForUser(user_id) {
  let userUrlList = {};
  for ( let item in urlDatabase) {
    if (user_id === urlDatabase[item].userid) {
      userUrlList[item] = {id: item, url: urlDatabase[item.url], userid: user_id};
    }
  }
  return userUrlList;
}


const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    url: "http://www.lighthouselabs.ca",
    user_id: "userRandomID"
  },
  "9sm5xK": {
    id: "9sm5xK",
    url: "http://www.google.com",
    user_id: "user2RandomID"
  }
};

app.get("/", (request, response) => {
  console.log(users);
  console.log(request.cookies.user_id);
  response.end("Hello!");
});

//route handler to pass URL data to my template
app.get("/urls", (request, response) => {
  // let userId = request.cookies.user_id;
  // console.log(userId);
  let templateVars = {
    newUser: request.cookies.user_id,
    urls: urlDatabase
  };
  response.render("urls_index", templateVars);
});

// post the new urls to tiny app
app.get("/urls/new", (request, response) => {
  if (request.cookie.user_id) {
    let templateVars = {
      newUser: request.cookies.user_id
    };
    response.render("/urls_new", templateVars);
  } else {
    response.redirect("/login");
  }
});

app.post("/urls", (request, response) => {
  let longURL = request.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = request.body.longURL;
  response.redirect('http://localhost:8080/urls/' + shortURL);
});

//route to display a single URL and shortened form
//return not found
app.get("/urls/:id", (request, response) => {
  let shortURL = request.params.id;
  let longURL = urlDatabase[shortURL];
  if(!longURL) {
    response.send('Not Found');
    response.end();
    return;
  }
  response.render("urls_show", {
    longURL: longURL,
    shortURL: shortURL,
    username: request.cookies["user_id"]
  });
});

//handles shortURL requests that redirect to longURL
app.get("/u/:shortURL", (request, response) => {
  let shortURL = request.params.shortURL;
  let longURL = urlDatabase[shortURL];
  response.redirect(longURL);
});

app.get('/register', (request, response) => {
  response.render('register');
});

app.post('/register', (request, response) => {
  var newEmailAddress = request.body.email;
  // console.log("found the new user's email address:", newEmailAddress);
    // warn user that this email already in use
    // send them a 400 (because we are rude lazy jerkfaces)
  if (findUserByEmail(newEmailAddress)) {
    response.status(400);
    response.render('error');
  } else {
    // add them to user database
    let newUserId = addUser(request.body.email, request.body.password);
    response.cookie('user_id', newUserId);
    response.redirect('/');
  }
});

//update a long url and redirect to main /urls page
app.post('/urls/:id', (request, response) => {
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect('/urls');
});
//delete a url
app.delete('/urls/:id', (request, response) => {
  if (request.cookie.user_id) {
    let userID = request.cookie.user_id;
    let usersURLs = [];
    for (let item in urlDatabase) {
      if (userID === urlDatabase[item].userid) {
        usersURL.push(urlDatabase[item].url);
    }
  }
  let deleteShortURL = request.params.id;
  if (usersURL.indexOf(deleteShortURL) >= 0) {
    delete urlDatabase[request.params.id];
    response.redirect('/urls');
    return;
    }
  }
  response.redirect(401, '/login');
});


app.get('/login', (request, response) => {
  response.render('login');
});

//set cookie, redirect to '/' page
//set and store cookie
app.post("/login", (request, response) => {
  // if there's no email, or no password, tell the user that they are being silly, smarten up
  //check if thers a user with body email
  let registeredUser = findUserByEmail(request.body.email);
  //check if user has body password
  if (registeredUser && registeredUser.password === request.body.password) {
    //login set cookie and redirect
    response.cookie('user_id', registeredUser.id);
    response.redirect('/');
  } else {
    //if not send 400
    response.status(403);
    response.render('error');
  }
});


app.post('/logout', (request, response) => {
  response.clearCookie('user_id');
  response.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});