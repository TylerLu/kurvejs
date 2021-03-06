namespace Kurve {

    export enum EndpointVersion {
        v1=1,
        v2=2
    }

    export enum Mode {
        Client = 1,
        Node = 2
    }

    class CachedToken {
        constructor(
            public id: string,
            public scopes: string[],
            public resource: string,
            public token: string,
            public expiry: Date) {};

        public get isExpired() {
            return this.expiry <= new Date(new Date().getTime() + 60000);
        }

        public hasScopes(requiredScopes: string[]) {
            if (!this.scopes) {
                return false;
            }

            return requiredScopes.every(requiredScope => {
                return this.scopes.some(actualScope => requiredScope === actualScope);
            });
        }
    }

    interface CachedTokenDictionary {
        [index: string]: CachedToken;
    }

    export interface TokenStorage {
        add(key: string, token: any);
        remove(key: string);
        getAll(): any[];
        clear();
    }

    class TokenCache {
        private cachedTokens: CachedTokenDictionary;

        constructor(private tokenStorage?: TokenStorage) {
            this.cachedTokens = {};
            if (tokenStorage) {
                tokenStorage.getAll().forEach(({ id, scopes, resource, token, expiry }) => {
                    var cachedToken = new CachedToken(id, scopes, resource, token, new Date(expiry));
                    if (cachedToken.isExpired) {
                        this.tokenStorage.remove(cachedToken.id);
                    } else {
                        this.cachedTokens[cachedToken.id] = cachedToken;
                    }
                });
            }
        }

        public add(token: CachedToken) {
            this.cachedTokens[token.id] = token;
            this.tokenStorage && this.tokenStorage.add(token.id, token);
        }

        public getForResource(resource: string): CachedToken {
            var cachedToken = this.cachedTokens[resource];
            if (cachedToken && cachedToken.isExpired) {
                this.remove(resource);
                return null;
            }
            return cachedToken;
        }

        public getForScopes(scopes: string[]): CachedToken {
            for (var key in this.cachedTokens) {
                var cachedToken = this.cachedTokens[key];

                if (cachedToken.hasScopes(scopes)) {
                    if (cachedToken.isExpired) {
                        this.remove(key);
                    } else {
                        return cachedToken;
                    }
                }
            }

            return null;
        }

        public clear() {
            this.cachedTokens = {};
            this.tokenStorage && this.tokenStorage.clear();
        }

        private remove(key) {
            this.tokenStorage && this.tokenStorage.remove(key);
            delete this.cachedTokens[key];
        }
    }

    export class IdToken {
        public Token: string;
        public IssuerIdentifier: string;
        public SubjectIdentifier: string;
        public Audience: string;
        public Expiry: Date;
        public UPN: string;
        public TenantId: string;
        public FamilyName: string;
        public GivenName: string;
        public Name: string;
        public PreferredUsername: string;
        public FullToken: any;

    }

    export interface IdentitySettings {
        endpointVersion?: EndpointVersion;
        mode?: Mode;
        appSecret?: string;
        tokenStorage?: TokenStorage;
    }

    export class Identity {
        private state: string;
        private nonce: string;
        private idToken: IdToken;
        private loginCallback: (error: Error) => void;
        private getTokenCallback: (token: string, error: Error) => void;
        private tokenCache: TokenCache;
        private refreshTimer: any;
        private policy: string = "";
        private appSecret: string;
        private NodePersistDataCallBack: (key: string, value: string, expiry: Date) => void;
        private NodeRetrieveDataCallBack: (key: string) => string;
        private req: any;
        private res: any;

        // these are public so that Kurve.Graph can access them
        endpointVersion: EndpointVersion = EndpointVersion.v1;
        mode: Mode = Mode.Client;
        https: any;

        constructor(public clientId:string, public tokenProcessorUrl: string, options?: IdentitySettings) {
//          this.req = new XMLHttpRequest();
            if (options && options.endpointVersion)
                this.endpointVersion = options.endpointVersion;
            if (options && options.appSecret)
                this.appSecret=options.appSecret;
            if (options && options.mode)
                this.mode = options.mode;

            if (this.mode === Mode.Client) {

                this.tokenCache = new TokenCache(options && options.tokenStorage);

                //Callback handler from other windows
                window.addEventListener("message", event => {
                    if (event.data.type === "id_token") {
                        if (event.data.error) {
                            var e: Error = new Error();
                            e.text = event.data.error;
                            this.loginCallback(e);

                        } else {
                            //check for state
                            if (this.state !== event.data.state) {
                                var error = new Error();
                                error.statusText = "Invalid state";
                                this.loginCallback(error);
                            } else {
                                this.decodeIdToken(event.data.token);
                                this.loginCallback(null);
                            }
                        }
                    } else if (event.data.type === "access_token") {
                        if (event.data.error) {
                            var e: Error = new Error();
                            e.text = event.data.error;
                            this.getTokenCallback(null, e);

                        } else {
                            var token: string = event.data.token;
                            var iframe = document.getElementById("tokenIFrame");
                            iframe.parentNode.removeChild(iframe);

                            if (event.data.state !== this.state) {
                                var error = new Error();
                                error.statusText = "Invalid state";
                                this.getTokenCallback(null, error);
                            }
                            else {
                                this.getTokenCallback(token, null);
                            }
                        }
                    }
                });
            }
        }

        private parseQueryString(str: string) {
            var queryString = str || window.location.search || '';
            var keyValPairs: any[] = [];
            var params: any = {};
            queryString = queryString.replace(/.*?\?/, "");

            if (queryString.length) {
                keyValPairs = queryString.split('&');
                for (var pairNum in keyValPairs) {
                    var key = keyValPairs[pairNum].split('=')[0];
                    if (!key.length) continue;
                    if (typeof params[key] === 'undefined')
                        params[key] = [];
                    params[key].push(keyValPairs[pairNum].split('=')[1]);
                }
            }
            return params;
        }

        private token(s: string, url: string) {
            var start = url.indexOf(s);
            if (start < 0) return null;
            var end = url.indexOf("&", start + s.length);
            return url.substring(start, ((end > 0) ? end : url.length));
        }

        public checkForIdentityRedirect(): boolean {
            var params = this.parseQueryString(window.location.href);
            var idToken = this.token("#id_token=", window.location.href);
            var accessToken = this.token("#access_token", window.location.href);
            if (idToken) {
                if (true || this.state === params["state"][0]) { //BUG? When you are in a pure redirect system you don't remember your state or nonce so don't check.
                    this.decodeIdToken(idToken);
                    this.loginCallback && this.loginCallback(null);
                } else {
                    var error = new Error();
                    error.statusText = "Invalid state";
                    this.loginCallback && this.loginCallback(error);
                }
                return true;
            }
            else if (accessToken) {
                throw "Should not get here.  This should be handled via the iframe approach."
            }
            return false;
        }

        private decodeIdToken(idToken: string): void {

            var decodedToken = this.base64Decode(idToken.substring(idToken.indexOf('.') + 1, idToken.lastIndexOf('.')));
            var decodedTokenJSON = JSON.parse(decodedToken);
            var expiryDate = new Date(new Date('01/01/1970 0:0 UTC').getTime() + parseInt(decodedTokenJSON.exp) * 1000);
            this.idToken = new IdToken();
            this.idToken.FullToken = decodedTokenJSON;
            this.idToken.Token = idToken;
            this.idToken.Expiry = expiryDate;
            this.idToken.UPN = decodedTokenJSON.upn;
            this.idToken.TenantId = decodedTokenJSON.tid;
            this.idToken.FamilyName = decodedTokenJSON.family_name;
            this.idToken.GivenName = decodedTokenJSON.given_name;
            this.idToken.Name = decodedTokenJSON.name;
            this.idToken.PreferredUsername = decodedTokenJSON.preferred_username;

            var expiration: Number = expiryDate.getTime() - new Date().getTime() - 300000;

            this.refreshTimer = setTimeout((() => {
                this.renewIdToken();
            }), expiration);
        }

        private decodeAccessToken(accessToken: string, resource?:string, scopes?:string[]): CachedToken {
            var decodedToken = this.base64Decode(accessToken.substring(accessToken.indexOf('.') + 1, accessToken.lastIndexOf('.')));
            var decodedTokenJSON = JSON.parse(decodedToken);
            var expiryDate = new Date(new Date('01/01/1970 0:0 UTC').getTime() + parseInt(decodedTokenJSON.exp) * 1000);
            var key = resource || scopes.join(" ");

            var token = new CachedToken(key, scopes, resource, accessToken, expiryDate);
            return token;
        }

        public getIdToken(): any {
            return this.idToken;
        }
        public isLoggedIn(): boolean {
            if (!this.idToken) return false;
            return (this.idToken.Expiry > new Date());
        }

        private renewIdToken(): void {
            clearTimeout(this.refreshTimer);
            this.login(() => { });
        }

        public getAccessTokenAsync(resource: string): Promise<string,Error> {

            var d = new Deferred<string,Error>();
            this.getAccessToken(resource, ((error, token) => {
                if (error) {
                    d.reject(error);
                } else {
                    d.resolve(token);
                }
            }));
            return d.promise;
        }

        public getAccessToken(resource: string, callback: PromiseCallback<string>): void {
            if (this.endpointVersion !== EndpointVersion.v1) {
                var e = new Error();
                e.statusText = "Currently this identity class is using v2 OAuth mode. You need to use getAccessTokenForScopes() method";
                callback(e);
                return;
            }
            if (this.mode === Mode.Client) {
                var token = this.tokenCache.getForResource(resource);
                if (token) {
                    return callback(null, token.token);
                }

                //If we got this far, we need to go get this token

                //Need to create the iFrame to invoke the acquire token
                this.getTokenCallback = ((token: string, error: Error) => {
                    if (error) {
                        callback(error);
                    }
                    else {
                        var t = this.decodeAccessToken(token, resource);
                        this.tokenCache.add(t);
                        callback(null, token);
                    }
                });

                this.nonce = "token" + this.generateNonce();
                this.state = "token" + this.generateNonce();

                var iframe = document.createElement('iframe');
                iframe.style.display = "none";
                iframe.id = "tokenIFrame";

                iframe.src = this.tokenProcessorUrl + "?clientId=" + encodeURIComponent(this.clientId) +
                    "&resource=" + encodeURIComponent(resource) +
                    "&redirectUri=" + encodeURIComponent(this.tokenProcessorUrl) +
                    "&state=" + encodeURIComponent(this.state) +
                    "&version=" + encodeURIComponent(this.endpointVersion.toString()) +
                    "&nonce=" + encodeURIComponent(this.nonce) +
                    "&op=token";

                document.body.appendChild(iframe);
            } else {
                var cookies = this.parseNodeCookies(this.req);
                var upn = this.NodeRetrieveDataCallBack("session|" + cookies["kurveSession"]);
                var code = this.NodeRetrieveDataCallBack("code|" + upn);

                var post_data = "grant_type=authorization_code" +
                    "&client_id=" + encodeURIComponent(this.clientId) +
                    "&code=" + encodeURIComponent(code) +
                    "&redirect_uri=" + encodeURIComponent(this.tokenProcessorUrl) +
                    "&resource=" + encodeURIComponent(resource) +
                    "&client_secret=" + encodeURIComponent(this.appSecret);

                var post_options = {
                    host: 'login.microsoftonline.com',
                    port: '443',
                    path: '/common/oauth2/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post_data.length,
                        accept: '*/*'
                    }
                };

                var post_req = this.https.request(post_options, (response) => {
                    response.setEncoding('utf8');
                    response.on('data', (chunk) => {
                        var chunkJson = JSON.parse(chunk);
                        var t = this.decodeAccessToken(chunkJson.access_token, resource);
                        // this.tokenCache.add(t); //TODO: Persist/retrieve token cache no server
                        callback(null, chunkJson.access_token);
                    });
                });

                post_req.write(post_data);
                post_req.end();
            }
        }

        private parseNodeCookies(req) {
            var list = {};
            var rc = req.headers.cookie;

            rc && rc.split(';').forEach(function (cookie) {
                var parts = cookie.split('=');
                list[parts.shift().trim()] = decodeURI(parts.join('='));
            });

            return list;
        }
        public handleNodeCallback(req: any, res: any, https: any, crypto: any, persistDataCallback: (key: string, value: string, expiry: Date) => void, retrieveDataCallback: (key: string) => string): Promise<boolean, Error> {
            this.NodePersistDataCallBack = persistDataCallback;
            this.NodeRetrieveDataCallBack = retrieveDataCallback;
            var url: string = <string>req.url;

            this.req = req;
            this.res = res;
            this.https = https;

            var params = this.parseQueryString(url);
            var code = this.token("code=", url);
            var accessToken = this.token("#access_token", url);
            var cookies = this.parseNodeCookies(req);

            var d = new Deferred<boolean, Error>();

            if (this.endpointVersion === EndpointVersion.v1) {

                if (code) {
                    var codeFromRequest = params["code"][0];
                    var stateFromRequest = params["state"][0];
                    var cachedState = retrieveDataCallback("state|" + stateFromRequest);
                    if (cachedState) {
                        if (cachedState === "waiting") {
                            var expiry = new Date(new Date().getTime() + 86400000);
                            persistDataCallback("state|" + stateFromRequest, "done", expiry);

                            var post_data = "grant_type=authorization_code" +
                                "&client_id=" + encodeURIComponent(this.clientId) +
                                "&code=" + encodeURIComponent(codeFromRequest) +
                                "&redirect_uri=" + encodeURIComponent(this.tokenProcessorUrl) +
                                "&resource=" + encodeURIComponent("https://graph.microsoft.com") +
                                "&client_secret=" + encodeURIComponent(this.appSecret);

                            var post_options = {
                                host: 'login.microsoftonline.com',
                                port: '443',
                                path: '/common/oauth2/token',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Content-Length': post_data.length,
                                    accept: '*/*'
                                }
                            };

                            var post_req = https.request(post_options, (response) => {
                                response.setEncoding('utf8');
                                response.on('data', (chunk) => {
                                    var chunkJson = JSON.parse(chunk);
                                    var decodedToken = JSON.parse(this.base64Decode(chunkJson.access_token.substring(chunkJson.access_token.indexOf('.') + 1, chunkJson.access_token.lastIndexOf('.'))));
                                    var upn = decodedToken.upn;
                                    var sha = crypto.createHash('sha256');
                                    sha.update(Math.random().toString());
                                    var sessionID = sha.digest('hex');
                                    var expiry = new Date(new Date().getTime() + 30 * 60 * 1000);
                                    persistDataCallback("session|" + sessionID, upn, expiry);
                                    persistDataCallback("code|" + upn, codeFromRequest, expiry);
                                    res.writeHead(302, {
                                        'Set-Cookie': 'kurveSession=' + sessionID,
                                        'Location': '/'
                                    });
                                    res.end();
                                    d.resolve(false);

                                });
                            });

                            post_req.write(post_data);
                            post_req.end();
                        } else {
                            //same state has been reused, not allowed
                            res.writeHead(500, "Replay detected", { 'content-type': 'text/plain' });
                            res.end("Replay detected");
                            d.resolve(false);
                        }
                    }
                    else {
                        //state doesn't match any of our cached ones
                        res.writeHead(500, "State doesn't match", { 'content-type': 'text/plain' });
                        res.end("State doesn't match");
                        d.resolve(false);
                    }
                    return d.promise;

                } else {
                    if (cookies["kurveSession"]) {
                        var upn = retrieveDataCallback("session|" + cookies["kurveSession"]);
                        if (upn) {
                            d.resolve(true);
                            return d.promise;
                        }
                    }
                    var state: string = this.generateNonce();
                    var expiry = new Date(new Date().getTime() + 900000);

                    persistDataCallback("state|" + state, "waiting", expiry);

                    var url = "https://login.microsoftonline.com/common/oauth2/authorize?response_type=code&client_id=" +
                        encodeURIComponent(this.clientId) +
                        "&redirect_uri=" + encodeURIComponent(this.tokenProcessorUrl) +
                        "&state=" + encodeURIComponent(state);

                    res.writeHead(302, { 'Location': url });

                    res.end();
                    d.resolve(false);
                    return d.promise;
                }
            } else {
                //TODO: v2
                d.resolve(false);
                return d.promise;
            }
        }
        public getAccessTokenForScopesAsync(scopes: string[], promptForConsent = false): Promise<string, Error> {

            var d = new Deferred<string, Error>();
            this.getAccessTokenForScopes(scopes, promptForConsent, (token, error) => {
                if (error) {
                    d.reject(error);
                } else {
                    d.resolve(token);
                }
            });
            return d.promise;
        }

        public getAccessTokenForScopes(scopes: string[], promptForConsent, callback: (token: string, error: Error) => void): void {
            if (this.endpointVersion !== EndpointVersion.v2) {
                var e = new Error();
                e.statusText = "Dynamic scopes require v2 mode. Currently this identity class is using v1";
                callback(null, e);
                return;
            }

            var token = this.tokenCache.getForScopes(scopes);
            if (token) {
                return callback(token.token, null);
            }

            //If we got this far, we don't have a valid cached token, so will need to get one.

            //Need to create the iFrame to invoke the acquire token

            this.getTokenCallback = ((token: string, error: Error) => {
                if (error) {
                    if (promptForConsent || !error.text) {
                        callback(null, error);
                    } else if (error.text.indexOf("AADSTS65001")>=0) {
                        //We will need to try getting the consent
                        this.getAccessTokenForScopes(scopes, true, this.getTokenCallback);
                    } else {
                        callback(null, error);
                    }
                }
                else {
                    var t = this.decodeAccessToken(token, null, scopes);
                    this.tokenCache.add(t);
                    callback(token, null);
                }
            });

            this.nonce = "token" + this.generateNonce();
            this.state = "token" + this.generateNonce();

            if (!promptForConsent) {
                var iframe = document.createElement('iframe');
                iframe.style.display = "none";
                iframe.id = "tokenIFrame";
                iframe.src = this.tokenProcessorUrl + "?clientId=" + encodeURIComponent(this.clientId) +
                    "&scopes=" + encodeURIComponent(scopes.join(" ")) +
                    "&redirectUri=" + encodeURIComponent(this.tokenProcessorUrl) +
                    "&version=" + encodeURIComponent(this.endpointVersion.toString()) +
                    "&state=" + encodeURIComponent(this.state) +
                    "&nonce=" + encodeURIComponent(this.nonce) +
                    "&login_hint=" + encodeURIComponent(this.idToken.PreferredUsername) +
                    "&domain_hint=" + encodeURIComponent(this.idToken.TenantId === "9188040d-6c67-4c5b-b112-36a304b66dad" ? "consumers" : "organizations") +
                    "&op=token";
                document.body.appendChild(iframe);
            } else {
                window.open(this.tokenProcessorUrl + "?clientId=" + encodeURIComponent(this.clientId) +
                    "&scopes=" + encodeURIComponent(scopes.join(" ")) +
                    "&redirectUri=" + encodeURIComponent(this.tokenProcessorUrl) +
                    "&version=" + encodeURIComponent(this.endpointVersion.toString()) +
                    "&state=" + encodeURIComponent(this.state) +
                    "&nonce=" + encodeURIComponent(this.nonce) +
                    "&op=token"
                    , "_blank");
            }
        }

        public loginAsync(loginSettings?: { scopes?: string[], policy?: string, tenant?: string }): Promise<void, Error> {
        //TODO: Not node compatible
            var d = new Deferred<void, Error>();
            this.login((error) => {
                if (error) {
                    d.reject(error);
                }
                else {
                    d.resolve(null);
                }
            }, loginSettings);
            return d.promise;
        }

        public login(callback: (error: Error) => void, loginSettings?: { scopes?: string[], policy?: string, tenant?: string }): void {
        //TODO: Not node compatible
            this.loginCallback = callback;
            if (!loginSettings) loginSettings = {};
            if (loginSettings.policy) this.policy = loginSettings.policy;

            if (loginSettings.scopes && this.endpointVersion === EndpointVersion.v1) {
                var e = new Error();
                e.text = "Scopes can only be used with OAuth v2.";
                callback(e);
                return;
            }

            if (loginSettings.policy && !loginSettings.tenant) {
                var e = new Error();
                e.text = "In order to use policy (AAD B2C) a tenant must be specified as well.";
                callback(e);
                return;
            }
            this.state = "login" + this.generateNonce();
            this.nonce = "login" + this.generateNonce();
            var loginURL = this.tokenProcessorUrl + "?clientId=" + encodeURIComponent(this.clientId) +
                "&redirectUri=" + encodeURIComponent(this.tokenProcessorUrl) +
                "&state=" + encodeURIComponent(this.state) +
                "&nonce=" + encodeURIComponent(this.nonce) +
                "&version=" + encodeURIComponent(this.endpointVersion.toString()) +
                "&op=login" +
                "&p=" + encodeURIComponent(this.policy);
            if (loginSettings.tenant) {
                loginURL += "&tenant=" + encodeURIComponent(loginSettings.tenant);
            }
            if (this.endpointVersion === EndpointVersion.v2) {
                    if (!loginSettings.scopes) loginSettings.scopes = [];
                    if (loginSettings.scopes.indexOf("profile") < 0)
                        loginSettings.scopes.push("profile");
                    if (loginSettings.scopes.indexOf("openid") < 0)
                        loginSettings.scopes.push("openid");

                    loginURL += "&scopes=" + encodeURIComponent(loginSettings.scopes.join(" "));
            }
            window.open(loginURL, "_blank");
        }


        public loginNoWindowAsync(toUrl?: string): Promise<void, Error> {
        //TODO: Not node compatible
            var d = new Deferred<void, Error>();
            this.loginNoWindow((error) => {
                if (error) {
                    d.reject(error);
                }
                else {
                    d.resolve(null);
                }
            }, toUrl);
            return d.promise;
        }

        public loginNoWindow(callback: (error: Error) => void, toUrl?: string): void {
        //TODO: Not node compatible
            this.loginCallback = callback;
            this.state = "clientId=" + this.clientId + "&" + "tokenProcessorUrl=" + this.tokenProcessorUrl
            this.nonce = this.generateNonce();

            var redirected = this.checkForIdentityRedirect();
            if (!redirected) {
                var redirectUri = (toUrl) ? toUrl : window.location.href.split("#")[0];  // default the no login window scenario to return to the current page
                var url = "https://login.microsoftonline.com/common/oauth2/authorize?response_type=id_token" +
                    "&client_id=" + encodeURIComponent(this.clientId) +
                    "&redirect_uri=" + encodeURIComponent(redirectUri) +
                    "&state=" + encodeURIComponent(this.state) +
                    "&nonce=" + encodeURIComponent(this.nonce);
                window.location.href = url;
            }
        }

        public logOut(): void {
        //TODO: Not node compatible
            this.tokenCache.clear();
            var url = "https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=" + encodeURI(window.location.href);
            window.location.href = url;
        }

        private base64Decode(encodedString: string): string {
            var e: any = {}, i: number, b = 0, c: number, x: number, l = 0, a: any, r = '', w = String.fromCharCode, L = encodedString.length;
            var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            for (i = 0; i < 64; i++) { e[A.charAt(i)] = i; }
            for (x = 0; x < L; x++) {
                c = e[encodedString.charAt(x)];
                b = (b << 6) + c;
                l += 6;
                while (l >= 8) {
                    ((a = (b >>> (l -= 8)) & 0xff) || (x < (L - 2))) && (r += w(a));
                }
            }
            return r;
        }

        private generateNonce(): string {
            var text = "";
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 32; i++) {
                text += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return text;
        }
    }

}