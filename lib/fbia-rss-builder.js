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
    constructor(hypatiaFeed, config) {
        this.data = hypatiaFeed;
        this.config = config;
        this.inFBStoryBody = false;
    }

    getFeed() {
        var that = this;

        function wordCount(str) {
            return str.split(' ').length;
        }

        function renderElement(element) {

        }

        function renderBody (doc, article) {
             doc.body.paragraphs.forEach(function (paragraph, index) {
                let compositedParagraph,
                    compositedElement;

                if (paragraph.elements.length > 0) {
                    //compositedElement = self.addBodyParagraph(paragraph, index, doc, true);
                    if (compositedElement) {
                       // bodySection.components.push(compositedElement);
                    }
                }

                //compositedParagraph = self.addBodyParagraph(paragraph, index, doc, false);

                /*if (compositedParagraph) {
                    if (compositedParagraph.role === 'heading') {
                        bodySection.components.push(
                            self.addContainer([
                                self.addDivider('dividerCenteredLayout'),
                                compositedParagraph
                            ])
                        );
                    } else {
                        bodySection.components.push(compositedParagraph);
                    }
                }*/

            });
        }
        function getAuthors(doc) {
            var authors = doc.byline;
            authors = authors.replace(/^By +/, '');
            authors = authors.replace(/^From +/, '');
            authors = authors.replace('And', ',');
            authors = authors.replace(', Special to CNN', '');
            authors = authors.split(',');

            return authors;
        }

        function renderVideo(doc) {

        }

        function renderGallery(doc) {
            if (doc.reference !== undefined) {

            }
        }

        function renderImage(image, article, isFigureTag) {
            var preferredImage = that.inFBStoryBody ?  that.config.inStoryImage : that.config.preferredImage;
            var figure = {};
            if (image !== undefined && image.cuts !== undefined && image.cuts !== null && image.cuts[preferredImage] !== undefined) {

                var cut = image.cuts[preferredImage];
                figure = {
                    'figure':[
                        {'img': {'@src': cut.url}}
                    ]
                }
                if (image.caption !== undefined && image.caption !== '') {
                    figure.figure.push({'figcaption': image.caption});
                }


            }
            return figure;
        }

        function addHighlights(doc, article) {
            if (doc.highlights !== undefined && Array.isArray(doc.highlights) && doc.highlights.length > 0) {
                var style = `
                    div { font-family: 'HelveticaNeue-Thin'; font-size: .9em; border-bottom: 1px solid #D9D9D9; padding: 3px 0px 3px 0px; }
                    div.title { font-family: 'HelveticaNeue-Medium'; font-size: .8em; color: #8C8C8C; }
                    div.container { padding-bottom: 25px; border-bottom: none; }
                    `;
               /* var highlights = {
                    'figure': []
                }
                highlights.push({'@class':'op-interactive'});*/
                var highlightElements = [];

                highlightElements.push({'@class': 'containter'});
                highlightElements.push({
                    'div': {
                        '@class': 'title',
                        '#text': 'Story Highlights'
                    }
                });

                doc.highlights.forEach( function(highlight){
                    if (highlight.plaintext !== undefined && highlight.plaintext !== '') {
                        doc.wordCount = wordCount(highlight.plaintext);
                        doc.runningWordCount = doc.runningWordCount + doc.wordCount;
                        highlightElements.push({'div': highlight.plaintext})
                    }
                });

                var highlights = {
                    'figure': [
                        {'@class':'op-interactive'},
                        {'iframe': [
                            {
                                'style':{'#text':style}
                            },
                            {
                                'div': highlightElements
                            }
                        ]}
                    ]
                }
                article.article.push({'figure': highlights.figure});
            }
        }

        function addHeader(doc, article) {
            var header = {
                'header': []
            }
            doc.relatedMedia.media.some(function (item) {
                var media;
                if (item.location === 'pageTop' && item.type === 'reference') {
                    if (item.referenceType === 'gallery') {
                       media = renderImage(item, article, true);
                    } else if (item.referenceType === 'image') {
                        media = renderImage(image, article, true);
                    } else if (item.referenceType === 'video') {
                        media = renderImage(item, article, true);
                    }
                }
                if (media !== undefined) {
                    header.header.push({'figure': media.figure});
                }
            });
            header.header.push({'h1': doc.headline});
            header.header.push({'time':{'@class':'op-published','@datetime': '*published date','#text': '*publishedDatePlainEnglish'}});
            header.header.push({'time':{'@class':'op-modified','@datetime': '*lastpublished date','#text': '*lastpublishedDatePlainEnglish'}});

            if (doc.byline !== undefined && doc.byline !== ''){
                var authors = getAuthors(doc)
                if (Array.isArray(authors) && authors.length > 0) {
                    authors.forEach( function (author) {
                        header.header.push({'address': {'a':author}});
                    })
                }
            }
            article.article.push(header);
        }

        function generateItem(doc) {
            var article = {
                article: []
            }
            var xml = builder.create('html', {headless: true, encoding: 'UTF-8'},{separateArrayItems: true, noDoubleEncoding: true, stringify: {}}).dtd()
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
                .ele('meta')
                    .att('property', 'op:markup_version')
                    .att('content', 'v1.0')
            .up()
                .ele('meta')
                    .att('property', 'fb:article_style')
                    .att('content', 'CNN')
           .up()
           .up();

            addHeader(doc, article);
            addHighlights(doc,article);

            xml.ele('body')
            .ele(article);



            xml = xml.end({ pretty: true, 'indent': '  ', 'newline': '\n', allowEmpty: true});



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

                doc.wordCount = 0;
                doc.runningWordCount = 0;

                var theArticle = generateItem(doc);
                //item.custom_elements.push({'content:encoded': '<![CDATA[' + theArticle + ']]>'});
                item.custom_elements.push({'content:encoded': theArticle});

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