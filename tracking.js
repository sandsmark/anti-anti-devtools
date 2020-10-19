
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36';

/// Only way to communicate between the background script and content script apparently
function getCookie(cookie) { // https://stackoverflow.com/a/19971550/934239
  return document.cookie.split(';').reduce(function(prev, c) {
    var arr = c.split('=');
    return (arr[0].trim() === cookie) ? arr[1] : prev;
  }, undefined);
}

function delete_cookie( name ) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + location.host + ";";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + location.host + "; path=/";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=' + location.pathname + '; domain=' + location.host + ";";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=' + location.pathname + ";";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
}

const fuckingsCookieName = 'Fuckings-To-The-Internet';

const fuckingsSeed = getCookie(fuckingsCookieName);
const enabled = fuckingsSeed !== 'nofuck';
delete_cookie(fuckingsCookieName);

if (!enabled) {
    console.warn('anti-devtools disabled in this tab');
    return;
}

                                                                                                                                           /// we _want_ it to be trigger happy
const isFingerprint = (window.location.hostname.indexOf("fingerprintjs.com") != -1 || window.location.hostname.indexOf("fpjs.io") != -1 || window.location.hostname.indexOf("sjpf.io") != -1); // lgtm [js/incomplete-url-substring-sanitization]
if (isFingerprint) {
    console.log("is fingerprinting");
    localStorage.removeItem('_vid');
    sessionStorage.removeItem('_vid');
    delete_cookie('_vid');
}

//////////////////////////////////////////////
////////////////////////// begin actual script
//////////////////////////////////////////////


function setProp(obj, propertyName, val) {
    setGet(obj, propertyName, () => val);
}

/////////////////////
// Defuse a bunch of dumb APIs
Navigator.prototype.getBattery = () => {};

window.devicePixelRatio = 1;
window.screen = {};
window.screen.colorDepth = 24;
navigator.doNotTrack = undefined;


/////////////////////
// Audio stuff is used for fingerprinting, just disable the whole thing
window.OfflineAudioContext = undefined;
setProp(AudioContext.prototype, 'baseLatency', 0);
setProp(AudioContext.prototype, 'outputLatency', 0);

const orig_getFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
var hourlyGFDRandom = LCG(hourlySeed);
AnalyserNode.prototype.getFloatFrequencyData = function() {
    var ret = orig_getFloatFrequencyData.apply(this, arguments)
    for (let i = 0; i < arguments[0].length; i++) {
        arguments[0][i] *= hourlyGFDRandom()/10 + 0.9;
    }
    return ret;
}

const orig_getByteFrequencyData = AnalyserNode.prototype.getByteFrequencyData;
var hourlyGBDRandom = LCG(hourlySeed);
AnalyserNode.prototype.getByteFrequencyData = function() {
    var ret = orig_getByteFrequencyData.apply(this, arguments)
    for (let i = 0; i < arguments[0].length; i++) {
        arguments[0][i] *= hourlyGBDRandom() / 10 + 0.9;
    }
    return ret;
}

const orig_getFloatTimeDomainData = AnalyserNode.prototype.getFloatTimeDomainData;
var hourlyGFTDDRandom = LCG(hourlySeed);
AnalyserNode.prototype.getFloatTimeDomainData = function() {
    var ret = orig_getFloatTimeDomainData.apply(this, arguments)
    for (let i = 0; i < arguments[0].length; i++) {
        arguments[0][i] *= hourlyGFTDDRandom()/10 + 0.9;
    }
    return ret;
}

const orig_getByteTimeDomainData = AnalyserNode.prototype.getByteTimeDomainData;
var hourlyGBTDDRandom = LCG(hourlySeed);
AnalyserNode.prototype.getByteTimeDomainData = function() {
    var ret = orig_getByteTimeDomainData.apply(this, arguments)
    if (!ret) {
        return ret;
    }
    for (let i = 0; i < arguments[0].length; i++) {
        arguments[0][i] *= hourlyGBTDDRandom()/10 + 0.9;
    }
    return ret;
}

Object.defineProperty(webkitSpeechRecognition.prototype, 'onresult', {
        set: function() { orig_log("tried to do speech recognition");  }
    }
)

/////////////////////
// Anonymize a bunch of properties

