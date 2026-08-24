const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { pathToFileURL } = require('url')

async function run() {
    const packageVersion = require('../package.json').version
    const commonJsApi = require('../dist/wheel-canvas-js.umd.js')
    assert.strictEqual(commonJsApi.version, packageVersion)
    assert.strictEqual(typeof commonJsApi.WheelCanvas, 'function')
    assert.strictEqual(typeof commonJsApi.createWheelCanvas, 'function')

    const esmUrl = pathToFileURL(path.join(__dirname, '..', 'dist', 'wheel-canvas-js.esm.mjs')).href
    const esmApi = await import(esmUrl)
    assert.strictEqual(esmApi.version, packageVersion)
    assert.strictEqual(esmApi.WheelCanvas, commonJsApi.WheelCanvas)
    assert.strictEqual(esmApi.default.createWheelCanvas, commonJsApi.createWheelCanvas)

    const browserSandbox = {}
    vm.createContext(browserSandbox)
    vm.runInContext(
        fs.readFileSync(path.join(__dirname, '..', 'dist', 'wheel-canvas-js.umd.js'), 'utf8'),
        browserSandbox,
        {
            filename: 'wheel-canvas-js.umd.js',
        },
    )
    assert.strictEqual(browserSandbox.WheelCanvasJS.version, packageVersion)
    assert.strictEqual(typeof browserSandbox.WheelCanvasJS.WheelCanvas, 'function')

    console.log('Standalone WheelCanvas module entry test passed')
}

run().catch(error => {
    console.error(error)
    process.exitCode = 1
})
