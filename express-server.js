const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

//generate random 6 alphanumeric string for shortURL
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 6; i++ ){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
   };
   console.log(text);
   return text;
};
generateRandomString();

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (request, response) => {
  response.end("Hello!");
});
//response can contain html code
app.get("/hello", (request, response) => {
  response.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (request, response) => {
  response.json(urlDatabase);
});

//route handler to pass URL data to my template
app.get("/urls", (request, response) => {
  let templateVars = {
   urls: urlDatabase
 };
  response.render("urls_index", templateVars);
});


app.get("/urls/new", (request, response) => {
  response.render("urls_new");
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
    shortURL: shortURL
  });
});

//handles shortURL requests that redirect to longURL
app.get("/u/:shortURL", (request, response) => {
  let shortURL = request.params.shortURL;
  let longURL = urlDatabase[shortURL];
  response.redirect(longURL);
});

//update a long url and redirect to main /urls page
app.post('/urls/:id', (request, response) => {
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect('/urls');
});
//delete a url
app.post('/urls/:id/delete', (request, response) =>{
  delete urlDatabase[request.params.id];
  response.redirect('/urls');
});

//set cookie, redirect to '/' page
//set and store cookie
app.post("/login", (request, response) => {
  let username = request.body.username;
  response.cookie('username', username);
  response.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});