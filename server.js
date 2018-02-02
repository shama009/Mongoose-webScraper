var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;
// Initialize Express
var app = express();
// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));
// Database configuration
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes
// Route for getting all Articles from the db
app.get("/", function (req, res) {
  // Grab every document in the first 20 Articles collection
  db.Article.find({}).limit(20)
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      console.log(dbArticle);
      res.render("allArticles", {article: dbArticle});
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// A GET route for scraping the nytimes website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.nytimes.com/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("h2").children("a")
        .text();
      result.link = $(this)
      .children("h2").children("a")
        .attr("href");
        result.summary = $(this)
        .children("p.summary").text();

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          //console.log(dbArticle);
          //res.redirect("/");
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
   // res.send("Scrape Complete");
   res.redirect("/");
   
  });
});


//update saved article in db
app.post("/api/article/update", function (req, res) {

  // need to use JSON.parse here to get the string of "false" or "true" and make it boolean false or true
  // var isSaved = (JSON.parse(req.body.isSaved));
  var isSaved = req.body.isSaved;
  db.Article.findByIdAndUpdate(req.body.id, {
    $set: {
      "isSaved": isSaved
    }
  }, { new: true })
    .then(function (data) {
      //res.redirect("/");
      console.log("updated");
      console.log(data);
      res.json(data);
    }).catch(function (err) {
      res.json(err);
    });
});

// Route for getting all Saved Articles from the db
app.get("/savedArticles", function (req, res) {
  // Grab every document in the first 20 Articles collection
  db.Article.find({ isSaved: true })
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// delete articles by id
app.post("/api/articles/delete", function (req, res) {
  console.log(req.body.id);
  db.Article.findByIdAndRemove(req.body.id).then(function (data) {
    res.redirect("/");
  }).catch(function (err) {
    res.json(err);
  });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});