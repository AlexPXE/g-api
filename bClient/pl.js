// ==UserScript==
// @name         yt playlists save
// @namespace    http://tampermonkey.net/
// @version      0.1a
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/*
// @icon         https://www.youtube.com/s/desktop/f06ee14b/img/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';   

    const 
        ytHead = document.querySelector('head'),
        d = document,
        styles = document.createElement('style'),
        ytHeader = d.querySelector('#masthead'),
        serverURL = 'http://localhost:3000',

        options = {
            plItems: '#container .playlist-items.style-scope.ytd-playlist-panel-renderer a#wc-endpoint.yt-simple-endpoint.style-scope.ytd-playlist-panel-video-renderer',
            savedPls: 'ytd-browse a[href^="/playlist?list="]',
            POST: {
                url: serverURL + "/backup",  
            },
            GET: {
                url: serverURL + '/restore?name=',    
            }
        },

        createEl = (tagName, textC = '', ...classes) => {
            const el = d.createElement(tagName);
            classes === '' || el.classList.add(...classes);
            el.textContent = textC;
            return el;
        }
    ;

    styles.setAttribute('type', 'text/css');

    styles.textContent = `
        .wMenu {
            position: absolute;
            z-index: 9;
            max-height: 250px;
            padding-bottom: 20px;
            background-color: #f1f1f1;
            border: 1px solid #d3d3d3;
            text-align: center;
            display: none;
        }

        .wHead {
            padding: 10px;
            cursor: move;
            z-index: 10;
            background-color: #2196F3;
            color: #fff;
        }

        .wbContainer {
            width: 80%;
            margin-right: auto;
            margin-left: auto;
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
        }

        .wInput {            
            margin-top: 10px;
        }

        .wButton {
            width: 45%;
        }
        
        .wInfo {
            z-index: 11;
            box-sizing: border-box;
            margin-right: 10px;
            margin-left: 10px;
            margin-top: 10px;
            width: 200px;
            height: 50px;      
            background-color: #97b457;
            border: 4px groove #b6b8b6;
            color: green;
            font-size: 12px;            
        }

        .wError {
            color: red;
        }

        .wSuccess {
            color: black;
        }
    `;

    const 
        wMenu = createEl('div', '', 'wMenu'),
        wHead = createEl('div', '', 'wHead'),
        wInfo = createEl('div', '', 'wInfo', 'wSuccess'),
        wbContainer = createEl('div', '', 'wbContainer'),
        wbBackup = createEl('button', 'Backup', 'wButton'),
        wbRestore = createEl('button', 'Restore', 'wButton')
    ;
    
    ytHead.append(styles);
    wMenu.append(wHead, wInfo, wbContainer);
    wbContainer.append(wbBackup, wbRestore);
    ytHeader.append(wMenu);
    dragElement(wMenu);

    const url = new URL(window.location.href);

    if ( /playlists$/.test(url.pathname) ) {
        getSavedPls();
    } else if( url.searchParams.has("list") ) {
        getPlitems();
    }

    function getSavedPls() {        
        wHead.textContent = "Get saved playlists ID";

        wbContainer.addEventListener("click", async ({target}) => {            

            if (target === wbRestore) {            
                await getData(options.GET.url + "saved playlists");
            } else if (target === wbBackup) {

                const
                    a = d.querySelectorAll(options.savedPls),
                    items = []
                ;

                if (a.length === 0) {
                    wInfo.textContent = "No Data";
                    return;
                }

                for(let {href} of a) {  
                    items.push( new URL(href).searchParams.get('list') );
                }
                
                await sendData(options.POST.url, "saved playlists", items);
            }
        });

        showEl(wMenu);
    }

    function getPlitems() {
        const wInput = createEl('input', '', 'wInput');
        wHead.textContent = "Get playlist items URLs";
        wInfo.before(wInput);
        

        wbContainer.addEventListener('click', async ({target}) => {            

            if (target === wbRestore) {            
                await getData(options.GET.url + wInput.value);
            } else if (target === wbBackup) {
                const 
                    plItems = d.querySelectorAll(options.plItems),
                    hrefs = []
                ;

                if (plItems.length === 0) {
                    wInfo.textContent = "No Data";
                    return;
                }

                for (let {href} of plItems) {
                    hrefs.push(href);
                }
                
                await sendData(options.POST.url, wInput.value, hrefs);
            }
        });

        showEl(wMenu);
    }

    function showEl(el) {
        el.style.display = "block";
    }

    function hideEl(el) {
        el.style.display = "none";
    }

    function dragElement(elmnt) {
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0
        ;

        wHead.addEventListener('mousedown', dragMouseDown);

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get mouse cursor position when detected:
            pos3 = e.clientX;
            pos4 = e.clientY;

            document.addEventListener('mouseup', closeDragElement);
            // function call each time the cursor is moved:
            document.addEventListener('mousemove', elementDrag);            
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calc new element position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set new element position
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // clear listeners
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);            
        }
    }

    async function sendData(url, name, data) {
        wInfo.classList.replace('wError', 'wSuccess');
        wInfo.textContent = 'Sending...';

        try {
            const resp = await fetch(
                url, 
                {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        items: data
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.debug('Sent');

            if (resp.ok) {                
                wInfo.textContent = 'Successfully sent';
            } else {
                throw new Error("ERROR!");
            }

            return true;

        } catch(e){

            console.log(e.message);
            wInfo.classList.replace('wSuccess', 'wError');
            wInfo.textContent = 'ERROR!';            
            return false;
        }
    }

    async function getData(url) {
        wInfo.classList.replace('wError', 'wSuccess');
        wInfo.textContent = 'Receiving...';

        try {
            const resp = await fetch(url);

            if (resp.ok) {
                wInfo.textContent = 'Successfully received';
                return await resp.json();

            } else {
                throw new Error();
            }

        } catch(e) {

            console.log("ERROR!");
            wInfo.classList.replace('wSuccess', 'wError');
            wInfo.textContent = 'ERROR!';
            return {};
        }
    }    
})();