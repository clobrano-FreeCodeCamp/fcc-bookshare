const https = require ('https');

// get ISBN for a given book: by author, by title, by general search
// Make a generic search and get all the ISBNs
var host = 'https://openlibrary.org/'
//var command = 'search.json?q='

// https://openlibrary.org/api/books?bibkeys=ISBN:9780980200447&jscmd=data&format=json

var ISBN = 0761545697;
var ISBN2 = 9780761545699;

search_by_isbn (ISBN);
search_by_isbn (ISBN2);

function search_by_isbn (isbn) {
  var command = 'api/books?bibkeys=ISBN:' + isbn + '&jscmd=data&format=json';
  var search = host + command;
  console.log (search);

  https.get (search, res => {
    var chunk = '';
    res.on ('data', data => {
      chunk += data;
    });

    res.on ('end', res => {
      var json = JSON.parse (chunk);
      var book = json ['ISBN:' + isbn];

      if (!book) {
        console.log ('No data for ' + isbn);
        return;
      }

      console.log (isbn);
      console.log (book.title);
      console.log ('auth:  ' + book.authors[0].name);
      console.log ('publ:  ' + book.publishers[0].name);
      if (book.cover)
        console.log ('covr:  ' + book.cover.medium);
      console.log ('isbn:  ' + isbn);
    });
  });
}

//search_by_title ('the+lord+of+the+ring');
function search_by_title (title) {
  var command = 'search.json?title='
  var search = host + command + title;

  https.get (search, res => {
    var chunk = '';

    res.on ('data', data => {
      chunk += data;
    });

    res.on ('end', res => {
      var json = JSON.parse (chunk);
      for (var d in json.docs) {
        var doc = json.docs[d];
        console.log (d + ' - Title: ' + doc.title);
        console.log ('  Author: ' + doc.author_name);
        console.log ('  ISBN: ' + doc.isbn);
        if (doc.publisher && doc.publisher.length)

          for (var p in doc.publisher) {
            if (doc.publish_date)
              console.log ('    Edition ' + doc.publisher[p] + ' ' + doc.publish_date[p]);
            else
              console.log ('    Edition ' + doc.publisher[p]);
          }
      }

    });
  }).on ('error', res => {
    console.log ('error ' + res);
  });
}
