"""Curated user/source packages for Codex InDesign Bridge v0.3.1 preview."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root/'dist')
args = parser.parse_args()
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=True)
version = json.loads((root/'CodexInDesignBridge/manifest.json').read_text(encoding='utf-8'))['version']
assert version == '0.3.1'
plugin = [p.relative_to(root).as_posix() for p in (root/'CodexInDesignBridge').rglob('*') if p.is_file()]
user = sorted(plugin + ['bridge-client.cjs','INSTALL.md','USAGE.md','INSTALL.hu.md','USAGE.hu.md','LICENSE','docs/EXPERIMENTAL.md','docs/RELEASE-v0.3.1.md'])
source = sorted(set(user + ['README.md','AGENTS.md','CHANGELOG.md','package.json','.gitignore','docs/DEVELOPMENT.md','Tools/package.py'] + [p.relative_to(root).as_posix() for p in (root/'Tests').glob('*.cjs')]))
friend_folder = output/'Friends'
# Existing unrelated files are preserved; the archive is built only from the allowlist.
for name in user:
    destination=friend_folder/name
    destination.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/name,destination)
report=[]
for label,names in [('preview',user),('source',source)]:
    package=output/f'Codex-InDesign-Bridge-v{version}-{label}.zip'
    with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name in names:
            assert not any(part in ('.git','Requests','Responses','Claims','BackUp','PROJECT_MEMORY') for part in Path(name).parts)
            archive.write(root/name,name)
    with zipfile.ZipFile(package) as archive:
        assert archive.testzip() is None
        assert sorted(archive.namelist())==names
        for name in names:
            assert archive.read(name)==(root/name).read_bytes()
    digest=hashlib.sha256(package.read_bytes()).hexdigest()
    (output/(package.name+'.sha256')).write_text(digest+'  '+package.name+'\n',encoding='utf-8')
    report.append({'file':package.name,'files':len(names),'bytes':package.stat().st_size,'sha256':digest})
(output/'Package-Manifest-v0.3.1.json').write_text(json.dumps({'version':version,'status':'preview','packages':report,'userFiles':user,'sourceFiles':source},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
