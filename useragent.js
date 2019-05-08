var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';

var requestFilter = { urls: [ "<all_urls>" ] };

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    var headers = details.requestHeaders;
    for(var i = 0, l = headers.length; i < l; ++i) {
        if( headers[i].name == 'User-Agent' ) {
            headers[i].value = userAgent;
        } else if( headers[i].name == 'Accept-Language' ) {
            headers[i].value = 'en-US,en;q=0.8';
        }
    }
    return {requestHeaders: headers};
}, requestFilter, ['requestHeaders','blocking','extraHeaders']);

