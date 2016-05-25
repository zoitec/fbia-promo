'use strict';

const Hapi = require('hapi');
const request = require('request');
const async = require('async');

const server = new Hapi.Server();
server.connection({ port: 5000 });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        /*var fs = require('fs');
        var payload = JSON.parse(fs.readFileSync('./testData2vid.json', 'utf8'));
        var config = {
            'noVideos': request.params.noVideos|| 0,
            'embedVideos': request.params.embedVideos || 1,
            'removeRelateds': request.params.removeRelateds || 1,
            'preferredVideo': 'ios_1240',
            'videoCDN': 'http://ht3.cdn.turner.com/cnn/big',
            'preferredImage': 'exlarge16to9',
            'galleryPreferredImage': 'exlarge16:9',
            'inStoryImage': 'mediumplus16to9',
            'imageCDN': 'http://i2.cdn.turner.com/cnnnext/dam/assets',
            'contentHost': 'http://www.cnn.com'
        }

        var fbiaRssBuilder = new FbiaRssBuilder(payload, config);


        reply(fbiaRssBuilder.getFeed()).header('Content-Type',' text/xml');*/
        /*var config = {
            'noVideos': request.params.noVideos|| 0,
            'embedVideos': request.params.embedVideos || 1,
            'removeRelateds': request.params.removeRelateds || 1,
            'preferredVideo': 'ios_1240',
            'videoCDN': 'http://ht3.cdn.turner.com/cnn/big',
            'preferredImage': 'exlarge16to9',
            'galleryPreferredImage': 'exlarge16:9',
            'inStoryImage': 'mediumplus16to9',
            'imageCDN': 'http://i2.cdn.turner.com/cnnnext/dam/assets',
            'contentHost': 'http://www.cnn.com'
        }*/

        function generateFbiaFeed(url) {
            let FbiaRssBuilder = require('./lib/fbia-rss-builder'),
                HypatiaContentRetriever = require('./lib/hypatia-content-retriever'),
                config = require('./config'),
                fs = require('fs'),
                contentRetriever = new HypatiaContentRetriever(url),
                fbiaRssBuilder,
                articles = {docs: []};

            contentRetriever.getBaseContentModel(url,'fbia').then(
                    function success(sourceModel) {
                        contentRetriever.getRelatedContent(sourceModel).then(
                            function success(sourceModel) {
                                articles.docs.push(sourceModel.docs[0]);
                                fs.writeFile('response.json', sourceModel.docs[0], function (err) {
                                  if (err) return console.log(err);
                                  console.log('problem writing response');
                                });
                                console.log(sourceModel.docs[0]);
                                fbiaRssBuilder = new FbiaRssBuilder(articles, config.get('fbiaConfig'));
                                reply(fbiaRssBuilder.getFeed()).header('Content-Type',' text/xml');

                                //postToLSD(fbiaRssBuilder.getFeed());

                            },
                            function fail(error) {
                                log.error(`Error getRelatedContent: ${JSON.stringify(error)} - ${sourceModel.docs[0].url}`);
                            }
                        ).catch(function (error) {
                            log.error(`ERROR2: ${error.stack}`);
                        });
                    },
                    function fail(error) {
                        console.log(`Error: getBaseContentModel: ${JSON.stringify(error)} - ${url}`);
                    }
                ).catch(function (error) {
                    console.log(error);
            });
        }

        generateFbiaFeed('http://www.cnn.com/2016/05/23/entertainment/game-of-thrones-hodor/index.html');



        //.header('Content-Type',' text/xml');
    }
});