/////////////////////
// Beacons are dumb
const orig_sendBeacon = Navigator.prototype.sendBeacon;
Navigator.prototype.sendBeacon = function(url, data) {
    console.log("Intercepted beacon to '" + url + "' with data '" + data + "'");

    // Generate and send completely random bytes as a string
    // not the most efficient, but lol
    var gurba = '';
    for (var i=0; i<4096; i++) {
        gurba += String.fromCharCode(Math.random() * 255);
    }

    orig_sendBeacon.call(this, url, gurba);

    return true;
}
//    return true;
navigator.sendBeacon.toString = () => "sendBeacon() { [native code] }";

////////////////////
// Generally dumb shit

setProp(NetworkInformation.prototype, 'downlink',  1000);
setProp(NetworkInformation.prototype, 'effectiveType',  '4g');
setProp(NetworkInformation.prototype, 'rtt',  0);
setProp(NetworkInformation.prototype, 'saveData',  true);

setProp(NetworkInformation.prototype, 'downlink',  1000);

if (navigator.credentials) {
    setProp(navigator.credentials, 'get', function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                reject();
            }, 300);
        });
    });
} else {
    orig_log("Credentials not available for site");
}

setProp(navigator, 'hardwareConcurrency', 1);

setProp(navigator, 'userAgent', userAgent);
setProp(navigator, 'languages', ['en-US', 'en-GB', 'en']);
setProp(navigator, 'platform', 'Win64');
setProp(document, 'referrer', location.protocol + '://' + location.hostname);
setProp(navigator, 'appVersion', '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36');

setProp(UserActivation.prototype, 'isActive', false);
setProp(UserActivation.prototype, 'hasBeenActive', false);


/////////////////////
// Don't allow locking the keyboard
try {
    Keyboard.prototype.lock = function(keys) {
        console.log("Tried to lock keyboard: " + keys)
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve();
            }, 300);
        });
    }
} catch(e) {
    console.log("Failed to override keyboard locking: " + e);
}



//const orig_registerServiceWorker = navigator.serviceWorker.register;
setGetSet(navigator.serviceWorker, 'register', () => function() {
        orig_log("Tried to register service worker");
        console.log(arguments)
        return new Promise(function(resolve, reject) { });
        //return orig_registerServiceWorker (type, listener, options);
    },
    () => function() {orig_log("Tried to set serviceWorker.register!"); }
);

///////////////////////////////////
// Nuke the 'are you sure you want to leave' if I haven't interacted with the page
var hasInteracted = false;
window.addEventListener('click', function() { hasInteracted = true; } , true);

var warnUnload = false;
Window.prototype.onBeforeUnload = function(e) {
    if (hasInteracted && warnUnload) {
        orig_log('has interacted, allowing warning about unloading page');
        return 'Allow warning';
    }
};

setSet(Window.prototype, onBeforeUnload, function(callback) {
    const result = callback();
    if (result && result != "") {
        console.log(callback);
        console.warn("Warning because of result: " + result);
        warnUnload = true;
    }
})


/////////////////////
// Protect clipboard

// TODO: return promise that sends request to background script
// which shows a popup for each request.
try {
    const orig_clipboardRead = navigator.clipboard.read;
    navigator.clipboard.read = function() {
        console.log("Clipboard read");
        console.log(this);
        console.log(arguments);
        orig_clipboardRead.apply(this, arguments);

        //return new Promise() {
        //    setTimeout(function() {
        //        resolve('foo');
        //    }, 300);
        //}
    }
} catch(e) {
    console.log("Failed to override clipboard read: " + e);
}

try {
    const orig_clipboardReadText = navigator.clipboard.readText;
    navigator.clipboard.readText = function() {
        console.log("Clipboard read text");
        console.log(this);
        console.log(arguments);
        orig_clipboardReadText.apply(this, arguments);

        //return new Promise() {
        //    setTimeout(function() {
        //        resolve('foo');
        //    }, 300);
        //}
    }
} catch(e) {
    console.log("Failed to override clipboard readtext: " + e);
}

try {
    const orig_clipboardWrite = navigator.clipboard.write;
    navigator.clipboard.write = function(content) {
        console.log("Clipboard write");
        console.log(this);
        console.log(arguments);
        const context = this;
        sleep(500);
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                orig_clipboardWrite.call(context, content).then(function() {
                    resolve();
                });
            }, hourlyRandom() * 250 + 250);// stop tricks with quickly replacing clipboard contents
        });
    }
} catch(e) {
    console.log("Failed to override clipboard write: " + e);
}

