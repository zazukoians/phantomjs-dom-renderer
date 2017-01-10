var hijackResponse = require('hijackresponse')
var path = require('path')
var phantomjs = require('phantomjs-prebuilt')
var streamBuffers = require('stream-buffers')

function streamToString (stream) {
  return new Promise(function (resolve, reject) {
    var buffer = new streamBuffers.WritableStreamBuffer()

    buffer.on('finish', function () {
      resolve(buffer.getContentsAsString('utf8'))
    })

    stream.on('error', function (err) {
      reject(err)
    })

    stream.pipe(buffer)
  })
}

function phantomJsRender (html) {
  return new Promise(function (resolve, reject) {
    var program = phantomjs.exec(path.join(__dirname, 'lib/phantomjs-dom-dump.js'))

    var buffer = new streamBuffers.WritableStreamBuffer()
    var errBuffer = new streamBuffers.WritableStreamBuffer()

    program.stdout.pipe(buffer)
    program.stderr.pipe(errBuffer)

    program.on('exit', function (code) {
      var errString = errBuffer.getContentsAsString('utf8')

      if (errString) {
        reject(new Error(errString))
      } else {
        resolve(buffer.getContentsAsString('utf8'))
      }
    })

    program.stdin.end(html)
  })
}

function acceptReq (options, req) {
  // only process content for browsers matching the User-Agent header RegExp
  if (!req.headers['user-agent'] || !options.userAgentRegExp.test(req.headers['user-agent'])) {
    return false
  }

  return true
}

function acceptRes (options, res) {
  // only process HTML content
  if (!res.getHeader('content-type') || res.getHeader('content-type').indexOf('html') === -1) {
    return false
  }

  return true
}

function middleware (options, req, res, next) {
  if (!acceptReq(options, req)) {
    return next()
  }

  hijackResponse(res, function (err, res) {
    if (err) {
      res.unhijack()

      return next(err)
    }

    if (!acceptRes(options, res)) {
      return res.pipe(res)
    }

    // convert the response from another middleware to a string
    streamToString(res).then(function (html) {
      // forward the HTML string to PhantomJS (ignore empty strings)
      return html ? phantomJsRender(html) : ''
    }).then(function (html) {
      // send the HTML rendered by PhantomJS and update the content-length header
      res.removeHeader('content-length')
      res.end(html)
    }).catch(function (err) {
      res.pipe(res)

      console.error(err.stack || err.message)
    })
  })

  next()
}

function factory (options) {
  options = options || {}
  options.userAgentRegExp = options.userAgentRegExp || new RegExp('MSIE [1-9]\\.')

  return middleware.bind(null, options)
}

module.exports = factory
