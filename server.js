'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true, useUnifiedTopology:true});


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

/////////////////// DB PREPARATION
const urlSchema = new mongoose.Schema({
  url: {type: String, required: true}
});

const URLModel = mongoose.model("URL", urlSchema);

//////////////////// API METHODS
const validateURL_callback = function (req, res, next) {
  const regex = /^(https?:\/\/)?(([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}(\:\d+)?(\/[-a-z\d%_.~+]*)*$/gm;
  const urlChecker = new RegExp(regex);

  if(urlChecker.test(req.body.url)){
    // res.json({"ok": req.body.url})
    next();
  } else {
    res.json({"error":"invalid URL: " + req.body.url});
  }
}

const shortenURL_callback = function (req, res, next) {
  const originalURL = req.body.url;
  let responseObject = null;

  let url = URLModel.findOne({"url": originalURL}, (err, doc) => { 
    if(!err){
      if(!doc){
        console.log("NOT FOUND: " + originalURL);

        URLModel.create({url:originalURL}, (err, doc) => {
          if(!err){
            console.log(doc.id);
            responseObject = {"original_url":originalURL,"short_url":doc.id};
          } else {
            console.log("ERROR INSERTING THE URL: " + err);
            responseObject = {"error":"invalid URL: " + req.body.url};
          }
        });
      } else {
        console.log("FOUND WITH ID " + doc.id);
        responseObject = {"original_url":originalURL,"short_url":doc.id};
      }
    } else {
      console.log("ERROR SEARCHING THE URL: " + err);
    }
  }).then(() => res.json(responseObject));




  // res.json({"ok in next": req.body.url});
  // res.json(responseObject);
}



//////////////////// API ROUTES

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});



app.post("/api/shorturl/new", validateURL_callback, shortenURL_callback);

app.get("/api/shorturl/:shortened_url", function (req, res) {
  // const shortenedUrl = (req.params.shortened_url !== undefined) ? req.params.shortened_url.trim() : "";
  // res.json({"original_url":"www.example.com","short_url":shortenedUrl});
  res.json({"original_url":"www.example.com","short_url":req.params.shortened_url});
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});