try {
    const orig_clipboardWriteText = navigator.clipboard.writeText;
    navigator.clipboard.writeText = function(text) {
        console.log("Clipboard write text");
        console.log(this);
        console.log(arguments);
        sleep(500);
        const context = this;
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                orig_clipboardWriteText.call(context, text).then(function() {
                    resolve();
                });
            }, hourlyRandom() * 250 + 250);// stop tricks with quickly replacing clipboard contents, this will make sure they are replaced in the wrong order (probably), or at least delayed
        });
    }
} catch(e) {
    console.log("Failed to override clipboard writetext: " + e);
}

const orig_execCommand = document.execCommand
setProp(document.execCommand, function()
{
    var isCopy = false;
    var isCut = false;
    var isPaste = false;
    for (var i=0; i<arguments.length; i++) {
        if (arguments[i] == "copy") {
            isCopy = true;
            continue;
        }
        if (arguments[i] == "cut") {
            isCut = true;
            continue;
        }
        if (arguments[i] == "paste") {
            isPaste = true;
            continue;
        }
    }
    if (isCopy) {
        orig_log("is copy");
        sleep(hourlyRandom() * 250 + 250);
        const ret = orig_execCommand.apply(this, arguments)
        console.log(ret);
        //return ret;
    }
    if (isCut) {
        orig_log("is cut");
        sleep(hourlyRandom() * 250 + 250);
        const ret = orig_execCommand.apply(this, arguments)
        console.log(ret);
        //return ret;
    }
    if (isPaste) {
        orig_log("is paste");
        //const ret = orig_execCommand.apply(this, arguments)
        return false;
    }
    console.log(arguments); console.log(this);
    const ret = orig_execCommand.apply(this, arguments)
    orig_log("was not clipboard");
    console.log(ret);
    return ret;
});


//////////////////////////
// Date time anonymization

const orig_resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
Intl.DateTimeFormat.prototype.resolvedOptions = function() {
    var ret = orig_resolvedOptions.apply(this, arguments)
    ret.timeZone = "UTC"
    return ret
}
Date.prototype.getTimezoneOffset = function() { return 0; }


///////////////
// Kill crypto

function dumpBuf(result) {
    var buf = new Int8Array(result)
    var decoded = ""
    var valid = true
    for (var i=0; i<Math.min(buf.length, 1024); i++) {
        if ((buf[i] < 32 || buf[i] > 126) && buf[i] != 9 && buf[i] != 10 && buf[i] != 13) {
            decoded += "\\x" + buf[i].toString(16)
            valid = false;
            continue;
        }

        decoded += String.fromCharCode(buf[i])
    }

    console.log(decoded)
    if (!valid) {
        console.log(result)
    }
}

//const orig_random = Crypto.prototype.getRandomValues
var notRandomArrayValue = 0
Crypto.prototype.getRandomValues = function(arr) {
    for (var i=0; i<arr.length; i++) {
        arr[i] = notRandomArrayValue++
    }
    return arr;
}

const orig_decrypt = SubtleCrypto.prototype.decrypt
SubtleCrypto.prototype.decrypt = function(algorithm, key, data) {
    var crypt = this
    return new Promise(function(resolve, reject) {
        orig_decrypt.call(crypt, algorithm, key, data).then(
            function(result) {
                orig_log("decrypted")
                dumpBuf(result)
                resolve(result);
            }
        )
    });
}
const orig_encrypt = SubtleCrypto.prototype.encrypt
SubtleCrypto.prototype.encrypt = function(algorithm, key, data) {
    orig_log("encrypting")
    dumpBuf(data)
    var crypt = this
    return new Promise(function(resolve, reject) {
        orig_encrypt.call(crypt, algorithm, key, data).then(
            function(result) {
                resolve(result);
            }
        )
    });
}

SubtleCrypto.prototype.verify = function(algorithm, key, signature, data) {
    console.log("Trying to verify some shit, alg " + algorithm.name + " hash name " + algorithm.hash.name);
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            orig_log("Of course it's ok, you can trust the client")
            resolve(true);
        }, 1000);
    });
}

