'use strict';

const async = require('async'),
    parseString = require('xml2js').parseString,
    request = require('request'),
    config = require('../config'),
    log = require('mss-logger')(config.get('logConfig')),
    timeout = config.get('requestDefaultTimeout');



/**
 * @class ContentRetriever
 *
 * @classdesc
 * Retrieves content from Hypatia for a given url.
 *
 * ##### Public Methods
 * - [getBaseContentModel]{@link ContentRetriever#getBaseContentModel}
 * - [getRelatedContent]{@link ContentRetriever#getRelatedContent}
 *
 * ##### Private Methods
 * - [getGallerySlides]{@link ContentHelper#getGallerySlides}
 * - [getVideoUrl]{@link ContentHelper#getVideoUrl}
 *
 * @param {String} url
 * The url to retrieve.
 *
 */
class ContentRetriever {
    constructor(url) {
        /**
         * @member {String} ContentRetriever#url
         * The url to retrieve.
         */
        this.url = url;
    }



    /**
     * Gets a base content model from Hypatia for a given url.  This is not a
     * complete content model, there may be elements in this model that are just
     * references to other models that must be fetched.  An example of this
     * would be the images that go in a gallery.
     *
     * @function ContentRetriever#getBaseContentModel
     *
     * @public
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     */
    getSimpleBaseModel(topic) {
        let apiEndpoint = `${config.get('hypatia').host}${config.get('hypatia').queryPrefix}`,
        query = `type:article/topicLabel:${topic}`;
        log.log(`Hypatia query: ${apiEndpoint}${query}`);


        return new Promise(function (resolve, reject) {
            try {
                request.get({json: true, url: `${apiEndpoint}${query}`, timeout: timeout}, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        if (body.docs.length === 0) {
                            reject(new Error('no content found'));
                        }

                        resolve(body);
                    }

                });
            } catch (error) {
                log.error(`Error in getBaseContentModel: ${JSON.stringify(error)}`);
            }
        });
    }

    getBaseContentModel(url, destination) {
        let apiEndpoint = `${config.get('hypatia').host}${config.get('hypatia').queryPrefix}`,
            query = `url:${encodeURIComponent(url)}`;

        log.info(`Hypatia query: ${apiEndpoint}${query}`);

        return new Promise(function (resolve, reject) {
            try {
                request.get({json: true, url: `${apiEndpoint}${query}`, timeout: timeout}, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        if (body.docs.length === 0) {
                            reject(new Error('no content found'));
                        }

                        if (destination) {
                            body.docs[0].destination = destination;
                        }

                        resolve(body);
                    }

                });
            } catch (error) {
                log.error(`Error in getBaseContentModel: ${JSON.stringify(error)}`);
            }
        });
    }



    // timestmap should be iso-blah-blah format // 2016-04-08T12:00:00Z
    getUrlsSince(timestamp) {
        let timestampThen = timestamp,
            timestampNow = new Date().toISOString(),
            hypatiaQueryUrl = `http://hypatia.api.cnn.com/svc/content/v2/search/collection1/type:article/sort:lastPublishDate/source:cnn/lastPublishDate:${timestampThen}~${timestampNow}/rows:100`;

        return new Promise(function (resolve, reject) {
            try {
                request.get({json: true, url: `${hypatiaQueryUrl}`, timeout: timeout}, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        let urls = [];

                        async.each(body.docs, function (sourceModel, callback) {
                            urls.push(sourceModel.url);
                            callback();
                        }, function (error) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(urls);
                            }
                        });
                    }
                });
            } catch (error) {
                log.error(`Error in getBaseContentModelSince: ${error}`);
            }
        });
    }



    /**
     * Gets the slides from Hypatia for a gallery query.
     *
     * @function ContentHelper#getGallerySlides
     *
     * @private
     *
     * @param {String} url
     * The full url to call to return the content needed for a gallery.  This is
     * found in the base content model in the `referenceUrl` of a gallery
     * element.
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     */
    getGallerySlides(url) {
        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                try {
                    request.get({json: true, url: url, timeout: timeout}, function (error, response, body) {
                        if (error) {
                            done(error);
                        } else {
                            if (body.docs[0] && body.docs[0].slides) {
                                done(null, body.docs[0].slides);
                            } else {
                                done({error: `No slides in gallery: ${url}`});
                            }
                        }

                    });
                } catch (error) {
                    console.error(`Error in getGallery Slides: ${error}`);
                }
            }], function (error, result) {
                if (error) {
                    reject(error);
                }

                resolve(result);
            });
        });
    }
    /**
     * Gets the video document from Hypatia for a video query.
     *
     * @function ContentHelper#getVideoDocument
     *
     * @private
     *
     * @param {String} url
     * The full url to call to return the content needed for a video.  This is
     * found in the base content model in the `referenceUrl` of a video
     * element.
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     */
    getVideoDocument(url) {
        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                try {
                    request.get({json: true, url: url, timeout: timeout}, function (error, response, body) {
                        if (error) {
                            done(error);
                        } else {
                            if (body.docs[0]) {
                                done(null, body.docs[0]);
                            } else {
                                done({error: `No video document found for  url: ${url}`});
                            }
                        }

                    });
                } catch (error) {
                    console.error(`Error in getVideoDocument: ${error}`);
                }
            }], function (error, result) {
                if (error) {
                    reject(error);
                }

                resolve(result);
            });
        });
    }
    /**
     * Gets the image document from Hypatia for a image query.
     *
     * @function ContentHelper#getImage
     *
     * @private
     *
     * @param {String} url
     * The full url to call to return the content needed for an image.  This is
     * found in the base content model in the `referenceUrl` of an image
     * element.
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     */
    getImage(url) {
        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                try {
                    request.get({json: true, url: url, timeout: timeout}, function (error, response, body) {
                        if (error) {
                            done(error);
                        } else {
                            if (body.docs[0]) {
                                done(null, body.docs[0]);
                            } else {
                                done(new Error(`No image document found for reference: ${url}`));
                            }
                        }

                    });
                } catch (error) {
                    console.error(`Error in getVideoDocument: ${error}`);
                }
            }], function (error, result) {
                if (error) {
                    reject(error);
                }

                resolve(result);
            });
        });
    }



    /**
     * Gets the related content for a base content model.
     *
     * @function ContentRetriever#getRelatedContent
     *
     * @public
     *
     * @param {Object} data
     * The base content model returned from `getBaseContentModel`.
     *
     * @returns {Promise}
     * Returns a promise with the complete content model on success or an error
     * message on failure.
     */
    getRelatedContent(data) {
        let self = this;


        /**
         * Loops though an array of paragraphs to fetch and referenced data.
         *
         * @private
         *
         * @param {Object} data
         * A Hyptia response object.
         *
         * @param {Function} callback
         * An async parallel callback function from getRelatedContent()
         */
        function processParagraphs(data, callback) {
            let index = 0;

            try {
                if (data.docs[0].body) {
                    async.eachSeries(data.docs[0].body.paragraphs, function (paragraph, callbackEachSeries) {
                        if (paragraph.elements.length > 0 && paragraph.elements[0].type !== 'embed') {
                            if (paragraph.elements[0].target.type === 'gallery') {
                                self.getGallerySlides(paragraph.elements[0].target.referenceUrl).then(
                                    function success(result) {
                                        data.docs[0].body.paragraphs[index].slides = result;
                                        index++;
                                        callbackEachSeries();
                                    },
                                    function failure(error) {
                                        index++;
                                        callbackEachSeries(error);
                                    }
                                ).catch(function (error) {
                                    log.error(`ERROR5: ${JSON.stringify(error)}`);
                                });
                            } else if(paragraph.elements[0].target.type === 'video') {
                                self.getVideoDocument(paragraph.elements[0].target.referenceUrl).then(
                                        function success(result) {
                                            data.docs[0].body.paragraphs[index].elements[0].target.data = result;
                                            index++;
                                            callbackEachSeries();
                                        },
                                        function failure(error) {
                                            index++;
                                            callbackEachSeries(error);
                                        }
                                ).catch(function (error) {
                                    log.error(`ERROR7: ${error.stack}`);
                                });
                            } else if(paragraph.elements[0].target.type === 'image') {
                                self.getImage(paragraph.elements[0].target.referenceUrl).then(
                                        function success(result) {
                                            data.docs[0].body.paragraphs[index].elements[0].target.data = result;
                                            index++;
                                            callbackEachSeries();
                                        },
                                        function failure(error) {
                                            index++;
                                            callbackEachSeries(error);
                                        }
                                ).catch(function (error) {
                                    log.error(`ERROR7: ${error.stack}`);
                                });
                            } else {
                                index++;
                                callbackEachSeries();
                            }
                        } else {
                            index++;
                            callbackEachSeries();
                        }
                    }, function (error) {
                        callback(error);
                    });
                } else {
                    callback();
                }
            } catch (error) {
                log.error(`Error in getRelatedContent::processParagraphs ${JSON.stringify(error)}`);
            }
        }


        /**
         * Loops though an array of relatedMedia to fetch and referenced data.
         *
         * @TODO - MAJOR - It feels like there should be a call to callback() somewhere in here
         *
         * @private
         *
         * @param {Object} data
         * A Hypatia response object.
         *
         * @param {Function} callback
         * An async parallel callback function from getRelatedContent()
         */
        function processRelatedMedia(data, callback) {
            let index = 0;

            try {
                async.eachSeries(data.docs[0].relatedMedia.media, function (media, callbackEachSeries) {
                    if (media.type === 'reference') {
                        switch (media.referenceType) {
                            case 'gallery':
                                self.getGallerySlides(media.referenceUrl).then(
                                    function success(result) {
                                        data.docs[0].relatedMedia.media[index].slides = result;
                                        index++;
                                        callbackEachSeries();
                                    },
                                    function failure(error) {
                                        index++;
                                        callbackEachSeries(error);
                                    }
                                ).catch(function (error) {
                                    log.error(`ERROR6: ${JSON.stringify(error)}`);
                                });
                                break;

                            case 'video':
                                if(data.docs[0].destination) {
                                    self.getVideoDocument(data.docs[0].relatedMedia.media[index].referenceUrl).then(
                                        function success(result) {
                                            data.docs[0].relatedMedia.media[index].data =result;
                                            index++;
                                            callbackEachSeries();
                                        },
                                        function failure(error) {
                                            index++;
                                            callbackEachSeries(error);
                                        }
                                    ).catch(function (error) {
                                        log.error(`ERROR7: ${error.stack}`);
                                    });
                                } else {
                                    self.getVideoUrl(media.cvpXmlUrl, data.docs[0].dataSource || 'cnn').then(
                                        function success(result) {
                                            data.docs[0].relatedMedia.media[index].m3u8Url = result;
                                            index++;
                                            callbackEachSeries();
                                        },
                                        function failure(error) {
                                            index++;
                                            callbackEachSeries(error);
                                        }
                                    ).catch(function (error) {
                                        log.error(`ERROR7: ${error.stack}`);
                                    });
                                }

                                break;

                            default:
                                index++;
                                callbackEachSeries();
                        }
                    } else {
                        index++;
                        callbackEachSeries();
                    }
                }, function (error) {
                    callback(error);
                });

                // TODO - MAJOR - Should there be a callback() right here?

            } catch (error) {
                // TODO - MAJOR - Should there be a callback() right here?
                console.log(error.stack);
                log.error(`Error in getRelatedContent::processRelatedMedia ${JSON.stringify(error)}`);
            }
        }


        /**
         * For a video content type (not an article content type), get the
         * .m3u8Url
         *
         * @private
         *
         * @param {Object} data
         * A Hyptia response object.
         *
         * @param {Function} callback
         * An async parallel callback function from getRelatedContent()
         */
        function processVideoContentType(data, callback) {
            // TODO - major - this is a mess - should base logic off of data.docs[0].dataSource and type

            if (data.docs[0].cdnUrls && data.docs[0].cdnUrls.hlsVideoURL) {
                data.docs[0].m3u8Url = data.docs[0].cdnUrls.hlsVideoURL;
                callback();
            } else {
                if (data.docs[0].cvpXmlUrl) {
                    self.getVideoUrl(data.docs[0].cvpXmlUrl, data.docs[0].dataSource || 'cnn').then(
                        function success(result) {
                            data.docs[0].m3u8Url = result; // this is needed to play the video
                            data.docs[0].videoURL = result; // this is needed to set the videoURL property in metadata
                            // TODO - minor - The above two lines should be reimagined
                            callback();
                        },
                        function failure(error) {
                            callback(error);
                        }
                    ).catch(function (error) {
                        log.error(`ERROR8: ${JSON.stringify(error)}`);
                    });
                } else {
                    callback();
                }
            }
        }


        return new Promise(function (resolve, reject) {
            async.parallel([
                async.apply(processParagraphs, data),
                async.apply(processRelatedMedia, data),
                async.apply(processVideoContentType, data)
            ], function (error) {
                if (error) {
                    reject(error);
                }

                resolve(data);
            });
        });
    }



    /**
     * Gets the video url by calling the `cvpXmlUrl` and finding the correct
     * .m3u8 url.
     *
     * @function ContentHelper#getVideoUrl
     *
     * @private
     *
     * @param {String} url
     * The url to the video XML file that has details for all of the different
     * video files.
     *
     * @param {String} dataSource
     * Should be a valid dataSource
     *
     * @returns {Promise}
     */
    getVideoUrl(url, dataSource) {
        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                log.debug(`GETTING VIDEO XML: ${url}`);
                request.get({url: url, timeout: timeout}, function (error, response, body) {
                    if (error) {
                        log.error(`Error retrieving ${url}`);
                        done(error);
                    } else {
                        if (body) {
                            parseString(body, {trim: true}, function (err, result) {
                                if (err) {
                                    log.error(`Error parsing video xml: ${url} - ${err}`);
                                    done({message: `Error in getVideoUrl - parsing xml ${url}`});
                                }

                                let m3u8Url,
                                    bitrate = (dataSource === 'cnn') ? 'hls_1080p' : 'ipadFile';

                                log.silly(`DATASOURCE FOR VIDEO XML PARSE IS: ${dataSource}`);
                                if (result && result.video && result.video.files && result.video.files[0].file && result.video.files[0].file.length > 0) {
                                    result.video.files[0].file.some(function (file) {
                                        log.silly(`Comparing file.$.bitrate: ${file.$.bitrate} to bitrate: ${bitrate}`);
                                        if (file.$.bitrate === bitrate) {
                                            log.silly(`MATCH FOUND: ${file._}`);
                                            m3u8Url = file._;
                                            return true;
                                        }
                                    });

                                    log.silly(`RESOLVED m3u8Url: ${m3u8Url}`);
                                    done(null, m3u8Url);
                                } else {
                                    done({message: `${url} is blank or malformed.`});
                                }
                            });
                        } else {
                            log.error(`Error retrieving video xml for: ${url} with body: ${body}`);
                            done({message: 'Error in getVideoUrl'});
                        }
                    }
                });
            }], function (error, result) {
                if (error) {
                    reject(error);
                }

                resolve(result);
            });
        });
    }
}



module.exports = ContentRetriever;
