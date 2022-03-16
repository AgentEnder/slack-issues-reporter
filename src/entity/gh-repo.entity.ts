import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { IGhRepo, IGhRepoScope } from "../models/gh-repo.model";

@Entity()
export class GhRepo implements IGhRepo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  url: string;

  @Column("text")
  bugTag = "bug";

  @OneToMany(() => GhRepoScope, (scope) => scope.ghRepo)
  scopes: GhRepoScope[];

  @Column("text")
  slackChannelId: string;

  constructor(url: string, slackChannelId: string) {
    this.url = url;
    this.slackChannelId = slackChannelId;
  }

  @Column("int")
  totalIssueCount: number;

  @Column("int", { nullable: true })
  prevIssueCount?: number | undefined;

  @Column("int", { default: 0 })
  unlabeledIssueCount: number;

  @Column("int", { nullable: true })
  prevUnlabeledIssueCount?: number | undefined;

  @Column("int")
  totalBugCount: number;

  @Column("int", { nullable: true })
  prevBugCount?: number | undefined;
}

@Entity()
export class GhRepoScope implements IGhRepoScope {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  tag: string;

  @Column("int")
  count: number;

  @Column("int", { nullable: true })
  previousCount?: number | undefined;

  @Column("int")
  bugCount: number;

  @Column("int", { nullable: true })
  previousBugCount?: number | undefined;

  @ManyToOne(() => GhRepo, (repo) => repo.scopes, { cascade: true })
  ghRepo: GhRepo;
}
