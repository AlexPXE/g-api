"use strict"

import {
    YouTubeAPI,
    YTubePl,
    YTubePlItems,
    YTubeSubscr
} from "../index.js";

class YTBackup extends YouTubeAPI{
    pl;
    plItems;
    subscr;
    db;

    /**
     * 
     * @param {object} options
     * @param {Array<string>} options.scopes 
     * example: 
     * [
     *  "https://www.googleapis.com/auth/youtube.readonly",
     *  'https://www.googleapis.com/auth/youtube.force-ssl'
     * ]
     * @param {string} options.tokenDir The directory where the token should be stored
     * @param {string} options.tokenFN Token file name
     * @param {string} options.clientSecretDir The directory where the client_secret.json file is stored
     * @param {object} ytServiceClasses
     * @param {class} ytServiceClasses.Playlists
     * @param {class} ytServiceClasses.Plitems 
     * @param {class} ytServiceClasses.Subscriptions 
     * @param {class} DB
     */
    constructor(options, ytServiceClasses, DB) {
        super(options);

        this.pl = new ytServiceClasses.Playlists(this);
        this.plItems = new ytServiceClasses.Plitems(this);
        this.subscriptions = new ytServiceClasses.Subscriptions(this);
        this.db = new DB();
    }

    async restore() {

    }

    async backup() {
        const {
            pl,
            plItems,
            subscr
        } = this;

        const data = [];

        for (let {items} of await pl.list() ) {        
            for (let item of items) {
                const {
                    id,
                    status: { privacyStatus },
                    snippet: { title, description }
                } = item;
        
                data.push({
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
            data
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

        return data
    }
}