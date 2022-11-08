"use strict";

import {
    Peformer,
    options,
    startServer,
    ytBackup,
    ytRestore

} from '../index.js';

export const exec = new Peformer()
    .set(
        "server",
        "Server start. server [portNumber]",
        async ([serverUrl = options.serverUrl]) => await startServer(serverUrl, options.dbPath)

    ).set(
        "backup",
        "Get data (playlists, playlist items, subscriptions) and store them in the database.",
        async () => await ytBackup(options.ytAPI, options.dbPath)
    ).set(
        "restore",
        "Restore data (playlists, playlist items, subscriptions)",
        async () => await ytRestore(options.ytAPI, options.dbPath)
    )
;
