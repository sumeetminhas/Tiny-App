const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: [12334],
  maxAge: 24 * 60 * 60 * 60 * 1000
}));


//OBJECTS
const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    url: "http://www.lighthouselabs.ca",
    userid: "u1id",
  },
  "9sm5xK": {
    id: "9sm5xK",
    url: "http://www.google.com",
    userid: "u2id",
  }
};

const users = {
  "u1id": {
    id: "u1id",
    email: "user@example.com",
    password: "u1id",
  },
  "u2id": {
    id: "u2ID",
    email: "user2@example.com",
    password: "u2id"
  },
  "u3id": {
    id: "u3id",
    email: "user3@example.com",
    password: "u3id"
  }
};

//FUNCTIONS
//generate random 6 alphanumeric string for shortURL
function generateRandomString() {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
}


// //create new user with random generated id
// function addUser(email, password) {
//   var newUser = generateRandomString();
//   users[newUser] = {};

//   users[newUser].id = newUser;
//   users[newUser].email = email;
//   users[newUser].password = password;
//   console.log(users[newUser]);
//   return newUser;
// }

// check user password
function getUserPassword(checkEmail, checkPassword) {
  for (var item in users) {
    if (users[item].email === checkEmail && bcrypt.compareSync(checkPassword, users[item].password)) {
      return users[item].id;
    }
  }
  return false;
}

// function findUserByEmail(email){
//   for (var userId in users) {
//     user = users[userId];
//     if (email === user.email) {
//       return user;
//     }
//   }
//   return false;
// }

//Return the list of urls compare logged in id with urldatabase user id
function urlsForUser(user_id) {
  let userUrlList = {};
  for ( let item in urlDatabase) {
    if (user_id === urlDatabase[item].userid) {
      userUrlList[item] = {id: item, url: urlDatabase[item].url, userid: user_id};
    }
  }
  return userUrlList;
}

//ENDPOINTS
// LET GET EM FIRST
app.get("/", (request, response) => {
  if (request.session.user_id) {
    response.redirect('/urls');
  } else {
  response.redirect('/login');
  }
});

app.get('/login', (request, response) => {
  if (request.session.user_id) {
    response.redirect('/');
  } else {
  let templateVars = {
    user: users[request.session.user_id]
  };
  response.render('login', templateVars);
  }
});

app.get('/register', (request, response) => {
  if (request.session.user_id) {
    response.redirect('/');
    return;
  }
  let templateVars = {
    user: users[request.session.user_id]
  };
  response.render('register', templateVars);
});


//route handler to pass URL data to my template
app.get('/urls', (request, response) => {
  if (!request.session.user_id) {
    response.redirect(401, '/');
    return;
  }
  let usersShortUrl = {};
    if ((usersShortUrl = getUsersShortUrl(request.session.user_id))) {
      let templateVars = {
      user: users[request.session.user_id]
    };
    response.statusCode = 200;
    response.render('urls_index', templateVars);
    return;
  } else {
    response.redirect(401, '/login');
  }
});

// post the new urls to tiny app
app.get("/urls/new", (request, response) => {
  if (request.session.user_id) {
    let templateVars = {
      user: users[request.session.user_id]
    };
    response.render('urls_new', templateVars);
  } else {
    response.redirect('/login');
  }
});

//route to display a single URL and shortened form
app.get("/urls/:id", (request, response) => {
  let userUrlList = {};
  if (request.session.user_id) {
  let sessionId = request.session.user_id;
  let checkUrlId = request.params.id;
  if (urlDatabase[checkUrlId]) {
    if (urlDatabase[checkUrlId].user_id === sessionId) {
      let templateVars = {
        shortURL: checkUrlId,
        urls: urlDatabase,
        user: users[request.session.user_id]
      };
      response.render('urls_show', templateVars);
      return;
    } else {
      response.redirect(403, '/urls');
      return;
    }
  } else {
    response.redirect(404, '/urls');
    return;
    }
  }
  response.redirect(401, '/login');
});



//handles shortURL requests that redirect to longURL
app.get("/u/:shortURL", (request, response) => {
  let cookieKey = request.params.shortURL;
  if (urlDatabase[request.params.shortURL]) {
    urlDatabase[request.params.shortURL].views += 1;
    urlDatabase[request.params.shortURL].timeStamp.push(new Date());
    urlDatabase[request.params.shortURL].visitorId.push(generateRandomString());
    urlDatabase[request.params.shortURL].visitorIp.push(request.connection.remoteAddresponses);
    urlDatabase[request.params.shortURL].visitorAgent.push(request.headers['user-agent']);
    // unique view count in cookie
    console.log(urlDatabase);
    if (!request.cookies[cookieKey]) {
      response.cookie(cookiekey, 1);
      urlDatabase[request.params.shortURL].uniqueViews++;
    }
    // let date = new Date();

    let longURL = urlDatabase[request.params.shortURL].url;
    if(longURL){
      response.redirect(longURL);
    } else {
      response.redirect('http://localhost:8080/urls');
    }
  } else{
    response.redirect(404, '/urls');
  }
});


// POST ENDPOINTS
app.post("/urls", (request, response) => {
  if (!request.session.user_id) {
    response.redirect(401, '/login');
    return;
  } if (request.session.user_id) {
    let short = generateRandomString();
  } // remake a new key if it already exists
  while (urlDatabase[short]) {
    short = generateRandomString();
  }
  let userid = request.session.user_id;
  urlDatabase[short] = {
    id: short,
    url: request.body.longUrl,
    userid: userid
  };
  response.redirect('http://localhost:8080/urls/' + short);
  return;
  response.redirect(403, '/login');
});

//update a long url and redirect to main /urls page
app.post('/urls/:id', (request, response) => {
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect('/urls');
});

//delete a url
app.delete('/urls/:id', (request, response) => {
  if (request.session.user_id) {
    let userId = request.session.user_id;
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

app.post('/register', (request, response) => {
      // warn user that this email already in use
    // send them a 400 (because we are rude lazy jerkfaces)
  if (!request.body.email || !request.body.password) {
    response.status(400);
    response.end("Username or Password were blank");
    return;
  }
  const email = request.body.email;
  const password = bcrypt.hashSync(request.body.password, 10);
  for (let list in users) {
    if (users[list]['email'] === email) {
    response.redirect(400, '/register');
    return;
    }
  } let ranId = generateRandomString();
  while (users[ranId]) {
    ranId = generateRandomString();
  }
    // add them to user database
  users[ranId] = {'id': ranId, 'email': email, 'password': password };
  request.session.user_id = ('user_id', ranId);
  response.redirect('/');
});

// app.put('/urls/:id', (request, response) => {
//   if (!requse.params.user_id){
//     response.redirect(401, '/login');
//     return;
//   }
//   urlDatabase[request.params.id].url = request.body['updateURL'];
//   response.redirect('/urls');
// });

//set cookie, redirect to '/' page
//set and store cookie
app.post("/login", (request, response) => {
  // if there's no email, or no password, tell the user that they are being silly, smarten up

  //check if thers a user with body email
  let email = request.body.email;
  let password = request.body.password;
  let id = getUserPassword(email, password);
  if (id) {
    request.session.user_id = id;
    response.redirect('/');
    return;
  }
    //if not send 400
    response.status(401);
    response.end('Error. Username or Password don\'t match');
  });


app.post('/logout', (request, response) => {
  request.session = null;
  response.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});