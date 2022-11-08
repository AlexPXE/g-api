import * as fs from 'fs/promises';
import { 
    YTubePl, 
    YTubePlItems, 
    YTubeSubscr,
    options  
    
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

    for (let {items} of await pl.list() ) {        
        for (let item of items) {
            const {
                id,
                status: { privacyStatus },
                snippet: { title, description }
            } = item;
    
            playlists.push({
                title,
                description,
                privacyStatus,
                items: ( await plItems.list(id) ).reduce(
                    (acc, {items}) => items.reduce(
                        ( acc, {contentDetails: { videoId }} ) => {
                          acc.push(videoId);
                          return acc;
                        },
                        acc
                    ),
                    []
                )                
            });
        }        
    }

    db.set(
        'playlists',
        playlists
    ).set(
        'subscriptions',
        ( await  subscr.list() ).reduce(
            (acc, {items}) => items.reduce(
                (acc, { snippet: {title, resourceId} }) => {
                    acc.push({...resourceId, title});
                    return acc;
                },
                acc
            ),            
            []
        )
    );    
    
    await fs.writeFile( 
        dbPath, 
        JSON.stringify( [...db], null, 4)
    );
}

export { ytBackup }

