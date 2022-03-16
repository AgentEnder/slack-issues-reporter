import { getConnection } from "typeorm";
import { GhRepo, GhRepoScope } from "../entity/gh-repo.entity";
import { sendReport } from "../tasks/send-reports.task";

export async function sendReportToChannel(channelId: string, responseUrl?: string) {
  const connection = getConnection();
  const ghRepoRepository = connection.getRepository(GhRepo);
  const scopeRepositoy = connection.getRepository(GhRepoScope);

  const repo = await ghRepoRepository.findOneOrFail(
    {
      slackChannelId: channelId,
    },
    { relations: ["scopes"] }
  );

  return sendReport(repo, ghRepoRepository, scopeRepositoy, responseUrl);
}
