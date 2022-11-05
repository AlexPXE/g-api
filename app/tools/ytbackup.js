import * as fs from 'fs/promises';
import { 
    YTubePl, 
    YTubePlItems, 
    YTubeSubscr,    
    
} from '../index.js';

/**
* 
* @param {Object} [params] 
* @param {Array<string>} [params.scopes] example: `['https://www.googleapis.com/auth/youtube.readonly']`
* @param {string} [params.tokenDir] example: `'C:\\Users\\userName\\.credentials\\'`
* @param {string} [params.tokenFN] example: `'yt.json'`
*/
async function ytBackup(params) {
    const
        pl = new YTubePl(params),
        plItems = new YTubePlItems(params),
        subscr = new YTubeSubscr(params),
        dbPath = 'db/db.json',
        db = new Map(
            JSON.parse(
                await fs.readFile(dbPath, 'utf-8')
            )
        )
    ;
    
    //TODO: get DAtA
    db.set(
        'playlists',
        ( await pl.list() ).items.map(
            async ({
                id,
                status: {
                    privacyStatus
                },
                snippet: {
                    title,
                }

            }) => {
                return {
                    title,
                    privacyStatus,
                    items: ( await plItems(id) ).items.map(
                        async ({
                            contentDetails : {
                                videoId
                            }
                        }) => videoId
                    )
                };
            }
        )

    ).set(
        'subscriptions',
        ( await subscr.list() ).items.map(
            ({ resourceId }) => resourceId
        )
    );

    //TODO: saveDB
    await fs.writeFile( 
        dbPath, 
        JSON.stringify( [...db], null, 4)
    );
}

export { ytBackup }

