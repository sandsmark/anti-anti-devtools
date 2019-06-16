(function() {
    var toInject = 
       // Hurr durr javascript
    '(' + function() {
        var orig_debug = console.debug
        var orig_info = console.info
        var orig_log = console.log
        var orig_warn = console.warn
        var orig_dir = console.warn

        function sleep (dur){
            var t0 = performance.now();
            while(performance.now() < t0 + dur){ /* do nothing */ }
        }

        function checkForProperty(argument, property) {
            var idProperties = Object.getOwnPropertyDescriptor(argument, property)
            // I'm not sure if this is a good idea, but whatever
            if (idProperties !== undefined && 'get' in idProperties && typeof idProperties['get'] === 'function') {
                return true
            }
            return false
        }

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

        var sleepDuration = 1

        console.debug = function(argument) { saferPrint(argument, orig_debug) }
        console.info = function(argument) { saferPrint(argument, orig_info) }
        console.log = function(argument) { saferPrint(argument, orig_log) }
        console.warn = function(argument) { saferPrint(argument, orig_warn) }
        console.dir = function(argument) { saferPrint(argument, orig_dir) }

        console.clear = function() { }

        // Just in case
        window.console.debug = console.debug
        window.console.info = console.info
        window.console.log = console.log
        window.console.warn = console.warn
        window.console.clear = console.clear
        window.console.dir = console.dir
        
        navigator.getBattery = function() { return undefined; }
        window.AudioContext = undefined
        window.OfflineAudioContext = undefined
        window.devicePixelRatio = 1
        window.screen = {}
        window.screen.colorDepth = 24

        navigator.doNotTrack = undefined
        Object.defineProperty(navigator, 'sendBeacon', { get: () => function(url, data) { console.log("Intercepted beacon to '" + url + "' with data '" + data + "'"); return true; } })
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 1 })
        Object.defineProperty(navigator, 'connection', { get: () => undefined })
        Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.38 Safari/537.36' })
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
        Object.defineProperty(navigator, 'platform', { get: () => 'Win64' })
        Object.defineProperty(document, 'referrer', { get: () => 'fuckyou' })
        Object.defineProperty(navigator, 'appVersion', { get: () =>  '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36' })

        Object.defineProperty(Date.prototype, "getTimezoneOffset", {get: () => function() { return 0; } })
        Date.prototype.getTimezoneOffset = function() { return 0; }

        Object.defineProperty(window.screen, "availWidth", {get: () => {
            return window.innerWidth + Math.random()
        }});

        Object.defineProperty(window.screen, "width", {get: () => {
            return window.innerWidth + Math.random()
        }});

        Object.defineProperty(window.screen, "availHeight", {get: () => {
            return window.innerHeight + Math.random()
        }});

        Object.defineProperty(window.screen, "height", {get: () => {
            return window.innerHeight + Math.random()
        }});

        // Just never let people see the actual outer size
        Object.defineProperty(window, "outerWidth", {get: () => {
            return window.innerWidth + Math.random()
        }});

        Object.defineProperty(window, "outerHeight", {get: () => {
            return window.innerHeight + Math.random()
        }});

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
