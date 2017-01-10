/* global phantom, WebPage */

var page = new WebPage()
var system = require('system')

page.onLoadFinished = function () {
  var html = page.evaluate(function () {
    var scriptElements = document.getElementsByTagName('script')

    for (var i = 0; i < scriptElements.length; i++) {
      scriptElements[i].parentNode.removeChild(scriptElements[i])
    }

    return document.documentElement.innerHTML
  })

  system.stdout.write(html)

  phantom.exit()
}

page.onError = function (msg, trace) {
  var stack = [msg]

  if (trace && trace.length) {
    trace.forEach(function (t) {
      stack.push('\tat ' + (t.function || '') + '(' + (t.file || t.sourceURL) + ':' + t.line + ')')
    })
  }

  system.stderr.write(stack.join('\n'))

  phantom.exit(1)
}

page.content = system.stdin.read()
