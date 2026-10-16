import re

files = ['contracts/GuardrailCourtV2.py', 'contracts/GuardedVaultV2.py']
all_errors = set()

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    # match gl.vm.UserError("...")
    matches = re.findall(r'gl\.vm\.UserError\(["\']([^"\']+)["\']\)', content)
    print(f'{fpath}: {len(matches)} occurrences, {len(set(matches))} unique')
    for m in matches:
        all_errors.add(m)

print(f'\nTotal unique UserError strings: {len(all_errors)}')
for e in sorted(all_errors):
    print(f'"{e}",')
