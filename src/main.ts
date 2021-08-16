import "reflect-metadata";

import express = require("express");
import { urlencoded } from "body-parser";
import fetch from "node-fetch";

import {
    BUG_LABEL_ACTION,
    CONVERSATION_SELECT_ACTION,
    GITHUB_URL_ACTION,
    SCOPE_INPUT_ACTION,
    showConfigurationModal,
    showConfigurationModalPrompt,
    SHOW_MODAL_BUTTON,
} from "./commands/show-configuration-modal.command";
import { ConfigFormSubmission, ConfigFormValues } from "./models/slack.models";
import { registerGithubRepository } from "./commands/register-github-repo.command";
import { createConnection } from "typeorm";
import { formatGhReport } from "./utils/format-gh-report";

createConnection();

const app = express();
const port = process.env.PORT || 3000;
const Authorization = `Bearer ${process.env.BOT_TOKEN}`;

app.use(urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/config", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(showConfigurationModalPrompt()));
});

app.post("/slack/interactivity", async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    const payload = JSON.parse(req.body?.payload);
    const actions: Array<any> = payload?.actions || [];

    if (checkInteractiveIsConfigForm(payload)) {
        const values = Object.values(payload.view.state.values).reduce(
            (current, next) => {
                Object.assign(current, next);
                return current;
            },
            {}
        ) as ConfigFormValues;

        const responseUrl = payload.response_urls[0];

        res.sendStatus(204);
        res.end();

        const repo = await registerGithubRepository(
            values[GITHUB_URL_ACTION].value,
            values[SCOPE_INPUT_ACTION].value.split("\n"),
            values[BUG_LABEL_ACTION].value,
            values[CONVERSATION_SELECT_ACTION].selected_conversation
        );

        console.log('Formatted data: ', formatGhReport(repo))

        await fetch(responseUrl.response_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: formatGhReport(repo),
                mrkdown: true
            }),
        });

        return;
    }

    if (actions.some((x) => x.action_id === SHOW_MODAL_BUTTON)) {
        return await handleShowModal(payload, res);
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

async function handleShowModal(payload: any, res: express.Response) {
    const body = {
        trigger_id: payload.trigger_id,
        view: await showConfigurationModal(payload?.channel?.id),
    };

    const response: { ok: boolean } = await fetch(
        "https://slack.com/api/views.open",
        {
            body: JSON.stringify(body),
            method: "POST",
            headers: {
                Authorization,
                "Content-Type": "application/json",
            },
        }
    ).then((x) => x.json());
    res.sendStatus(response.ok ? 200 : 500);
}

function checkInteractiveIsConfigForm(
    payload: any
): payload is ConfigFormSubmission {
    return payload?.type === "view_submission";
}
