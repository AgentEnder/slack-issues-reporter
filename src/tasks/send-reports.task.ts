import { createConnection, getRepository } from "typeorm";
import fetch from "node-fetch";

import { GhRepo, GhRepoScope } from "../entity/gh-repo.entity";
import { formatGhReport } from "../utils/format-gh-report";
import { getGhRepo } from "../utils/get-gh-stats";

const Authorization = `Bearer ${process.env.BOT_TOKEN}`;

async function main() {
    const connection = await createConnection();
    const repoRepository = connection.getRepository(GhRepo);
    const scopesRepository = connection.getRepository(GhRepoScope);

    const count = await repoRepository.count();
    let iterated = 0;
    console.log(`Iterating over ${count} entries`);
    while (iterated < count) {
        const slice = await repoRepository.find({
            take: 25,
            skip: iterated,
            order: {
                id: "ASC",
            },
            relations: ["scopes"],
        });
        iterated += slice.length;
        for (const repo of slice) {
            const {
                totalBugCount: totalBugs,
                totalIssueCount: total,
                unlabeledIssueCount,
                scopes,
            } = await getGhRepo(
                repo.url,
                repo.scopes.map((x) => x.tag),
                repo.bugTag
            );

            console.log(`unscoped for ${repo.url}: ${unlabeledIssueCount}`)

            const existingScopes = await scopesRepository.find({
                ghRepo: {
                    id: repo.id,
                },
            });

            existingScopes.forEach((scope) => {
                const s = scopes.find((s) => s.tag === scope.tag);
                if (s) {
                    scope.previousCount = scope.count;
                    scope.previousBugCount = scope.bugCount;
                    scope.count = s.count;
                    scope.bugCount = s.bugCount;
                }
            });
            await scopesRepository.save(existingScopes);
            repo.prevBugCount = repo.totalBugCount;
            repo.prevIssueCount = repo.totalIssueCount;
            repo.prevUnlabeledIssueCount = repo.unlabeledIssueCount;
            repo.unlabeledIssueCount = unlabeledIssueCount;
            repo.totalBugCount = totalBugs;
            repo.totalIssueCount = total;
            await repoRepository.save(repo);

            console.log(repo.scopes, existingScopes)
            repo.scopes = existingScopes;

            const response = await fetch(
                "https://slack.com/api/chat.postMessage",
                {
                    method: "POST",
                    headers: {
                        Authorization,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        channel: repo.slackChannelId,
                        text: formatGhReport(repo),
                        mrkdwn: true,
                    }),
                }
            ).then((x) => x.json());
            if (!response.ok && response.error === "channel_not_found") {
                const scopes = await scopesRepository.find({
                    ghRepo: {
                        id: repo.id,
                    },
                });
                await scopesRepository.remove(scopes);
                await repoRepository.remove(repo);
            }
        }
    }
}

if (require.main === module) {
    if (process.env.FORCE_RUN === '1' || new Date().getDay() === 1) {
        main();
    }
}