/////////////////////
// Since noone seem to get canvas fingerprinting avoidance right, do it ourselves
// We need to get consistent noise for each instance,
// which is one way fingerprinting code detects other anti-canvas
// fingerprinting extensions
const shift = {
    'r': Math.floor(hourlyRandom() * 10) - 5,
    'g': Math.floor(hourlyRandom() * 10) - 5,
    'b': Math.floor(hourlyRandom() * 10) - 5,
    'a': Math.floor(hourlyRandom() * 10) - 5
};

function garbleImage(image, width, height) {
    for (let row = 0; row < height; row += 3) {
        for (let col = 0; col < width; col += 3) {
            const index = ((row * (width * 4)) + (col * 4));
            image.data[index + 0] = image.data[index + 0] + shift.r;
            image.data[index + 1] = image.data[index + 1] + shift.g;
            image.data[index + 2] = image.data[index + 2] + shift.b;
            image.data[index + 3] = image.data[index + 3] + shift.a;
        }
    }
}
const orig_getImageData = CanvasRenderingContext2D.prototype.getImageData;

// to make sure the js never sees that we fuck with it,
// we restore the contents after generating whatever it wants
// Other extensions that try to break canvas fingerprinting are
// detected because the fingerprinting code makes sure the canvas
// content doesn't get modified
var canvasContentBackup

function garbleCanvas(canvas) {
    const {width, height} = canvas;
    const context = canvas.getContext('2d');
    const image = orig_getImageData.call(context, 0, 0, width, height);

    // not sure if we need to do this, or if we can reuse the image,
    // but javascript is slow crap anyways so fuck performance
    canvasContentBackup = orig_getImageData.call(context, 0, 0, width, height);
    garbleImage(image, width, height);

    context.putImageData(image, 0, 0);
}

function ungarbleCanvas(canvas) {
    const context = canvas.getContext('2d');
    context.putImageData(canvasContentBackup, 0, 0);
    canvasContentBackup = undefined;
}

const orig_toBlob = HTMLCanvasElement.prototype.toBlob;
Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function() {
        garbleCanvas(this);
        const ret = orig_toBlob.apply(this, arguments);
        ungarbleCanvas(this);
        return ret;
    }
});

const orig_toDataURL = HTMLCanvasElement.prototype.toDataURL;
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: function() {
        garbleCanvas(this);
        const ret = orig_toDataURL.apply(this, arguments);
        ungarbleCanvas(this);
        return ret;
    }
});

Object.defineProperty(CanvasRenderingContext2D.prototype, 'getImageData', {
    value: function() {
        var ret = orig_getImageData.apply(this, arguments);
        garbleImage(ret, this.canvas.width, this.canvas.height);
        return ret;
    }
});


/////////////////////
// fucking webgl is hard to get rid of
delete window.WebGLActiveInfo;
delete window.WebGLBuffer;
delete window.WebGLContextEvent;
delete window.WebGLFramebuffer;
delete window.WebGLProgram;
delete window.WebGLQuery;
delete window.WebGLRenderbuffer;
delete window.WebGLSampler;
delete window.WebGLShader;
delete window.WebGLShaderPrecisionFormat;
delete window.WebGLSync;
delete window.WebGLTexture;
delete window.WebGLTransformFeedback;
delete window.WebGLUniformLocation;
delete window.WebGLVertexArrayObject;

const glVendors = [
    'Microsoft',
    'NVIDIA Corporation',
    'Intel Open Source Technology Center',
    'Google Inc.',
    'Intel Inc.',
    'Brian Paul',
    'Apple Inc.',
    'ATI Technologies Inc.'

]

