var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36';

var requestFilter = { urls: [ "<all_urls>" ] };

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    var headers = details.requestHeaders;
    for(var i = 0, l = headers.length; i < l; ++i) {
        if( headers[i].name == 'User-Agent' ) {
            headers[i].value = userAgent;
        } else if( headers[i].name == 'Accept-Language' ) {
            headers[i].value = 'en-US,en;q=0.8';
        } else if( headers[i].name == 'Accept' && details.url.indexOf("yahoo.com/") != -1 ) {
            headers[i].value = 'accept: application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3';
        }
    }
    return {requestHeaders: headers};
}, requestFilter, ['requestHeaders','blocking','extraHeaders']);

var disabledOn = -1;

chrome.webRequest.onHeadersReceived.addListener(function(details) {
    console.log('tab:' + details.tabId)
    var headers = details.responseHeaders;

    const enabled = (disabledOn === -1 || details.tabId !== disabledOn) ? 'dofuck' : 'nofuck'; 

    for(var i = 0, l = headers.length; i < l; ++i) {
        if (headers[i].name.toLowerCase() != 'set-cookie') {
            continue
        }

        var cookieName = headers[i].value.split('=')[0]
        if (cookieName.toLowerCase() != 'Fuckings-To-The-Internet') {
            continue;
        }
        // idk if this is necessary, since we always get ours last, but just in case
        headers[i].value = `Fuckings-To-The-Internet=${enabled}; Max-Age=0;`
    }
    headers.push({
        name: "set-cookie",
        value: `Fuckings-To-The-Internet=${enabled};`
    });
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
        p.opacity = Math.round(p.remaining_life / p.life * 100) / 100
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

chrome.tabs.onActivated.addListener(function(tab) {
    if (disabledOn === -1) {
        return
    }
})

chrome.browserAction.onClicked.addListener(function(tab) {
    console.log("clicked on: " + tab.id)
    if (interval) {
        disabledOn = -1
        clearInterval(interval);
        interval = null
        chrome.browserAction.setIcon({
            path: "icon.png"
        });
    } else {
        disabledOn = tab.id
        interval = setInterval(draw, 66);
    }
});

