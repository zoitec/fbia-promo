'use strict';

const builder = require('xmlbuilder'),
    RSS = require('rss'),
    moment = require('moment');
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
    }

    getFeed() {
        let that = this,
            buildDate = getDate();;

        function wordCount(str) {
            return str.split(' ').length;
        }

        function exists(thing) {
            if(thing !== undefined && thing !== null  && thing !== '') {
                return true;
            } else {
                return false;
            }
        }

        function getEmbedElement(element,embedType) {
            let embed = {
                'figure':[{'@class': 'op-social'}]
            };

            switch (embedType) {
                case 'facebook':
                    let script = `
                        (function (d, s, id) {
                            var js, fjs = d.getElementsByTagName(s)[0];
                            if (d.getElementById(id)) { return; }
                            js = d.createElement(s);
                            js.id = id;
                            js.src = '//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.2';
                            fjs.parentNode.insertBefore(js, fjs);
                        }(document, 'script', 'facebook-jssdk'));
                    `;

                    embed.figure.push({
                        'iframe': {
                            'div': {
                                '@class':'fb-post',
                                '@data-href': element.attributes.url,
                                '@data-stream':'true',
                                '@data-show-faces':true,
                            },
                            'script': {
                                '@type': 'text/javascript',
                                '#text': script
                            }
                        }
                    });

                    break;
                case 'vine':
                    embed.figure.push({
                        'script': {
                            '@async':'',
                            '@src': '//platform.vine.co/static/scripts/embed.js',
                            'charset': 'utf-8'
                        },
                        'iframe': {
                            '@src': element.attributes.url
                        }
                    });

                    break;
                case 'youtube':
                    embed.figure.push({
                        'iframe':{
                            '@src': element.attributes.url
                        }
                    });
                    break;
                default:
                    embed.figure.push({
                        'iframe': element.attributes.url
                    });

            }

            return embed;
        }

        function getDate(date,format) {

            if(exists(format)){
                return moment(date).format(format);
            }

            if(!exists(date) && !exists(format)) {
                return moment().format();
            }

            return moment(date).format();
        }

        function addBodyParagraphs (doc, article) {
            let adPlaced = 0,
                ad1Source = 'http://www.cnn.com/partners/facebook/ad-atf.html?branding=',
                ad2Source = 'http://www.cnn.com/partners/facebook/ad-btf.html?branding=',
                headerPlaced = false,
                foundBullets = false,
                paragrahphsLength = doc.body.paragraphs.length,
                isFirstParagraph = true,
                location = doc.location || '',
                totalWordCount = 0,
                spec = doc.branding || '',
                editorialSource;

            doc.inFBStoryBody = true;

            if (exists(spec)) {
                spec = spec.replace('-','_');
            }

            if (exists(doc.editorialSource)) {
                if (typeof doc.editorialSource === 'object') {
                    editorialSource = doc.editorialSource.text;
                } else {
                    editorialSource = doc.editorialSource;
                }

            } else {
                editorialSource = 'CNN';
            }

            doc.body.paragraphs.forEach(function (paragraph, index) {

            let paragraphElement = {
                    'p':[]
                },
                allowedEmbed = ['twitter','facebook','instagram','youtube','vine'],
                media,
                embed;

                if (paragraph.elements.length > 0) {
                    if (paragraph.elements[0].type !== 'embed') {
                        let target = paragraph.elements[0].target.target || {}; //TODO  Not sure where the target item will be yet
                        switch (paragraph.elements[0].target.type) {
                            case 'image':
                                media = renderImage(target, article, true);
                                break;

                            case 'video':
                                media = renderVideo(target, article, true);
                                break;
                        }
                    } else {
                        if(allowedEmbed.indexOf(paragraph.elements[0].attributes.type) > 0) {
                            embed = getEmbedElement(paragraph.elements[0],paragraph.elements[0].attributes.type);
                        }
                    }

                    if (media !== undefined) {
                        article.article.push({'figure': media.figure});
                    } else if (embed  !== undefined)  {
                        article.article.push({'figure': embed.figure});
                    }
                }

                if (exists(paragraph.richtext)) {
                    if (paragraph.richtext.match(/^<h3>/)  && !paragraph.richtext.match(/<li>/)) {
                        article.article.push({'h2': paragraph.plaintext.trim()});
                        headerPlaced = true;
                    } else if (paragraph.richtext.match(/<li>/)) {
                        article.article.push({'#text': paragraph.richtext.trim()});
                    } else {
                        if (isFirstParagraph && (exists(location) || exists(editorialSource))) {
                            let locationAndSourceLine = '';
                            if (exists(location)) {
                                locationAndSourceLine = location;
                            }

                            if (exists(editorialSource)) {
                                locationAndSourceLine = locationAndSourceLine + ' ' + editorialSource;
                            }
                            paragraphElement.p.push({'strong':locationAndSourceLine.trim()});
                            isFirstParagraph = false;
                        }

                        paragraphElement.p.push({'#text': paragraph.richtext.trim()});
                        article.article.push({'p': paragraphElement.p});


                    }
                } else if (exists(paragraph.plaintext)) {
                    if (isFirstParagraph && (exists(location) || exists(editorialSource))) {
                        let locationAndSourceLine = '';
                        if (exists(location)) {
                            locationAndSourceLine = location;
                        }

                        if (exists(editorialSource)) {
                            locationAndSourceLine = locationAndSourceLine + ' ' + editorialSource;
                        }
                        paragraphElement.p.push({'strong':locationAndSourceLine.trim()});
                        isFirstParagraph = false;
                    }

                    paragraphElement.p.push({'#text': paragraph.plaintext.trim()});
                    article.article.push({'p': paragraphElement.p});
                }


                if (exists(paragraph.plaintext)) {
                    doc.wordCount = wordCount(paragraph.plaintext);
                }

                doc.runningWordCount = doc.runningWordCount + doc.wordCount;
                totalWordCount = totalWordCount + doc.wordCount;

                if (headerPlaced === false) {
                    if (adPlaced === 0 && doc.runningWordCount >= 150) {
                        article.article.push({'figure' :{'@class','op-ad','iframe':{'@src':ad1Source+spec,'@height':'250','@width':'300'}}});
                        adPlaced ++;
                        doc.runningWordCount = 0;
                    } else if (adPlaced < 2 && doc.runningWordCount >= 450) {
                        article.article.push({'figure' :{'@class','op-ad','iframe':{'@src':ad2Source+spec,'@height':'250','@width':'300'}}});
                        adPlaced ++
                        doc.runningWordCount = 0;
                    } else if ( adPlaced === 0 && ((index + 1) === paragrahphsLength)  &&
                        totalWordCount > 100 && totalWordCount < 150){
                        article.article.push({'figure' :{'iframe':{'@src':ad1Source+spec,'@height':'250','@width':'300'}}});
                        adPlaced ++;
                        doc.runningWordCount = 0;
                    }
                }

            });
        }
        function getAuthors(doc) {
            let authors = doc.byline;
            authors = authors.replace(/^By +/, '');
            authors = authors.replace(/^From +/, '');
            authors = authors.replace('And', ',');
            authors = authors.replace(', Special to CNN', '');
            authors = authors.split(',');

            return authors;
        }

        function renderVideo(doc, video, article, isFigureTag) {
            let videoElement = {
                'figure':[]
            },
            src,
            id,
            img,
            duration,
            omnitureObject;

            if (exists(video.data)) {
                if (exists(video.data.videoProfiles) &&  exists(video.data.videoProfiles[that.config.preferredVideo])) {
                    if (that.config.embedVideos === 1) {
                        /*
                        * I've add this logic from what was in the freemarker templates
                        * But it seems that in production today we're not attempting to use CVP
                        * player to imbed videos.  This was probably because it was rejected
                        * by facebook
                        */
                        omnitureObject = JSON.stringify(getOmnitureObject(doc));
                        id = video.data.uri.replace('/video/data/3.0','').replace('/index.xml','');
                        src = encodeURIComponent('http://www.cnn.com/partners/facebook/video-embed.html?CNN=' + omnitureObject + '#' + id);
                        videoElement.figure.push({'@class': 'op-interactive'});
                        videoElement.figure.push({
                            'iframe': {
                                '@width':'416',
                                '@height': '234',
                                '@class': 'no-margin',
                                '@src' : src,
                                'frameborder': '0'
                            }
                        });
                    } else {
                        /* lets render videos natively use html 5 video */
                        src = that.config.videoCDN + video.data.videoProfiles[that.config.preferredVideo];
                        videoElement.figure.push({'@data-feedback': 'fb:likes,fb:comments'});
                        videoElement.figure.push({'video': {'@controls':'','source': {'@src': src, '@type':'video/mp4'}}});

                        doc.inFBStoryBody = false;
                        img = renderImage(doc, video, article, false);

                        if (exists(img)) {
                            videoElement.figure.push({'img': img.figure[0].img});
                        }
                        doc.inFBStoryBody = true;

                        if (exists(video.data.thumbnails[0].caption)) {
                            duration = video.data.duration || '';
                            duration = duration.replace(/^00:/,'');
                            videoElement.figure.push({'figcaption': video.data.thumbnails[0].caption + ' ' + duration });
                        }


                    }
                }
            }

            return videoElement;

        }
        function renderGallerySlideImage(doc, image, article, isFigureTag) {
            let preferredImage = doc.inFBStoryBody ?  that.config.inStoryImage : that.config.galleryPreferredImage,
                figure = {
                    'img':'',
                    'caption': ''
                },
                cut;

            if (exists(image) && exists(image.element) && exists(image.element.cuts) && exists(image.element.cuts[preferredImage])) {

                cut = image.element.cuts[preferredImage];

                figure.img = that.config.imageCDN + cut.uri;
                if (exists(image.element.caption)) {
                    figure.caption =  image.element.caption.trim();
                }
            }

            return figure;
        }
        function renderImage(doc, image, article, isFigureTag) {
            let preferredImage = doc.inFBStoryBody ?  that.config.inStoryImage : that.config.preferredImage,
                figure = {};
            if (exists(image) && exists(image.cuts) && exists(image.cuts[preferredImage])) {

                let cut = image.cuts[preferredImage];
                if(doc.inFBStoryBody) {
                    figure = {
                        'figure':[
                            {'@data-mode': 'non-interactive'},
                            {'img': {'@src': cut.url}}
                        ]
                    }
                } else {
                    figure = {
                        'figure':[
                            {'img': {'@src': cut.url}}
                        ]
                    }
                }

                if (image.caption !== undefined && image.caption !== '') {
                    figure.figure.push({'figcaption': image.caption});
                }


            }
            return figure;
        }

        function renderGallery(doc, gallery, article, isFigureTag) {
            if (exists(gallery.data)  && exists(gallery.data.slides)) {

                let galleryElement = {
                    'figure': [{'@class':'op-slideshow'}]
                },
                slideImage;

                gallery.data.slides.forEach(function(slide) {

                    let slideFigure = {
                        'figure': []
                    },
                    slideImage = renderGallerySlideImage(doc,slide, article, isFigureTag);
                    if (exists(slideImage)) {

                        if (exists(slideImage) && exists(slideImage.img)) {

                            slideFigure.figure.push({'img':{'@src': slideImage.img}});

                            if (exists(slideImage.caption)) {
                                slideFigure.figure.push({'figcaption': slideImage.caption});
                            }
                        }
                        galleryElement.figure.push({'figure': slideFigure.figure});
                    }
                });
                return galleryElement;
            }
        }

        function addBodyNotes(doc, article) {
            if (exists(doc.body.notes) && typeof doc.body.notes === 'object') {
                let notes = doc.body.notes;
                if (exists(notes.wwwText) && Array.isArray(notes.wwwText) && notes.wwwText.length > 0) {
                    let h1Style = `font-family: 'HelveticaNeue-Thin'; font-size: 1.1em;`,
                        pStyle = `font-family: 'HelveticaNeue-Thin'; font-size: .8em;`,
                        editorsNotes =  {
                            'figure' : [
                                {'@class': 'op-interactive'},
                                {'iframe': [
                                    {
                                        'h1': {
                                            '@style': h1Style,
                                            'em': notes.type || 'Editor\'s Note'
                                        },
                                        'p': {
                                            '@style': pStyle,
                                            '#text': notes.wwwText[0].plaintext
                                        }
                                    }
                                ]}
                            ]
                        }
                    article.article.push({'figure': editorsNotes.figure});
                }
            }
        }

        function addHighlights(doc, article) {
            if (doc.highlights !== undefined && Array.isArray(doc.highlights) && doc.highlights.length > 0) {
                let style = `
                    div { font-family: 'HelveticaNeue-Thin'; font-size: .9em; border-bottom: 1px solid #D9D9D9; padding: 3px 0px 3px 0px; }
                    div.title { font-family: 'HelveticaNeue-Medium'; font-size: .8em; color: #8C8C8C; }
                    div.container { padding-bottom: 25px; border-bottom: none; }
                    `;

                let highlightElements = [];

                highlightElements.push({'@class': 'containter'});
                highlightElements.push({
                    'div': {
                        '@class': 'title',
                        '#text': 'Story Highlights'
                    }
                });

                doc.highlights.forEach( function(highlight){
                    if (exists(highlight.richtext)) {
                        doc.wordCount = wordCount(highlight.plaintext);
                        doc.runningWordCount = doc.runningWordCount + doc.wordCount;
                        highlightElements.push({'div': highlight.plaintext})
                    }
                });

                let highlights = {
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
            let header = {
                'header': []
            },
            publishedDate,
            readablePublishedDate,
            lastPublishedDate,
            readableLastPublishedDate;

            publishedDate = doc.firstPublishDate;
            readablePublishedDate = getDate(publishedDate,'MMMM Do YYYY');

            lastPublishedDate = doc.lastPublishDate;
            readableLastPublishedDate = getDate(lastPublishedDate,'MMMM Do YYYY');

            doc.relatedMedia.media.some(function (item) {
                let media;
                if (item.location === 'pageTop' && item.type === 'reference') {
                    if (item.referenceType === 'gallery') {
                       media = renderGallery(doc, item, article, true);
                    } else if (item.referenceType === 'image') {
                        media = renderImage(doc, image, article, true);
                    } else if (item.referenceType === 'video') {
                        media = renderVideo(doc, item, article, true);
                    }
                }
                if (exists(media)) {
                    header.header.push({'figure': media.figure});
                }
            });
            header.header.push({'h1': doc.headline});
            header.header.push({'time':{'@class':'op-published','@datetime': publishedDate,'#text' :readablePublishedDate }});
            header.header.push({'time':{'@class':'op-modified','@datetime': lastPublishedDate,'#text': readableLastPublishedDate}});

            if (doc.byline !== undefined && doc.byline !== ''){
                let authors = getAuthors(doc)
                if (Array.isArray(authors) && authors.length > 0) {
                    authors.forEach( function (author) {
                        header.header.push({'address': {'a':author}});
                    })
                }
            }
            article.article.push(header);
        }

        function getOmnitureObject(doc) {
            let omnitureObject = {'omniture':{}},
                publishedDate = getDate(doc.firstPublishDate, 'YYYY/MM/DD');

            omnitureObject.omniture['rs_flag'] ='prod';
            omnitureObject.omniture['template_type'] ='content';
            omnitureObject.omniture['content_type'] = 'article read';
            omnitureObject.omniture['sections'] = [doc.section];
            omnitureObject.omniture['cap_author'] = getAuthors(doc);
            omnitureObject.omniture['branding_content_page'] = doc.branding || '';
            omnitureObject.omniture['publish_date'] = publishedDate;
            omnitureObject.omniture['branding_social'] = 'Facebook Instant Article';
            omnitureObject.omniture['fbia'] = true;
            omnitureObject.omniture['page_name'] = doc.headline.text || doc.headline || '';


            return omnitureObject;
        }

        function addTracking(doc, article) {
            let opTracker = {
                'figure': [{'@class': 'op-tracker'}]
            },
            omnitureObject = JSON.stringify(getOmnitureObject(doc)),
            scriptOne = `var CNN = ${omnitureObject}`,
            scriptTwo = `var jsmd = _jsmd.init(), pageURL = location.href.toLowerCase();
                jsmd.send();`;


            opTracker.figure.push({'iframe': [
                    {'script':{'#text': scriptOne}},
                    {'script':{'@src': 'http://z.cdn.turner.com/analytics/cnnexpan/jsmd.min.js'}},
                    {'script':{'#text': scriptTwo}}

                ]});

            article.article.push({'figure': opTracker.figure})
        }

        function addFooter(doc, article) {
            let footer = {
                'footer': []
            },
            aside = '',
            year = getDate(new Date(), 'YYYY'),
            smallText = `&copy; ${year} Cable News Network. A Time Warner Company. All Rights Reserved.`;

            if (exists(doc.body.footer)  && exists(doc.body.footer.paragraphs) && doc.body.footer.paragraphs.length > 0 ) {
                doc.body.footer.paragraphs.forEach(function (paragraph) {
                    if (paragraph.richtext && paragraph.richtext.trim()) {
                        aside = aside + paragraph.richtext.trim();
                    }
                });
                footer.footer.push({'aside': aside});
                footer.footer.push({'small': smallText});
                article.article.push({'footer': footer.footer});
            }

        }

        function generateItem(doc) {
            let article = {
                article: []
            }

            let xml = builder.create('html', {headless: true, encoding: 'UTF-8'},{separateArrayItems: true, noDoubleEncoding: true, stringify: {}}).dtd()
            .up()// traversing back up the tree to the parent.  In this context the parent is actually the root element(html)
            .att('lang', 'en')// add an attribute
            .att('prefix', 'op: http://media.facebook.com/op#')
            .ele('head') // adding a new element
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

            addHeader(doc,article);
            addHighlights(doc,article);
            addBodyNotes(doc,article);
            addBodyParagraphs(doc,article);
            addTracking(doc,article);
            addFooter(doc,article);

            xml.ele('body')
            .ele(article);

            xml = xml.end({ pretty: true, 'indent': '  ', 'newline': '\n', allowEmpty: true});

            return xml;
        }

        const feed = new RSS({
            title: 'CNN',
            description: 'CNN - Breaking News, Daily News and Videos',
            language: 'en-us',
            site_url: 'http://www.cnn.com',
            generator: 'CNN'
        });
        if (this.data !== undefined  && this.data.docs !== undefined && Array.isArray(this.data.docs) && this.data.docs.length > 0 ) {
            this.data.docs.forEach( function (doc) {

                let item = {},
                    description = '';
                item.title = doc.headline.text || doc.headline || '';
                item.guid = doc.id;
                item.custom_elements = [];

                doc.description.forEach(function (paragraph) {
                if (paragraph.richtext && paragraph.richtext.trim()) {
                        description = description + paragraph.richtext.trim();
                    }
                });

                item.custom_elements.push({description: description});

                if (doc.byline !== undefined && doc.byline.text !== undefined && doc.byline.text !== '') {
                    item.custom_elements.push({author: doc.byline.text});
                }

                doc.wordCount = 0;
                doc.runningWordCount = 0;
                doc.ads_placed = 0;
                doc.inFBStoryBody = false
                doc.omnitureObject = getOmnitureObject(doc);

                let theArticle = generateItem(doc);
                item.custom_elements.push({'content:encoded': '<![CDATA[' + theArticle + ']]>'});

                feed.item(item);

            });
        }

        return feed.xml();
    }
}

module.exports = FbiaRssBuilder;