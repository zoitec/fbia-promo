'use strict';

const Hapi = require('hapi');

let FbiaRssBuilder = require('./lib/fbia-rss-builder');

const server = new Hapi.Server();
server.connection({ port: 5000 });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        var fs = require('fs');
        var payload = JSON.parse(fs.readFileSync('./testData.json', 'utf8'));
        var fbiaRssBuilder = new FbiaRssBuilder(payload);


        reply(fbiaRssBuilder.getFeed()).header('Content-Type',' text/xml');
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

// index.js
/*
var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});*/