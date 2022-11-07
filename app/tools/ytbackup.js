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
async function ytBackup(params, dbPath) {
    const
        pl = new YTubePl(params),
        plItems = new YTubePlItems(params),
        subscr = new YTubeSubscr(params),        
        db = new Map(
            JSON.parse(
                await fs.readFile(dbPath, 'utf-8')
            )
        ),
        playlists = []
    ;
    
    

    for (let item of ( await pl.list() ).items ) {
        
        const {
            id,
            status: { privacyStatus },
            snippet: { title }
        } = item;

        playlists.push({
            title,
            privacyStatus,
            items: ( await plItems.list(id) ).items.map(
                ( { contentDetails : { videoId } } ) => videoId
            )
        });
    }

    db.set(
        'playlists',
        playlists
    ).set(
        'subscriptions',
        ( await subscr.list() ).items.map(
            ({ snippet: {title, resourceId} }) => {return {...resourceId, title}}
        )
    );    
    
    await fs.writeFile( 
        dbPath, 
        JSON.stringify( [...db], null, 4)
    );
}

export { ytBackup }