server.route({
    method: 'GET',
    path: '/fbia',
    handler: function (req, reply) {

        let config = require('./config'),
            qString,
            fbConfig = config.get('fbiaConfig');


            qString = `access_token=${fbConfig.app.shortTermToken}`;
            //qString = `grant_type=fb_exchange_token&amp;client_id=${fbConfig.app.clientId}&amp;client_secret=${fbConfig.app.clientSecret}&amp;
            //fb_exchange_token=${fbConfig.app.shortTermToken}`;
         try {
            console.log('about to request sean 7', qString);
            // https://graph.facebook.com/{page-id}/instant_articles?access_token={access-token}
            request.get({url:'https://graph.facebook.com/5550296508/instant_articles?' + qString}, function (error, response, body) {
                console.log(response);
                console.log(body);
            });
        } catch (error) {
                console.log(error);
        }

        reply('Hello, fbia' + qString);

    }
});

server.route({
    method: 'GET',
    path: '/cnnbot',
    handler: function (request, reply) {

       /* let config = require('./config'),
            qString,
            fbConfig = config.get('fbiaConfig');

            qString = `grant_type=fb_exchange_token&amp;client_id=${fbConfig.app.clientId}&amp;client_secret=${fbConfig.app.clientSecret}&amp;
            fb_exchange_token=${fbConfig.app.shortTermToken}`;
         try {
            request.get({ url:'https://graph.facebook.com/oauth/access_token?' + qString}, function (error, response, body) {
                console.log(response);
                console.log(body);
            });
        } catch (error) {
                console.log(error);
        }*/

        var watson = require('watson-developer-cloud');
        var fs     = require('fs');

        var natural_language_classifier = watson.natural_language_classifier({
          url: 'https://gateway.watsonplatform.net/natural-language-classifier/api',
          username: '543399f0-2ed7-4fad-91d7-7782f0c28b67',
          password: 'xU2nCsHUqEsh',
          version: 'v1'
        });

        var params = {
          language: 'en',
          name: 'My Classifier',
          training_data: fs.createReadStream('./panama_data_train.csv')
        };

        natural_language_classifier.create(params, function(err, response) {
          if (err)
            console.log(err);
          else
            reply(JSON.stringify(response, null, 2));
            console.log(JSON.stringify(response, null, 2));
        });



    }
});

server.route({
    method: 'GET',
    path: '/cnnbot/status',
    handler: function (request, reply) {

       /* let config = require('./config'),
            qString,
            fbConfig = config.get('fbiaConfig');

            qString = `grant_type=fb_exchange_token&amp;client_id=${fbConfig.app.clientId}&amp;client_secret=${fbConfig.app.clientSecret}&amp;
            fb_exchange_token=${fbConfig.app.shortTermToken}`;
         try {
            request.get({ url:'https://graph.facebook.com/oauth/access_token?' + qString}, function (error, response, body) {
                console.log(response);
                console.log(body);
            });
        } catch (error) {
                console.log(error);
        }*/

        var watson = require('watson-developer-cloud');
        var fs     = require('fs');

        var natural_language_classifier = watson.natural_language_classifier({
          url: 'https://gateway.watsonplatform.net/natural-language-classifier/api',
          username: '309b8200-dcf1-45a4-9647-49fee78e6196',
          password: '9yHEhOFqi3Dv',
          version: 'v1'
        });
        /*
        natural_language_classifier.list({},
          function(err, response) {
            if (err) {
                reply(JSON.stringify(err, null, 2));
                console.log('error:', err);
            } else {
                reply(JSON.stringify(response, null, 2));
                console.log(JSON.stringify(response, null, 2));
            }
          }
        );*/


        natural_language_classifier.status({
          classifier_id: '3a84cfx63-nlc-3365' },
          function(err, response) {
            if (err) {
              console.log('error:', err);
            } else {
                reply(JSON.stringify(response, null, 2));
                console.log(JSON.stringify(response, null, 2));
            }
          }
        );



    }
});

