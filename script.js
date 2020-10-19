(function() {
    var toInject = 
       // Hurr durr javascript
'(' + function() {

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
const hourlySeed = simpleHash(date.toDateString() + date.getHours().toString() + Math.floor(date.getMinutes() / 6).toString() + fuckingsSeed);
var hourlyRandom = LCG(hourlySeed);


/////////////////////
// Avoid detection of devtools being open
//

var orig_debug = console.debug;
var orig_info = console.info;
var orig_log = console.log;
var orig_warn = console.warn;
var orig_dir = console.dir;

// Devtools tries to do introspection, so defuse these
function checkForProperty(argument, property) {
    var idProperties = Object.getOwnPropertyDescriptor(argument, property);
    // I'm not sure if this is a good idea, but whatever
    if (idProperties !== undefined && 'get' in idProperties && typeof idProperties['get'] === 'function') {
        return true;
    }
    return false;
}

// Avoid timing attacks on the console.* functions
function sleep (dur){
    var t0 = performance.now();
    while(performance.now() < t0 + dur){ /* do nothing */ }
}
var sleepDuration = 1;

function saferPrint(argument, originalFunction) {
    var t0 = performance.now();

    // Defuse the toString() trick
    if (typeof argument === 'object' && argument !== null) {
        if (checkForProperty(argument, 'id') || checkForProperty(argument, 'nodeType')) {
            return;
        }
    } else if (typeof argument === 'string') {
        argument = argument.trim();
    }

    // Just in case there's some other clever tricks, do this every time
    try {
        if (typeof argument === 'object' && argument !== null) {
            var props = Object.getOwnPropertyNames(argument);
            for (var i=0; i<props.length; i++) {
                // yes, we don't do anything with it, we just trigger whatever
                // getter tricks that might be attempted
                var dummy = argument[props[i]]; // lgtm [js/unused-local-variable]
            }
        }

        originalFunction(argument);
    } catch(e) {}

    // Defuse timing attacks
    // By default it will sleep about 1ms, but it adjusts to the time it
    // takes to print to the console
    var t1 = performance.now();
    var duration = t1 - t0;
    sleepDuration = Math.max(sleepDuration, duration);
    sleep(sleepDuration - duration);
}

console.debug = function(argument) { saferPrint(argument, orig_debug); }
console.info = function(argument) { saferPrint(argument, orig_info); }
console.log = function(argument) { saferPrint(argument, orig_log); }
console.warn = function(argument) { saferPrint(argument, orig_warn); }
console.dir = function(argument) { saferPrint(argument, orig_dir); }

// We don't want them to hide stuff from us
console.clear = function() { }

// Just in case
window.console.debug = console.debug;
window.console.info = console.info;
window.console.log = console.log;
window.console.warn = console.warn;
window.console.clear = console.clear;
window.console.dir = console.dir;


// Helper functions to override properties

function setGet(obj, propertyName, func) {
    try {
        Object.defineProperty(obj, propertyName, { get: func });
    } catch (exception) {
        orig_log("Failed to override getter (we probably got ran after the ublock helper): " + exception);
    }
}

// Disable overriding
function setSet(obj, propertyName, func) {
    try {
        Object.defineProperty(obj, propertyName, { set: func });
    } catch (exception) {
        orig_log("Failed to override getter (we probably got ran after the ublock helper): " + exception);
    }
}

function setGetSet(obj, propertyName, getFunc, setFunc) {
    try {
        Object.defineProperty(obj, propertyName, { set: setFunc, get: getFunc });
    } catch (exception) {
        orig_log("Failed to override getter (we probably got ran after the ublock helper): " + exception);
    }
}

/////////////////////
// Disable the latest trick to detect devtools (store time, call 'debugger', check time elapsed)

const debuggerRx = /\bdebugger\b/;
const orig_addEventListener = window.addEventListener;
setGetSet(window, 'addEventListener', () => function(type, listener, options) {
        if (type == 'beforeunload') {
            console.log('denied listener before unload', listener);
            return;
        }

        // TODO: just strip out the debugger statement
        if (debuggerRx.test(listener.toString())) {
            console.log("Debugger in listener, refusing");
            //console.log(listener); don't print it, it could sniff in its toString()
            return;
        }
        return orig_addEventListener(type, listener, options);
    },
    () => function() { console.warn("Tried to override addEventListener!"); }
);

/////////////////////
// Checking outerWidth is what people do to check if the devtools pane is open, so fuck that up
// And while we're at it, fuck up fingerprinting that rely on the window size (some crash with this)
const orig_innerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth')['get']
const orig_innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight')['get']


// Fun fact: this breaks youtube's save button (it doesn't handle floating point window sizes)
const innerWidthRandomness = hourlyRandom()
const innerHeightRandomness = hourlyRandom()
setGet(window, "innerWidth", function () { return orig_innerWidth() + innerWidthRandomness; });
setGet(window, "innerHeight", function () { return orig_innerHeight() + innerHeightRandomness; });

const widthRandomness = hourlyRandom()
const heightRandomness = hourlyRandom()
function fakeWidth() { return window.innerWidth + widthRandomness; }
function fakeHeight() { return window.innerHeight + heightRandomness; }

setGet(window.screen, "availWidth", fakeWidth);
setGet(window.screen, "width", fakeWidth);
setGet(window, "outerWidth", fakeWidth);

setGet(window.screen, "availHeight", fakeHeight);
setGet(window.screen, "height", fakeHeight);
setGet(window, "outerHeight", fakeHeight);


///////////////////////////////
// Kill detection of incognito
try {
const orig_storageEstimate = navigator.storage.estimate;
navigator.storage.estimate = function() {
    const context = this;
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            orig_storageEstimate.call(context).then(function(estimate) {
                estimate.quota = hourlyRandom() * 2500000 + 120000000;
                console.log(estimate);
                resolve(estimate);
            });
        }, hourlyRandom() * 250 + 250); // Kill timing attacks
    });
}
} catch(e) {
    console.log("Failed to override storage estimate: " + e)
}

const orig_webkitRequestFileSystem = window.webkitRequestFileSystem;

window.webkitRequestFileSystem = function(type, size, successCallback, errorCallback) {
    orig_log("Requesting filesystem");
    //orig_log(this);
    //orig_log(arguments);
    //const yes = () => orig_log("is in incognito");
    //const no = () => orig_log("is not in incognito");
    //orig_webkitRequestFileSystem(window.TEMPORARY, 100, not, yes);
    orig_webkitRequestFileSystem(type, 100, successCallback, errorCallback);
    //orig_webkitRequestFileSystem(window.TEMPORARY, 100, successCallback, errorCallback);
}

//const orig_requestFileSystem = window.requestFileSystem;
//window.requestFileSystem = function(type, size, successCallback, errorCallback) {
//    orig_log("Requesting filesystem old");
//    orig_log(this);
//    orig_log(arguments);
//
//    const yes = () => orig_log("is in incognito");
//    const no = () => orig_log("is not in incognito");
//    orig_requestFileSystem.call(window.TEMPORARY, 10485760, successCallback, errorCallback);
//    //return orig_requestFileSystem(type, size, successCallback, errorCallback);
//}

orig_log("devtools detect stuff overriden")

////////////////////////////////////////////
////////////////////////// end actual script
////////////////////////////////////////////
} + ')();' ;


// Create temporary element
var element = document.createElement('script');
element.textContent = toInject
element.async = false


// Inject and then delete
document.documentElement.insertBefore(element, document.documentElement.firstElement)
if (element.parentNode) {
    element.parentNode.removeChild(element);
}

})();
