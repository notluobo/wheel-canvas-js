const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectDirectory = path.join(__dirname, '..')
const ignoredDirectories = new Set(['node_modules'])
const ignoredFiles = new Set(['LICENSE', 'NOTICE', 'naming-test.js', 'package-lock.json'])
const textExtensions = new Set([
    '.cts',
    '.css',
    '.html',
    '.js',
    '.json',
    '.md',
    '.mjs',
    '.ts',
    '.yml',
    '.yaml',
])
const retiredPrefix = ['Luck', 'y'].join('')
const forbiddenNames = [
    new RegExp(`${retiredPrefix} Wheel JS`, 'i'),
    new RegExp(`${retiredPrefix.toLowerCase()}-wheel-js`, 'i'),
    new RegExp(`${retiredPrefix}Canvas`),
    new RegExp(`${retiredPrefix}Wheel`),
    new RegExp(`create${retiredPrefix}Wheel`),
    new RegExp(`data-${retiredPrefix.toLowerCase()}-wheel`, 'i'),
    new RegExp(['mk', 'fast'].join(''), 'i'),
]

function collectTextFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.name.startsWith('.') && entry.name !== '.github') return []
        const absolutePath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            if (ignoredDirectories.has(entry.name)) return []
            return collectTextFiles(absolutePath)
        }
        if (ignoredFiles.has(entry.name) || !textExtensions.has(path.extname(entry.name))) return []
        return [absolutePath]
    })
}

collectTextFiles(projectDirectory).forEach(filePath => {
    const source = fs.readFileSync(filePath, 'utf8')
    forbiddenNames.forEach(pattern => {
        assert.doesNotMatch(
            source,
            pattern,
            `${path.relative(projectDirectory, filePath)} contains a retired project name`,
        )
    })
})

const packageManifest = require('../package.json')
assert.strictEqual(packageManifest.name, 'wheel-canvas-js')
assert.strictEqual(packageManifest.main, 'dist/wheel-canvas-js.umd.js')
assert.strictEqual(packageManifest.module, 'dist/wheel-canvas-js.esm.mjs')
assert.strictEqual(packageManifest.types, 'dist/wheel-canvas-js.d.cts')
assert.deepStrictEqual(packageManifest.author, {
    name: 'notluobo',
    url: 'https://github.com/notluobo',
})
assert.strictEqual(
    packageManifest.repository.url,
    'git+https://github.com/notluobo/wheel-canvas-js.git',
)

;['umd.js', 'esm.mjs', 'd.ts', 'd.cts', 'd.mts']
    .map(suffix => `index.${suffix}`)
    .forEach(fileName => {
        assert.strictEqual(
            fs.existsSync(path.join(projectDirectory, fileName)),
            false,
            `${fileName} must not return after the public entry rename`,
        )
    })

const notice = fs.readFileSync(path.join(projectDirectory, 'NOTICE'), 'utf8')
assert.match(notice, /^WheelCanvasJS$/m)
assert.ok(notice.includes(`https://github.com/buuing/${retiredPrefix.toLowerCase()}-canvas`))

console.log('WheelCanvasJS naming contract test passed')
