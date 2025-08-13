type ReplaceEntry = {
    from: string,
    to: string
}

export const replaceCharacters: ReplaceEntry[] = [
    // sample (基本的には https://chinimuruhi.github.io/IIDX-Data-Table/manual/replace-characters.json で解決済み)
    {
        from: 'à',
        to: 'a'
    }
]

export const replaceTitle: ReplaceEntry[] = [
    // Reflux
    {
        from: '共犯へヴンズコード',
        to: '共犯ヘヴンズコード'
    },
    {
        from: 'Ignis†Ir?',
        to: 'Ignis†Irae'
    },
    {
        from: 'V?ID',
        to: 'VOID'
    },
    {
        from: 'ACT?',
        to: 'ACTO'
    },
    {
        from: '♥LOVE² シュガ→♥',
        to: 'LOVE2シュガ→'
    },
    // daken counter
    {
        from: 'uan',
        to: 'uen'
    },
    {
        from: 'Dans la nuit de leternite',
        to: 'Dans la nuit de l\'éternité'
    },
    {
        from: 'Let\'s bounce !!',
        to: 'Let\'s Bounce !!'
    },
    {
        from: 'Psychedelic intelligence',
        to: 'Psychedelic Intelligence'
    },
    {
        from: 'ウツミウツシ',
        to: 'ウツシミウツシ'
    }
]