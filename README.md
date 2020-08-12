# MoeART Image Processing Service

A node.js based Image-processing server, supports work as standalone or work as a cluster. The MAIPS is extended from opensource project `resize-server` which developed by `Thorsten Basse`.

## Config

-  `appPort` the port the server will be listening on
-  `appStdOut` set to `false` to prevent stdout logging
-  `convertCmd` path to imagemagicks `convert`
-  `cacheDirectory` directory to save converted images to
-  `cacheHeader` cache-control message in http header
-  `corsHeader` cross-origin resource sharing header
-  `workMode` work as IPS `node` or IPS `cluster`
-  `allowedDomains` destination server domain whitelist, leave blank `[]` for disable

## Cluster Config

-  `nodes` available IPS node server list
-  `localNode` url of main node (cluster)
-  `waitNodeTime` how many seconds wait for node health check

## Usage

http://serveraddress/`resize`/`output`/`url`

### Options

**`resize`**

- `width`x`height` stretch to dimensions
- c`width`x`height`[`gravity`] crop to dimensions with optional gravity  
  Default `gravity` is `c` for center  
  Choices include `c`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw`
- h`height`, h160: scale proportional to height
- w`width`, w120: scale proportional to width

**`output`**

- `format`  
  Default `format`is `jpg`
  Choices include `jgp` and `png`
- `jpg`,`quality`  
  Optional quality setting for `jpg` format (Defaults to 80)

**`url`**

- A valid URL to the source image to be resized

### Examples

`http://serveraddress/120x160/jpg/http://domain.com/image.jpg`  
`http://serveraddress/c300x300/jpg/http://domain.com/image.jpg`  
`http://serveraddress/c300x300n/jpg/http://domain.com/image.jpg`  
`http://serveraddress/h300/jpg/http://domain.com/image.jpg`  
`http://serveraddress/w300/jpg,100/http://domain.com/image.jpg`


## License

(MIT License)

Copyright (c) 2020 MoeART dev. Team

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Thanks
-  Project `resize-server` from `Thorsten Basse`: https://github.com/tbasse/resize-server