server.route({
    method: 'GET',
    path: '/cnnbot/ask/{question}',
    handler: function (request, reply) {
        let HypatiaContentRetriever = require('./lib/hypatia-content-retriever'),
            config = require('./config'),
            fs = require('fs'),
            contentRetriever = new HypatiaContentRetriever('notneeded'),
            articles = {docs: []},
            watson = require('watson-developer-cloud'),
            entity;


        function getArticles (question, intent, topic) {

                 contentRetriever.getSimpleBaseModel(topic).then(
                    function success(sourceModel) {

                        let articleResponse = '<br> Here are the articles we found: <br><br>';

                        contentRetriever.getRelatedContent(sourceModel).then(
                            function success(sourceModel) {

                                var natural_language_classifier = watson.natural_language_classifier({
                                  url: 'https://gateway.watsonplatform.net/natural-language-classifier/api',
                                  username: '309b8200-dcf1-45a4-9647-49fee78e6196',
                                  password: '9yHEhOFqi3Dv',
                                  version: 'v1'
                                });

                               async.map(sourceModel.docs, function (doc, done) {

                                   natural_language_classifier.classify({
                                      text: encodeURIComponent(doc.headline),
                                      classifier_id: '3a84d1x62-nlc-3168' },
                                      function(err, response) {
                                        if (err) {
                                          console.log('error:', err);
                                          done(err);
                                        } else {// adds an the response to the results array
                                           done(null, doc.headline +  'classified as: '+ response.top_class + '<br>');
                                        }
                                    });
                               }, function(err, results) {
                                    if (err) {
                                        reply(JSON.stringify(err, null, 2));
                                    } else {
                                        var stringResults = results.join('');
                                        reply(JSON.stringify('Questions was: '+ question+ '<br><br>'+'Question Intent is: ' + intent + '<br><br>' + 'Question Keyword is: ' + topic +'<br>' + articleResponse + results.join(''), null, 2));
                                    }
                               });
                            },
                            function fail(error) {
                                log.error(`Error getRelatedContent: ${JSON.stringify(error)} - ${sourceModel.docs[0].url}`);
                            }
                        ).catch(function (error) {
                            log.error(`ERROR2: ${error.stack}`);
                        });
                    },
                    function fail(error) {
                        console.log(`Error: getBaseContentModel: ${JSON.stringify(error)} - ${url}`);
                    }
                ).catch(function (error) {
                    console.log(error);
            });
        }

        function getEntity(text) {
            return new Promise(function (resolve, reject) {
                var watson = require('watson-developer-cloud');
                var apiKey = '7e93452f31411038936a65ddca22a09c6e10f2ff';
                var alchemy_language = watson.alchemy_language({ api_key: apiKey });
                var searchPhrase = text;
                var keywords = getKeywords(searchPhrase);
                console.log('inside get entity');

                function getKeywords(searchPhrase) {
                    var params = {
                        text: searchPhrase
                    };
                    alchemy_language.keywords(params, function (err, response) {
                        if (err) {
                            console.log('error:', err);
                            reject(err);
                        } else {
                            console.log(response);
                            resolve( response.keywords[0].text);
                           // getArticles(response);
                        }
                    });
                }
            });

        }

        var natural_language_classifier = watson.natural_language_classifier({
          url: 'https://gateway.watsonplatform.net/natural-language-classifier/api',
          username: '309b8200-dcf1-45a4-9647-49fee78e6196',
          password: '9yHEhOFqi3Dv',
          version: 'v1'
        });
        //GET Question Intent
        natural_language_classifier.classify({
          text: encodeURIComponent(request.params.question),
          classifier_id: '3a84d1x62-nlc-3268' },//3a84d1x62-nlc-3268
          function(err, response) {
            if (err) {
                reply(JSON.stringify(err, null, 2));
              console.log('error:', err);
            } else {
                //reply('Your questions is , ' + decodeURIComponent(request.params.question) + '?');
                getEntity(request.params.question).then(function success(entity) {
                    getArticles(request.params.question,response.top_class,entity);
                },function fail (err) {

                }).catch(function (error) {
                    log.error(`ERROR2: ${error.stack}`);
                });
            }
        });
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