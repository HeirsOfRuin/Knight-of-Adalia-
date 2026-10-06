# Quotes single-line scalar text fields that contain ": " or " #", which YAML
# would otherwise misparse. Run after writing content: python3 tools/fix-yaml-quotes.py
import re, glob
pat = re.compile(r'^(\s*(?:- )?(?:text|text_after|warn|title|label|die)): (?!["\'|>\[{])(.*)$')
for p in glob.glob('content/**/*.yaml', recursive=True):
    lines = open(p).read().split('\n'); changed = 0
    for i, l in enumerate(lines):
        m = pat.match(l)
        if m and (': ' in m.group(2) or ' #' in m.group(2) or m.group(2).rstrip().endswith(':')):
            val = m.group(2).replace('\\', '\\\\').replace('"', '\\"')
            lines[i] = f'{m.group(1)}: "{val}"'; changed += 1
    if changed:
        open(p, 'w').write('\n'.join(lines)); print(p, changed)
