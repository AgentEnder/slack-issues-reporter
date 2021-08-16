import {
    BUG_LABEL_ACTION,
    CONVERSATION_SELECT_ACTION,
    GITHUB_URL_ACTION,
    SCOPE_INPUT_ACTION,
} from "../commands/show-configuration-modal.command";

export interface ConfigFormSubmission {
    type: "view_submission";
    user: unknown;
    trigger_id: string;
    view: {
        id: string;
        type: string;
        state: {
            values: {
                [uuid: string]: Partial<ConfigFormValues>;
            };
        };
    };
    response_urls: {
        block_id: string;
        action_id: string;
        channel_id: string;
        response_url: string;
    }[];
}

export interface ConfigFormValues {
    [GITHUB_URL_ACTION]: plainTextInputValue;
    [CONVERSATION_SELECT_ACTION]: channelSelectValue;
    [BUG_LABEL_ACTION]: plainTextInputValue;
    [SCOPE_INPUT_ACTION]: plainTextInputValue;
}

export type channelSelectValue = {
    type: "conversations_select";
    selected_conversation: string;
};

export type plainTextInputValue = {
    type: "plain_text_input";
    value: string;
};
