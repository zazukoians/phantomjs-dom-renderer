# phantomjs-dom-renderer

Middleware to render the HTML DOM using PhantomJS for legacy browsers.

## Usage

The module returns a factory which accepts a single optional options object.
`hijackresponse` is used to transform the output of another middleware.
Therefore `phantomjs-dom-renderer` must be added to the route before the middleware which does the actual rendering.

Example:

```
// creates a middleware which will be active for IE8 and below 
app.use(phantomjsDomRenderer({
  userAgentRegExp: new RegExp('MSIE [1-8]\.')
}))

// the actual renderer must be added after phantomjs-dom-renderer!
app.use(myRenderer)
```

### Options

- `userAgentRegExp`: Regular expression for the `User-Agent` header.
  Only matches will be processed.
  (default: `new RegExp('MSIE [1-9]\.')`)
