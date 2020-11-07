const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36';

var requestFilter = { urls: [ "<all_urls>" ] };

const fuckingsCookieName = 'Fuckings-To-The-Internet';

/////////////////////
// For generating consistent randomness
// We get consistent randomness in a time window of ten minutes
//

function simpleHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i);
        h %= 4294967295;
    }
    return h;
}

var LCG=s=>()=>(2**31-1&(s=Math.imul(48271,s)))/2**31;
const date = new Date();

// Decided against using the window.location because some inject code
// to run in about:blank (or another host and get the value back),
// which would make this moot
const hourlySeed = simpleHash(date.toDateString() + date.getHours().toString() + Math.floor(date.getMinutes() / 6).toString());
var hourlyRandom = LCG(hourlySeed);

function randomChars(len) {
    var chars = '';

    while (chars.length < len) {
        chars += Math.random().toString(36).substring(2);
    }

    // Remove unnecessary additional characters.
    return chars.substring(0, len);
}
const generatedFpJsVid = randomChars(20);

// I'm lazy, so sue me
// Not sure what they store there
chrome.webRequest.onBeforeRequest.addListener(
    function() {
        return {cancel: true};
    },
    { urls: ["*://api.sjpf.io/*"] },
    ["blocking"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    var headers = details.requestHeaders;
    const isFingerprint = (details.url.indexOf("fingerprintjs.com/") != -1 || details.url.indexOf("fpjs.io/") != -1 || details.url.indexOf("sjpf.io/") != -1); // lgtm [js/incomplete-url-substring-sanitization]
    for(var i = 0, l = headers.length; i < l; ++i) {
        if( headers[i].name == 'User-Agent' ) {
            headers[i].value = userAgent;
        } else if( headers[i].name == 'Accept-Language' ) {
            headers[i].value = 'en-US,en;q=0.8';
        } else if( headers[i].name == 'Accept' && details.url.indexOf("yahoo.com/") != -1 ) { // lgtm [js/incomplete-url-substring-sanitization]
            headers[i].value = 'application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3';
        } else if( headers[i].name.toLowerCase() == 'cookie') {
            var newHeader = ''
            const cookies = headers[i].value.split(';')

            for (var cookie in cookies) {
                var cookieName = cookies[cookie].split('=')[0].trim()
                if (isFingerprint && cookieName == '_vid') {
                    newHeader += `_vid=` + generatedFpJsVid + `; Max-Age=0;`
                    console.log("replaced vid, old " + cookies[cookie].split('=')[1].trim() + ", new " + generatedFpJsVid);
                } else if (cookieName == fuckingsCookieName) {
                    continue;
                } else if (!isFingerprint) {
                    newHeader += cookies[cookie] + ';';
                }
            }
            headers[i].value = newHeader;
        }
    }

    return {requestHeaders: headers};
}, requestFilter, ['requestHeaders','blocking','extraHeaders']);

var disabledOn = -1;

let disabledIn = new Set();

chrome.webRequest.onHeadersReceived.addListener(function(details) {
    var headers = details.responseHeaders;

    const enabled = (disabledIn.has(details.tabId) || details.tabId === -1) ? 'nofuck' : 'dofuck' + details.tabId;
    if (details.tabId === -1) {
        console.log(details);
    }
    if (details.url.indexOf("sjpf.io") != -1) {
    }

    const isFingerprint = (details.url.indexOf("fingerprintjs.com/") != -1 || details.url.indexOf("fpjs.io/") != -1 || details.url.indexOf("sjpf.io/") != -1); // lgtm [js/incomplete-url-substring-sanitization]

    var hadCookies = false;
    for(var i = 0, l = headers.length; i < l; ++i) {
        if (headers[i].name.toLowerCase() != 'set-cookie') {
            continue
        }

        hadCookies = true;

        var newHeader = ''
        newHeader += `Fuckings-To-The-Internet=${enabled}; Max-Age=0;`
        const cookies = headers[i].value.split(';')

        var alreadyHad = false;
        for (var cookie in cookies) {
            var cookieName = cookies[cookie].split('=')[0].trim()
            if (isFingerprint && cookieName == '_vid') {
                newHeader += `_vid=` + generatedFpJsVid + `; Max-Age=0;`
                console.log("replaced vid, old " + cookies[cookie].split('=')[1].trim() + ", new " + generatedFpJsVid);
            } else if (cookieName == fuckingsCookieName) {
                continue;
            } else if (!isFingerprint) {
                newHeader += cookies[cookie] + ';';
            }
        }

        headers[i].value = newHeader;
    }

    if (!hadCookies) {
        headers.push({
            name: "set-cookie",
            value: `Fuckings-To-The-Internet=${enabled};`
        });
    }
    details.responseHeaders = headers
    return {responseHeaders: headers};
}, requestFilter, ['responseHeaders', 'blocking', 'extraHeaders']);

const canvas = document.createElement('canvas'); // Create the canvas
canvas.width = 16;
canvas.height = 16;

const ctx = canvas.getContext("2d");

var particles = [];
var mouse = {};

function particle() {
    this.speed = {
        x: -2 + Math.random() * 4,
        y: -2 + Math.random() * 4
    };
    this.location = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    this.radius = 1 + Math.random() * 8;
    this.life = 20 + Math.random() * 10;
    this.remaining_life = this.life;

    this.r = 74;
    this.g = 77;
    this.b = 84;
}

const particle_count = 10;
for (var i = 0; i < particle_count; i++) {
    particles.push(new particle());
}


function draw() {
    ctx.globalCompositeOperation = "copy"; // clear the canvas
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.beginPath();
        p.opacity = Math.round(p.remaining_life / p.life * 100) / 100;
        var gradient = ctx.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius);
        p.r = 255;
        p.g = 69;
        p.b = 0;
        gradient.addColorStop(0, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.opacity + ")");
        gradient.addColorStop(0.2, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.opacity + ")");
        gradient.addColorStop(1, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0)");
        ctx.fillStyle = gradient;
        ctx.arc(p.location.x, p.location.y, p.radius, Math.PI * 2, false);
        ctx.fill();

        //lets move the particles
        p.remaining_life--;
        p.radius--;
        p.location.x += p.speed.x;
        p.location.y += p.speed.y;

        //regenerate particles
        if (p.remaining_life < 0 || p.radius < 0) {
            particles[i] = new particle();
        }
    }

    chrome.browserAction.setIcon({
        imageData: ctx.getImageData(0, 0, 16, 16)
    });
}

var interval = null;

function updateIcon(tab) {
    if (disabledIn.has(tab)) {
        if (!interval) {
            interval = setInterval(draw, 66);
        }
    } else {
        if (interval) {
            clearInterval(interval);
            interval = null
            chrome.browserAction.setIcon({
                path: "icon.png"
            });
        }
    }
}

chrome.tabs.onActivated.addListener(function(tab) {
    updateIcon(tab.tabId);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    if (disabledIn.has(tab.id)) {
        disabledIn.delete(tab.id);
    } else {
        disabledIn.add(tab.id);
    }
    updateIcon(tab.id);
});

