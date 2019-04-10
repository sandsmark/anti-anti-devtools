(function () {
    var orig_log = console.log
    console.log = function(argument) {
        orig_log(argument.id)
        orig_log(argument)
    }

    Object.defineProperty(window, "outerWidth", {get: () => {
        return window.innerWidth
    }});

    Object.defineProperty(window, "outerHeight", {get: () => {
        return window.innerHeight
    }});
})();
