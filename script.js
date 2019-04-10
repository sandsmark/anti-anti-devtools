(function() {
    var toInject = `
        // Hurr durr javascript
        function sleep (dur){
            var t0 = performance.now();
            while(performance.now() < t0 + dur){ /* do nothing */ }
        }

        var sleepDuration = 1

        var orig_log = console.log
        console.log = function(argument) {
            var t0 = performance.now();

            // Defuse the toString() trick
            // The best way would be to check if the argument has an id and if so
            // reset the getter, but it's easier to just pretend the devconsole is
            // always open

            var dummy = argument.id + ""
            orig_log(argument)

            // Defuse timing attacks
            // By default it will sleep about 1ms, but it adjusts to the time it
            // takes to print to the console
            var t1 = performance.now();
            var duration = t1 - t0
            sleepDuration = Math.max(sleepDuration, duration)
            sleep(sleepDuration - duration)

            console.clear = function() { console.log("tried to clear"); }
        }

        console.clear = function() { }

        // Just in case
        window.console.log = console.log
        window.console.clear = console.clear

        // Just never let people see the actual outer size
        Object.defineProperty(window, "outerWidth", {get: () => {
            return window.innerWidth
        }});

        Object.defineProperty(window, "outerHeight", {get: () => {
            return window.innerHeight
        }});
        console.log("devtools detect stuff overriden")
     `
    var element = document.createElement('script');
    element.textContent = toInject
    element.async = false
    document.documentElement.insertBefore(element, document.documentElement.firstElement)
})();
