(function() {
    var toInject = 
       // Hurr durr javascript
    '(' + function() {

        /////////////////////
        // For generating consistent randomness
        // We get consistent randomness in a time window of ten minutes
        //

        function simpleHash(str) {
            var h = 0
            for (var i = 0; i < str.length; i++) {
                h = Math.imul(31, h) + str.charCodeAt(i);
                h %= 4294967295
            }
            return h
        }

        var LCG=s=>()=>(2**31-1&(s=Math.imul(48271,s)))/2**31;
        const date = new Date()

        // Decided against using the window.location because some inject code
        // to run in about:blank (or another host and get the value back),
        // which would make this moot
        const hourlySeed = simpleHash(/*window.location.hostname + */ date.toDateString() + date.getHours().toString() + Math.floor(date.getMinutes() / 6).toString())
        var hourlyRandom = LCG(hourlySeed)


        /////////////////////
        // Avoid detection of devtools being open
        //

        var orig_debug = console.debug
        var orig_info = console.info
        var orig_log = console.log
        var orig_warn = console.warn
        var orig_dir = console.warn

        // Devtools tries to do introspection, so defuse these
        function checkForProperty(argument, property) {
            var idProperties = Object.getOwnPropertyDescriptor(argument, property)
            // I'm not sure if this is a good idea, but whatever
            if (idProperties !== undefined && 'get' in idProperties && typeof idProperties['get'] === 'function') {
                return true
            }
            return false
        }

        // Avoid timing attacks on the console.* functions
        function sleep (dur){
            var t0 = performance.now();
            while(performance.now() < t0 + dur){ /* do nothing */ }
        }
        var sleepDuration = 1

        function saferPrint(argument, originalFunction) {
            var t0 = performance.now();

            // Defuse the toString() trick
            if (typeof argument === 'object' && argument !== null) {
                if (checkForProperty(argument, 'id') || checkForProperty(argument, 'nodeType')) {
                    return
                }
            } else if (typeof argument === 'string') {
                argument = argument.trim()
            }

            // Just in case there's some other clever tricks, do this every time
            try {
                if (typeof argument === 'object' && argument !== null) {
                    var props = Object.getOwnPropertyNames(argument)
                    for (var i=0; i<props.length; i++) {
                        var dummy = argument[props[i]]
                    }
                }

                originalFunction(argument)
            } catch(e) {}

            // Defuse timing attacks
            // By default it will sleep about 1ms, but it adjusts to the time it
            // takes to print to the console
            var t1 = performance.now();
            var duration = t1 - t0
            sleepDuration = Math.max(sleepDuration, duration)
            sleep(sleepDuration - duration)
        }

        console.debug = function(argument) { saferPrint(argument, orig_debug) }
        console.info = function(argument) { saferPrint(argument, orig_info) }
        console.log = function(argument) { saferPrint(argument, orig_log) }
        console.warn = function(argument) { saferPrint(argument, orig_warn) }
        console.dir = function(argument) { saferPrint(argument, orig_dir) }

        // We don't want them to hide stuff from us
        console.clear = function() { }

        // Just in case
        window.console.debug = console.debug
        window.console.info = console.info
        window.console.log = console.log
        window.console.warn = console.warn
        window.console.clear = console.clear
        window.console.dir = console.dir


        /////////////////////
        // Defuse a bunch of dumb APIs
        navigator.getBattery = function() { return undefined; }
        window.devicePixelRatio = 1
        window.screen = {}
        window.screen.colorDepth = 24
        navigator.doNotTrack = undefined


        /////////////////////
        // Audio stuff is used for fingerprinting, just disable the whole thing
        window.OfflineAudioContext = undefined
        window.AudioContext = undefined


        /////////////////////
        // Anonymize a bunch of properties
        function setGet(obj, propertyName, func) {
            try {
                Object.defineProperty(obj, propertyName, { get: func })
            } catch (exception) {
                console.log("Failed to override getter (we probably got ran after the ublock helper): " + exception)
            }
        }

        function setVal(obj, propertyName, func) {
            try {
                Object.defineProperty(obj, propertyName, { value: func })
            } catch (exception) {
                console.log("Failed to override value: " + exception)
            }
        }

        /////////////////////
        // Beacons are dumb
        setGet(navigator, 'sendBeacon', function(url, data) { console.log("Intercepted beacon to '" + url + "' with data '" + data + "'"); return true; })


        function setProp(obj, propertyName, val) {
            setGet(obj, propertyName, () => val)
        }

        setProp(navigator, 'hardwareConcurrency', 1)
        setProp(navigator, 'connection', undefined)
        setProp(navigator, 'userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.38 Safari/537.36')
        setProp(navigator, 'languages', ['en-US', 'en'])
        setProp(navigator, 'platform', 'Win64')
        setProp(document, 'referrer', 'fuckyou')
        setProp(navigator, 'appVersion', '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36')

        Date.prototype.getTimezoneOffset = function() { return 0; }


        /////////////////////
        // Checking outerWidth is what people do to check if the devtools pane is open, so fuck that up
        // And while we're at it, fuck up fingerprinting that rely on the window size (some crash with this)
        function fakeWidth() { return window.innerWidth + hourlyRandom(); }
        function fakeHeight() { return window.innerHeight + hourlyRandom(); }

        setGet(window.screen, "availWidth", fakeWidth);
        setGet(window.screen, "width", fakeWidth);
        setGet(window, "outerWidth", fakeWidth);

        setGet(window.screen, "availHeight", fakeHeight);
        setGet(window.screen, "height", fakeHeight);
        setGet(window, "outerHeight", fakeHeight);

        /////////////////////
        // fucking webgl is hard to get rid of
        delete window.WebGL2RenderingContext
        delete window.WebGLActiveInfo
        delete window.WebGLBuffer
        delete window.WebGLContextEvent
        delete window.WebGLFramebuffer
        delete window.WebGLProgram
        delete window.WebGLQuery
        delete window.WebGLRenderbuffer
        delete window.WebGLRenderingContext
        delete window.WebGLSampler
        delete window.WebGLShader
        delete window.WebGLShaderPrecisionFormat
        delete window.WebGLSync
        delete window.WebGLTexture
        delete window.WebGLTransformFeedback
        delete window.WebGLUniformLocation
        delete window.WebGLVertexArrayObject


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
            const {width, height} = canvas
            const context = canvas.getContext('2d')
            const image = orig_getImageData.call(context, 0, 0, width, height)

            // not sure if we need to do this, or if we can reuse the image,
            // but javascript is slow crap anyways so fuck performance
            canvasContentBackup = orig_getImageData.call(context, 0, 0, width, height)
            garbleImage(image, width, height)

            context.putImageData(image, 0, 0);
        }

        function ungarbleCanvas(canvas) {
            const context = canvas.getContext('2d');
            context.putImageData(canvasContentBackup, 0, 0);
            canvasContentBackup = undefined
        }

        const orig_toBlob = HTMLCanvasElement.prototype.toBlob;
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function() {
                garbleCanvas(this)
                const ret = orig_toBlob.apply(this, arguments)
                ungarbleCanvas(this)
                return ret
            }
        });

        const orig_toDataURL = HTMLCanvasElement.prototype.toDataURL;
        Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
            value: function() {
                garbleCanvas(this)
                const ret = orig_toDataURL.apply(this, arguments);
                ungarbleCanvas(this)
                return ret
            }
        });

        Object.defineProperty(CanvasRenderingContext2D.prototype, 'getImageData', {
            value: function() {
                ret = orig_getImageData.apply(this, arguments);
                garbleImage(ret, this.canvas.width, this.canvas.height)
                return ret
            }
        });

        console.log("devtools detect stuff overriden")
    } + ')();' ;
    var element = document.createElement('script');
    element.textContent = toInject
    element.async = false
    document.documentElement.insertBefore(element, document.documentElement.firstElement)
    if (element.parentNode) {
        element.parentNode.removeChild(element);
    }
})();
