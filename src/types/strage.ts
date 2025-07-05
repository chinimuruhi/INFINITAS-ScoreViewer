export type ScoreEntry = {
    score: number;
    misscount: number;
    cleartype: number;
    unlocked: boolean;
};

export type DiffEntry = {
    score?: NewOldNumber;
    misscount?: NewOldNumber;
    cleartype?: NewOldNumber;
};

export type NewOldNumber = {
    new: number;
    old: number;
}