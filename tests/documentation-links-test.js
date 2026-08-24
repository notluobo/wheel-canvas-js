const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectDirectory = path.join(__dirname, '..')

function collectMarkdownFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.name === 'node_modules' || entry.name === '.git') return []
        const entryPath = path.join(directory, entry.name)
        if (entry.isDirectory()) return collectMarkdownFiles(entryPath)
        return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : []
    })
}

function normalizeLocalTarget(rawTarget) {
    const target = rawTarget.trim().replace(/^<|>$/g, '')
    if (!target || target.startsWith('#') || target.startsWith('//')) return null
    if (/^[a-z][a-z\d+.-]*:/i.test(target)) return null
    const pathOnly = target.split(/[?#]/, 1)[0]
    if (!pathOnly) return null
    try {
        return decodeURIComponent(pathOnly)
    } catch {
        return pathOnly
    }
}

const missingLinks = []
collectMarkdownFiles(projectDirectory).forEach(filePath => {
    const source = fs.readFileSync(filePath, 'utf8')
    const linkPatterns = [
        /!?\[[^\]]*\]\(([^)]+)\)/g,
        /<(?:a|img)\b[^>]+(?:href|src)=["']([^"']+)["'][^>]*>/gi,
    ]
    linkPatterns.forEach(pattern => {
        for (const match of source.matchAll(pattern)) {
            const target = normalizeLocalTarget(match[1])
            if (!target) continue
            const resolvedTarget = path.resolve(path.dirname(filePath), target)
            if (!fs.existsSync(resolvedTarget)) {
                missingLinks.push(`${path.relative(projectDirectory, filePath)} -> ${match[1]}`)
            }
        }
    })
})

assert.deepStrictEqual(
    missingLinks,
    [],
    `Broken local documentation links:\n${missingLinks.join('\n')}`,
)
console.log('WheelCanvasJS documentation link test passed')
