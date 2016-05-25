'use strict';


/**
 * @module Configuration
 *
 * @description
 * Configuration for this application.  Order of precedence is:
 * - Environment Variables
 * - Command line arguments
 * - `config` object values
 * - Overrides (which are defined in `config['default']`)
 */


const nconf = require('nconf'),
    packageConfig = require('./package');

let environment,
    port,
    config;


/**
 * The `config` object that is the core of the configration is an object that
 * contains a `default` property and a property for each environment that needs
 * to have different configuration values.  Each one of these properties should
 * set the following properties collectively.
 *
 * @typedef configEnvironment
 *
 * @type {Object}
 *
 * @property {?Object} logConfig
 * @property {Object} logConfig.loggly
 * @property {String} logConfig.loggly.tag
 * The tag to use for log events that are sent to loggly
 *
 * @property {String} name=package.name
 * The name of the application.  The default is the name set in `package.json`.
 */
config = {
    'default': {
        hypatiaQuery: 'http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:', // TODO - remove
        hypatia: {
            host: `http://${process.env.HYPATIA_HOST || 'ref.hypatia.services.dmtio.net'}/`,
            queryPrefix: 'svc/content/v2/search/collection1/'
        },
        fbiaConfig: {
            'noVideos':  0,
            'embedVideos':  0,
            'removeRelateds':  1,
            'preferredVideo': 'ios_1240',
            'videoCDN': 'http://ht3.cdn.turner.com/cnn/big',
            'preferredImage': 'exlarge16to9',
            'secondaryPreferredImage': 'large16to9',
            'galleryPreferredImage': 'large16to9',
            'inStoryImage': 'medium16to9', //mediumplus16to9
            'imageCDN': 'http://i2.cdn.turner.com/cnnnext/dam/assets',
            'contentHost': 'http://www.cnn.com',
            'app': {
                'clientId': 261103117574353,
                'clientSecret': 'e2d8614a1afe8c81aacb659dbf6d1f24',
                'shortTermToken':'EAADteM6SoNEBALyNHbSoSmVtzFSMM444M9lZBSMZA8pNViFsCgWu52KpM9LlGehxWG2DLZCOyG1jfNcIDjPd2V9kYyhbUn3fjs7PtZBAAKlEMAlE325gZBNOS2eUJc9IezlNzO2pUiPHG6zdklZCAkE37UInFs7hstmKRHSeY5LwZDZD'
            },
            'ads': {
                'us': 'us',
                'justice': 'us/justice',
                'world': 'world',
                'politics': 'politics',
                'opinions': 'opinion',
                'health': 'health',
                'entertainment': 'entertainment',
                'tech': 'technology',
                'style': 'stlye',
                'arts': 'style/arts',
                'auto': 'style/autos',
                'architecture': 'style/architectur',
                'design': 'style/design',
                'luxury': 'style/luxury',
                'fashion': 'style/fashion',
                'travel': 'travel',
                'food-and-drink': 'travel/food-and-drink',
                'aviation': 'travel/aviation',
                'hotels': 'travel/hotels',
                'world': 'world',
                'asia': 'world/asia',
                'africa': 'world/africa',
                'americas': 'world/americas',
                'middle-east': 'world/middle-east',
                'europe': 'world/europe',
                'china': 'world/china',
                'world-sport': 'world/world-sport',
                'tv': 'video/tv'
            }
        },
        lsdHosts: 'lsd-dev-56m.gslb.vgtf.net',
        name: packageConfig.name,
        ocsQuery: 'http://www.cnn.com/data/ocs/section/index.html:homepage1-zone-1.json',
        requestTimeout: 1000 * 10,    // 1 second
        taskInterval: (process.env.TASK_INTERVAL > 0) ? 1000 * process.env.TASK_INTERVAL : 1000 * 60,    // 1 minute default
        useArticleHeadlines: true
    },
    prod: {
        hypatiaQuery: 'http://hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:', // TODO - remove
        hypatia: {
            host: 'http://hypatia.services.dmtio.net/'
        },
        logConfig: (typeof process.env.CUSTOMER === 'undefined') ? null : {
            loggly: {
                tag: `${packageConfig.name}-${process.env.ENVIRONMENT}`
            }
        },
        lsdHosts: 'lsd-prod-pub-cop.turner.com,lsd-prod-pub-56m.turner.com'
    }
};


// process environment variables and command line arguments
nconf.env().argv();


// make sure we have an environment set or die
environment = nconf.get('ENVIRONMENT');
port = nconf.get('PORT');

if (typeof environment === 'undefined' || typeof port === 'undefined') {
    console.error(`ENVIRONMENT and/or PORT are not set. Shutting down.  ENVIRONMENT: ${environment} - PORT: ${port}`);
    process.exit(1);
}


// load the correct config based on environment
switch (environment.toLowerCase()) {
    case 'prod':
        nconf.defaults(config.prod);
        break;

    default:
        nconf.defaults(config.default);
}


/*
 * Load overrides that don't actually override anything, they just fill in the
 * blanks.
 */
nconf.overrides(config.default);


module.exports = nconf;