// Some others I haven't bothered find out where belongs
// Gallium 0.4 on NVE7
// Intel(R) HD Graphics
// ATI Radeon HD Verde XT Prototype OpenGL Engine
const glRenderers = {
    'Microsoft': ['Microsoft Basic Render Driver'],
    'Brian Paul': ['Brian Paul'],
    'NVIDIA Corporation': [
        'NVIDIA GeForce GT 650M OpenGL Engine',
        'NVIDIA GeForce GTX 775M OpenGL Engine',
        'NVIDIA GeForce GT 625 (OEM)'
    ],
    'Apple Inc.': [
        'Apple A9 GPU',
        'PowerVR SGX 535',
        'PowerVR SGX 543'
    ],
    'Intel Inc.': [
        'Intel Iris Pro OpenGL Engine'
    ],
    'Intel Open Source Technology Center': [
        'Mesa DRI Intel(R) HD Graphics 630 (Kaby Lake GT2)',
        'Mesa DRI Intel(R) Iris 6100 (Broadwell GT3)',
        'Mesa DRI Intel(R) HD Graphics 520 (Skylake GT2)',
        'Mesa DRI Intel(R) HD Graphics 615 (Kaby Lake GT2)',
        'Mesa DRI Intel(R) Iris 6100 (Broadwell GT3)'
    ],
    'Google Inc.': [
        'ANGLE (Intel(R) HD Graphics 4600 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce GTX 770 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)',
        'ANGLE (NVIDIA GeForce GTX 950 Direct3D9Ex vs_3_0 ps_3_0)',
        'ANGLE (Intel(R) HD Graphics 4600 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics Family Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 4600 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce GTX 960 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics Family Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 5300 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (ATI Radeon HD 3450 Direct3D9Ex vs_3_0 ps_3_0)',
        'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 4600 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 3000 Direct3D11 vs_4_1 ps_4_1)',
        'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA GeForce GT 750M Direct3D11 vs_5_0 ps_5_0',
        'ANGLE (Intel(R) HD Graphics P4600/P4700 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) G45/G43 Express Chipset (Microsoft Corporation - WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)',
        'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)',
        'ANGLE (Intel(R) HD Graphics 520 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 5500 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0)',
        'Google SwiftShader'
    ],
    'ATI Technologies Inc.': [
        'AMD Radeon Pro 460 OpenGL Engine',
        'AMD Radeon R9 M370X OpenGL Engine',
    ]
};

const glVendor = glVendors[Math.floor(hourlyRandom() * glVendors.length)]
const glRenderer = glRenderers[glVendor][Math.floor(hourlyRandom() * glRenderers[glVendor].length)]

const orig_gl2GetGetExtension = WebGL2RenderingContext.prototype.getExtension;
const orig_gl2GetParameter = WebGL2RenderingContext.prototype.getParameter;
Object.defineProperty(WebGL2RenderingContext.prototype, 'getParameter', {
    value: function(name) {
        const debugInfo = orig_gl2GetGetExtension.call(this, 'WEBGL_debug_renderer_info');
        if (name == debugInfo.UNMASKED_VENDOR_WEBGL) {
            return glVendor;
        }
        if (name == debugInfo.UNMASKED_RENDERER_WEBGL) {
            return glRenderer;
        }
        return orig_gl2GetParameter.apply(this, arguments);
    }
});

//Object.defineProperty(WebGL2RenderingContext.prototype, 'getExtension', {
//    value: function(prop) {
//        console.log(prop)
//        return orig_gl2GetGetExtension.apply(this, arguments);
//    }
//});


const orig_glGetGetExtension = WebGLRenderingContext.prototype.getExtension;
const orig_glGetParameter = WebGLRenderingContext.prototype.getParameter;
Object.defineProperty(WebGLRenderingContext.prototype, 'getParameter', {
    value: function(name) {
        const debugInfo = orig_glGetGetExtension.call(this, 'WEBGL_debug_renderer_info');
        if (name == debugInfo.UNMASKED_VENDOR_WEBGL) {
            return glVendor;
        }
        if (name == debugInfo.UNMASKED_RENDERER_WEBGL) {
            return glRenderer;
        }
        return orig_glGetParameter.apply(this, arguments);
    }
});

//Object.defineProperty(WebGLRenderingContext.prototype, 'getExtension', {
//    value: function(name) {
//        console.log("getExtension, " + name)
//        return orig_glGetGetExtension.apply(this, arguments);
//    }
//});


function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}

                                                                   /// we _want_ it to be trigger happy
if (window.location.hostname.indexOf("slideshare.net") != -1) { // lgtm [js/incomplete-url-substring-sanitization]
    setTimeout(function() {
        addStyleString(".large-8 { width: 100%; }")
        orig_log("fixed slideshare css")
    }, 100);
}

if (window.location.hostname.indexOf("slack.com") != -1) { // lgtm [js/incomplete-url-substring-sanitization]
    var observer = new MutationObserver(function(mutationList) {
        for (var mutation of mutationList) {
            for (var child of mutation.addedNodes) {
                if (!child.className) {
                    continue;
                }
                if (child.className === 'p-client p-client--ia-top-nav') {
                    child.style.gridTemplateRows = '0px auto min-content';
                    orig_log("fixed slack topbar")

                    observer.disconnect();
                }
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});
}
