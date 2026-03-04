export const toWikiMarkup = (markdown: string): string =>
  markdown
    .trim()
    .replace(/^#### (.+)$/gm, 'h4. $1')
    .replace(/^### (.+)$/gm, 'h3. $1')
    .replace(/^## (.+)$/gm, 'h2. $1')
    .replace(/^# (.+)$/gm, 'h1. $1')
    .replace(/^\* (.+)$/gm, '* $1')
    .replace(/^- \[x\] (.+)$/gim, '* (/) $1')
    .replace(/^- \[ \] (.+)$/gim, '* (!) $1')
    .replace(/^- (.+)$/gm, '* $1')
    .replace(/\*\*(.+?)\*\*/g, '\x00BOLD\x00$1\x00BOLD\x00')
    .replace(/\*(.+?)\*/g, '_$1_')
    .replace(/\x00BOLD\x00(.+?)\x00BOLD\x00/g, '*$1*')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '{code}\n$1{code}')
    .replace(/`(.+?)`/g, '{{$1}}');
