(function() {
    var toInject = function () {
        var orig_log = console.log

        // Hurr durr javascript
        function sleep (dur){
            var t0 = performance.now();
            while(performance.now() < t0 + dur){ /* do nothing */ }
        }

        var sleepDuration = 1

        console.log = function(argument) {
            var t0 = performance.now();

            // Defuse the toString() trick
            // The best way would be to check if the argument has an id and if so
            // reset the getter, but it's easier to just pretend the devconsole is
            // always open

            var dummy = argument.id + ""
            orig_log(argument + " dumb")

            // Defuse timing attacks
            // By default it will sleep about 1ms, but it adjusts to the time it
            // takes to print to the console
            var t1 = performance.now();
            var duration = t1 - t0
            sleepDuration = Math.max(sleepDuration, duration)
            sleep(sleepDuration - duration)
        }
        console.clear = function() { }

        // Just never let people see the actual outer size
        Object.defineProperty(window, "outerWidth", {get: () => {
            return window.innerWidth
        }});

        Object.defineProperty(window, "outerHeight", {get: () => {
            return window.innerHeight
        }});
    }

    function injectScript(src, where) {
        // Automatically execute it
        src = "(" + src + ")();"

        // Sneak it in, chrome doesn't like just sending it straight in
        var b64 = 'data:text/javascript';
        try {
            b64 += (';base64,' + btoa(src));
        } catch(e) {
            b64 += (';charset=utf-8,' + encodeURIComponent(src));
        }
        var elm = document.createElement('script');
        elm.src = b64; //src;
        document[where || 'head'].appendChild(elm);
    }

    setTimeout(function() {
        console.log(toInject.toString())
                    injectScript(toInject.toString(), 'body');
                }, 250);
    //injectScript(toInject.source, 'body');
})();
