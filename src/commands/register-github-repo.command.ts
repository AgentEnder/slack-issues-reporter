import { getConnection } from "typeorm";
import { GhRepo, GhRepoScope } from "../entity/gh-repo.entity";
import { IGhRepo } from "../models/gh-repo.model";
import { getGhRepo } from "../utils/get-gh-stats";

export async function registerGithubRepository(
  githubUrl: string,
  scopeLabels: string[],
  bugLabel: string,
  channelId: string
): Promise<IGhRepo> {
  const {
    totalBugCount: totalBugs,
    totalIssueCount: total,
    unlabeledIssueCount,
    scopes,
  } = await getGhRepo(githubUrl, scopeLabels, bugLabel);

  const connection = getConnection();
  const repoRepository = connection.getRepository(GhRepo);
  const scopeRepository = connection.getRepository(GhRepoScope);

  let entity = await repoRepository.findOne({
    where: {
      slackChannelId: channelId,
    },
    relations: ["scopes"],
  });

  if (entity) {
    console.log(
      "Updating existing configuration",
      entity.id,
      entity.url,
      entity.slackChannelId
    );
  } else {
    console.log("Creating configuration for conversation", channelId);
  }

  if (!entity) {
    entity = repoRepository.create({
      bugTag: bugLabel,
      slackChannelId: channelId,
      url: githubUrl,
      scopes: [],
    });
  } else {
    const existingScopes = await scopeRepository.find({
      ghRepo: {
        id: entity.id,
      },
    });
    existingScopes.forEach((scope) => {
      const s = scopes.find((s) => s.tag === scope.tag);
      if (s) {
        s.previousBugCount = scope.bugCount;
        s.previousCount = scope.count;
      }
    });
    await scopeRepository.remove(existingScopes);

    entity.url = githubUrl;
    entity.bugTag = bugLabel;
    entity.prevBugCount = entity.totalBugCount;
    entity.prevIssueCount = entity.totalIssueCount;
    entity.prevUnlabeledIssueCount = entity.unlabeledIssueCount;
  }
  entity.unlabeledIssueCount = unlabeledIssueCount;
  entity.totalIssueCount = total;
  entity.totalBugCount = totalBugs;
  await repoRepository.save(entity);

  const scopeEntities = scopeRepository.create(
    scopes.map((x) => ({ ...x, ghRepo: entity }))
  );
  scopeRepository.save(scopeEntities);

  entity.scopes = scopeEntities;
  return entity;
}
