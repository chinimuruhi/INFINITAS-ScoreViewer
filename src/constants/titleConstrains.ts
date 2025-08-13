type ReplaceEntry = {
    from: string,
    to: string
}

type acInfDiffMap = {
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

// 読み込みエラー対応
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


// ACとINFで異なる譜面が収録されているリスト(keyがINFのID、valueがACのID)
export const acInfDiffMap:  { [key: number]: any } = {
    1833: { // New Castle Legions
        acID: 1877,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    1646: { // ミッドナイト堕天使
        acID: 1656,
        changedChart: [
            'SPA',
            'DPA'
        ]
    },
    1639: { // THE SHINING POLARIS(kors k mix)
        acID: 101644,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    1543: { // soldier's waltz
        acID: 1572,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    1523: { // madrugada
        acID: 1568,
        changedChart: [
            'SPA',
            'DPH',
            'DPA'
        ]
    },
    1315: { // DEEP ROAR
        acID: 1361,
        changedChart: [
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    938: { // PARANOIA survivor MAX
        acID: 969,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    903: { // ADVANCE
        acID: 970,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    729: { // MAX 300
        acID: 747,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    637: { // VJARMY
        acID: 644,
        changedChart: [
            'SPN',
            'SPH',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
    621: { // L'amour et la liberte
        acID: 645,
        changedChart: [
            'SPN',
            'SPA',
            'DPN',
            'DPH',
            'DPA'
        ]
    },
}