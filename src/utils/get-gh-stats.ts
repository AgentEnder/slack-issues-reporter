import { Octokit } from "octokit";
import { DeepPartial } from "typeorm";
import { IGhRepo, IGhRepoScope } from "../models/gh-repo.model";

export async function getGhRepo(
    url: string,
    scopeLabels: string[],
    bugLabel: string
): Promise<IGhRepo> {
    const issues = getIssueIteratorFromUrl(url);

    let total = 0;
    let totalBugs = 0;
    const scopes: IGhRepoScope[] = scopeLabels.map((x) => ({
        tag: x,
        bugCount: 0,
        count: 0,
    }));

    for await (const { data: slice } of issues) {
        const issueSlice = slice.filter((x) => !("pull_request" in x));
        total += issueSlice.length;
        for (const issue of issueSlice) {
            const bug = issue.labels.some((x) => x.name === bugLabel);
            if (bug) {
                totalBugs += 1;
            }
            for (const scope of scopes) {
                if (issue.labels.some((x) => x.name === scope.tag)) {
                    if (bug) {
                        scope.bugCount += 1;
                    }
                    scope.count += 1;
                }
            }
        }
    }

    return {
        bugTag: bugLabel,
        scopes: scopes,
        totalBugCount: totalBugs,
        totalIssueCount: total,
        url: url,
        slackChannelId: ''
    };
}

const getIssueIteratorFromUrl = (githubUrl: string) => {
    const octokit = new Octokit();
    const [user, repo] = githubUrl
        .replace(new RegExp("^.*github.com/"), "")
        .split("/");

    return octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
        owner: user,
        repo,
        per_page: 100,
    });
};
