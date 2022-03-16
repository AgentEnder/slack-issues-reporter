import { IGhRepo } from "../models/gh-repo.model";

export function formatGhReport(repo: IGhRepo): string {
    const issueDelta = repo.prevIssueCount
        ? repo.totalIssueCount - repo.prevIssueCount
        : null;
    const formattedIssueDelta = formatDelta(issueDelta);

    const bugDelta = repo.prevBugCount
        ? repo.totalBugCount - repo.prevBugCount
        : null;
    const formattedBugDelta = formatDelta(bugDelta);
    
    const unlabeledDelta = repo.prevUnlabeledIssueCount
        ? repo.unlabeledIssueCount - repo.prevUnlabeledIssueCount
        : null;
    const formattedUnlabeledDelta = formatDelta(unlabeledDelta);

    const header = `Issue Report for ${repo.url}
\`\`\`
Totals, Issues: ${repo.totalIssueCount} ${formattedIssueDelta} Bugs: ${repo.totalBugCount} ${formattedBugDelta}\n\n`;

    let body = `unlabeled: ${repo.unlabeledIssueCount} ${formattedUnlabeledDelta} \n`;
    for (const scope of repo.scopes) {
        const issueDelta = scope.previousCount
            ? scope.count - scope.previousCount
            : null;
        const formattedIssueDelta = formatDelta(issueDelta);

        const bugDelta = scope.previousBugCount
            ? scope.bugCount - scope.previousBugCount
            : null;
        const formattedBugDelta = formatDelta(bugDelta);
        body += `${scope.tag}, Issues: ${scope.count} ${formattedIssueDelta} Bugs: ${scope.bugCount} ${formattedBugDelta}\n`;
    }
    body.trimEnd();
    const footer = "```";
    return header + body + footer;
}

function formatDelta(delta: number | null): string {
    if (delta === null || delta === 0) {
        return "";
    }

    return delta < 0 ? `(${delta})` : `(+${delta})`;
}
