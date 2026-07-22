import { spawnSync } from 'child_process'
import * as os from 'os'

let _egoPath = ''

function getEgoBrowserPath(): string {
  if (_egoPath) return _egoPath
  const home = os.homedir()
  const candidates = [
    `${home}/.local/bin/ego-browser`,
    'ego-browser',
  ]
  for (const p of candidates) {
    try {
      const res = spawnSync('which', [p], { encoding: 'utf-8' })
      if (res.status === 0 && res.stdout.trim()) {
        _egoPath = p
        return p
      }
    } catch {}
  }
  return ''
}

function escapeForScript(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

export function isEgoBrowserAvailable(): boolean {
  return !!getEgoBrowserPath()
}

export function fetchProfileWithEgoBrowser(url: string): {
  pageText: string
  captions: string[]
  debug: string[]
  error?: string
} {
  const result: { pageText: string; captions: string[]; debug: string[]; error?: string } = {
    pageText: '',
    captions: [],
    debug: [],
  }

  const egoPath = getEgoBrowserPath()
  if (!egoPath) {
    result.error = 'ego-browser not found'
    return result
  }

  const escapedUrl = escapeForScript(url)

  // cliLog writes to stderr in ego-browser; closeTaskSpace doesn't exist
  const script = `
const task = await useOrCreateTaskSpace('fetch social profile');
await openOrReuseTab('${escapedUrl}', { wait: true, timeout: 30 });

await js(String.raw\`
  (() => {
    const els = document.querySelectorAll('button, span, div, a');
    for (const el of els) {
      if (/\\.\\.\\.\\s*more|\\u66f4\\u591a/i.test(el.textContent || '')) {
        el.click();
        return 'clicked';
      }
    }
    return 'not found';
  })()
\`);
await wait(1);

const text = await js(String.raw\`document.body.innerText\`);
cliLog(JSON.stringify({ text }));
`

  try {
    const res = spawnSync(egoPath, ['nodejs'], {
      input: script,
      encoding: 'utf-8',
      timeout: 60000,
    })

    result.debug.push(`exit=${res.status}`)

    // cliLog output goes to stderr in ego-browser
    const output = (res.stderr || '') + '\n' + (res.stdout || '')
    const lines = output.split('\n').filter(l => l.trim())

    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith('{')) {
        try {
          const parsed = JSON.parse(lines[i])
          if (parsed && typeof parsed.text === 'string') {
            result.pageText = parsed.text
            return result
          }
        } catch {}
      }
    }

    result.error = 'no JSON with text found'
    result.debug.push('--- output ---')
    result.debug.push(output.substring(0, 2000))
    return result
  } catch (err: any) {
    result.error = `exception: ${err.message || err}`
    return result
  }
}
