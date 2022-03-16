import { getConnection } from "typeorm";
import { GhRepo } from "../entity/gh-repo.entity";

export const MODAL_PROMPT = "config-modal-prompt";
export const SHOW_MODAL_BUTTON = "show-config-modal";
export const MODAL = "config-modal";

export function showConfigurationModalPrompt() {
    return {
        type: "section",
        response_type: "ephemeral",
        callback_id: MODAL_PROMPT,
        title: {
            type: "plain_text",
            text: "Just a modal",
        },
        blocks: [
            {
                type: "section",
                block_id: "section-identifier",
                text: {
                    type: "mrkdwn",
                    text: "*Welcome* to Issues Reporter!",
                },
                accessory: {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Open Configuration",
                    },
                    action_id: SHOW_MODAL_BUTTON,
                },
            },
        ],
    };
}

export const GITHUB_URL_ACTION = "github-url";
export const SCOPE_INPUT_ACTION = "scope-labels";
export const BUG_LABEL_ACTION = "bug-label";
export const CONVERSATION_SELECT_ACTION = "channel-select";
export async function showConfigurationModal(channelId?: string) {
    const connection = getConnection();
    const repository = connection.getRepository(GhRepo);
    let entity = await repository.findOne({
        where: {
            slackChannelId: channelId,
        },
        relations: ["scopes"]
    });
    return {
        title: {
            type: "plain_text",
            text: "Issues Reporter - Config",
        },
        submit: {
            type: "plain_text",
            text: "Submit",
        },
        blocks: [
            {
                type: "input",
                element: {
                    type: "plain_text_input",
                    action_id: GITHUB_URL_ACTION,
                    placeholder: {
                        type: "plain_text",
                        text: "Which Github repository should be monitored?",
                    },
                    ...(entity ? { initial_value: entity.url } : false),
                },
                label: {
                    type: "plain_text",
                    text: "Github URL",
                },
            },
            {
                type: "input",
                element: {
                    type: "plain_text_input",
                    multiline: true,
                    action_id: SCOPE_INPUT_ACTION,
                    placeholder: {
                        type: "plain_text",
                        text: "scope: core\nscope: node",
                    },
                    ...(entity
                        ? {
                              initial_value: entity.scopes
                                  .map((x) => x.tag)
                                  .join("\n"),
                          }
                        : false),
                },
                label: {
                    type: "plain_text",
                    text: "Labels",
                    emoji: true,
                },
            },
            {
                type: "input",
                element: {
                    type: "plain_text_input",
                    action_id: BUG_LABEL_ACTION,
                    placeholder: {
                        type: "plain_text",
                        text: "Bug",
                    },
                    ...(entity ? { initial_value: entity.bugTag } : false),
                },
                label: {
                    type: "plain_text",
                    text: "Bug Label",
                    emoji: true,
                },
            },
            {
                type: "input",
                element: {
                    type: "conversations_select",
                    placeholder: {
                        type: "plain_text",
                        text: "Select private conversation",
                        emoji: true,
                    },
                    action_id: CONVERSATION_SELECT_ACTION,
                    response_url_enabled: true,
                    initial_conversation: channelId
                },
                label: {
                    type: "plain_text",
                    text: "Chat",
                    emoji: true,
                },
            },
        ],
        type: "modal",
    };
}
