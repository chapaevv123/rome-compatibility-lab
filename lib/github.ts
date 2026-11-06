import type {SourceFile} from './scanner';

const RE = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)(?:\/tree\/([A-Za-z0-9_.-]+))?\/?$/;
const MAX_FILES = 40;
const MAX_FILE_BYTES = 100_000;
const MAX_TOTAL_BYTES = 1024 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

async function getJson(url: string, totalSignal: AbortSignal): Promise<any> {
  const signal = AbortSignal.any([totalSignal, AbortSignal.timeout(10_000)]);
  const response = await fetch(url, {
    redirect: 'error',
    headers: {'Accept': 'application/vnd.github+json', 'User-Agent': 'rome-compatibility-lab'},
    signal,
  });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(response.headers.get('content-type')||'')) throw new Error('GitHub returned non-JSON data');
  if (Number(response.headers.get('content-length') || 0) > MAX_RESPONSE_BYTES) throw new Error('GitHub response too large');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty GitHub response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error('GitHub response too large');
    }
    chunks.push(value);
  }
  return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks)));
}

export async function importGitHub(input: string): Promise<SourceFile[]> {
  if (typeof input !== 'string') throw new Error('GitHub URL must be a string');
  const match = RE.exec(input);
  if (!match) throw new Error('Only public github.com/owner/repo URLs are accepted');
  const [, owner, repo, requestedRef] = match;
  if (owner.startsWith('-') || owner.endsWith('-') || repo === '.' || repo === '..') throw new Error('Invalid GitHub owner or repository');
  const api = `https://api.github.com/repos/${owner}/${repo}`;
  const totalSignal = AbortSignal.timeout(20_000);
  const meta = await getJson(api, totalSignal);
  if (meta.private || meta.disabled) throw new Error('Repository is private or disabled');
  const ref = requestedRef || meta.default_branch;
  if (typeof ref !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(ref) || ref === '.' || ref === '..') throw new Error('Invalid ref');
  const tree = await getJson(`${api}/git/trees/${encodeURIComponent(ref)}?recursive=1`, totalSignal);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('GitHub tree missing or truncated');
  const entries = tree.tree.filter((entry: any) => entry.type === 'blob' && typeof entry.path === 'string' && entry.path.endsWith('.sol'));
  if (entries.length > MAX_FILES) throw new Error('Repository has more than 40 Solidity files');
  let total = 0;
  for (const entry of entries) {
    if (entry.path.length > 240 || entry.path.startsWith('/') || entry.path.includes('\\') || entry.path.split('/').includes('..') || !Number.isInteger(entry.size) || entry.size < 0 || entry.size > MAX_FILE_BYTES || !/^[a-f0-9]{40}$/.test(entry.sha)) {
      throw new Error('Repository contains an unsafe or oversized Solidity file');
    }
    total += entry.size;
  }
  if (total > MAX_TOTAL_BYTES) throw new Error('Repository Solidity files exceed 1 MiB');
  const files: SourceFile[] = [];
  for (let start = 0; start < entries.length; start += 4) {
    const batch = entries.slice(start, start + 4);
    const downloaded = await Promise.all(batch.map(async (entry: any) => {
      const blob = await getJson(`${api}/git/blobs/${entry.sha}`, totalSignal);
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string' || !/^[A-Za-z0-9+/=\s]*$/.test(blob.content)) throw new Error('Unsupported GitHub blob encoding');
      const bytes = Buffer.from(blob.content.replace(/\s/g, ''), 'base64');
      if (bytes.length !== entry.size || bytes.length > MAX_FILE_BYTES) throw new Error('GitHub blob size mismatch');
      let content: string;
      try {content = new TextDecoder('utf-8', {fatal: true}).decode(bytes);if(content.includes('\0'))throw Error('Binary content');}
      catch {throw new Error('Solidity file is not valid UTF-8');}
      return {path: entry.path, content};
    }));
    files.push(...downloaded);
  }
  return files;
}
