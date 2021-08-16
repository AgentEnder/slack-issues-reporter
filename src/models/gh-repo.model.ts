export interface IGhRepo {
    url: string;
    bugTag: string;
    scopes: IGhRepoScope[];
    slackChannelId: string;
    totalIssueCount: number;
    prevIssueCount?: number;
    totalBugCount: number;
    prevBugCount?: number;
}

export interface IGhRepoScope {
    tag: string;
    count: number;
    previousCount?: number;
    bugCount: number;
    previousBugCount?: number;
}
