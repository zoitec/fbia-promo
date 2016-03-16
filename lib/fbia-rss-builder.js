'use strict';

const builder = require('xmlbuilder'),
    RSS = require('rss');
/**
 * @class FbiaRssBuilder
 *
 * @classdesc
 * Main class for generating an RSS feed for FBIA.
 *
 *
 * @param {String} hypatiaFeed feed response
 * The path to save mapped resources at on the local file system.
 */
class FbiaRssBuilder {
    constructor(hypatiaFeed) {
        this.data = hypatiaFeed;
    }



    getFeed() {
        function generateItem(doc) {
            var xml = builder.create('html', {headless: true, encoding: 'UTF-8'}).dtd()
            .up()
            .att('lang', 'en')
            .att('prefix', 'op: http://media.facebook.com/op#')
            .ele('head')
                .ele('meta')
                    .att('charset', 'UTF-8')
            .up()
                .ele('link')
                    .att('rel','canonical')
                    .att('href', doc.url)
            .up()
            .up()
            .ele('body')
            .end({ pretty: true, indent: '  ', newline: '\n', allowEmpty: true});

            /*xml = builder.create({
              html: {
                '@lang': 'en',
                body: {}
              }
            }).end({ pretty: true});*/



            return xml;
        }

        const feed = new RSS({
            title: 'CNN',
            link: 'http://www.cnn.com/',
            description: 'CNN - Breaking News, Daily News and Videos',
            language: 'en-us',
            lastBuildDate:''
        });
        if (this.data !== undefined  && this.data.docs !== undefined && Array.isArray(this.data.docs) && this.data.docs.length > 0 ) {
            this.data.docs.forEach( function (doc) {

                var item = {};
                item.title = doc.headline.text || doc.headline || '';
                item.guid = doc.id;
                item.custom_elements = [];
                //item.custom_elements.push({description: doc.seo.description || ''});
                item.custom_elements.push({description: doc.description[0].plaintext || ''});


                if (doc.byline !== undefined && doc.byline.text !== undefined && doc.byline.text !== '') {
                    item.custom_elements.push({author: doc.byline.text});
                }

                //item.custom_elements.push({link: 'http://www.cnn.com/' + doc.uri || ''});
                item.custom_elements.push({link: doc.url || ''});
                item.custom_elements.push({pubDate: '1994-11-05T13:15:30Z'});

                var theArticle = generateItem(doc);
                item.custom_elements.push({'content:encoded': '<![CDATA[' + theArticle + ']]>'});

                feed.item(item);

            });
        }


        return feed.xml();
    }

    set setSomething(something) {
        this.something = something;
    }

    get setSomething() {
        return this.something;
    }
}

module.exports = FbiaRssBuilder;