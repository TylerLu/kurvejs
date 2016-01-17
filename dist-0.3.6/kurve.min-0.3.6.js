var __extends=this&&this.__extends||function(e,t){function r(){this.constructor=e}for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);r.prototype=t.prototype,e.prototype=new r},Kurve;!function(e){function t(e){setTimeout(e,0)}var r;!function(e){e[e.Pending=0]="Pending",e[e.ResolutionInProgress=1]="ResolutionInProgress",e[e.Resolved=2]="Resolved",e[e.Rejected=3]="Rejected"}(r||(r={}));var n=function(){function e(e,t,r){this._dispatcher=e,this._successCB=t,this._errorCB=r,this.result=new o(e)}return e.prototype.resolve=function(e,t){var r=this;return"function"!=typeof this._successCB?void this.result.resolve(e):void(t?this._dispatcher(function(){return r._dispatchCallback(r._successCB,e)}):this._dispatchCallback(this._successCB,e))},e.prototype.reject=function(e,t){var r=this;return"function"!=typeof this._errorCB?void this.result.reject(e):void(t?this._dispatcher(function(){return r._dispatchCallback(r._errorCB,e)}):this._dispatchCallback(this._errorCB,e))},e.prototype._dispatchCallback=function(e,t){var r;try{r=e(t),this.result.resolve(r)}catch(n){return void this.result.reject(n)}},e}(),o=function(){function e(e){this._stack=[],this._state=r.Pending,this._dispatcher=e?e:t,this.promise=new i(this)}return e.prototype.DispatchDeferred=function(e){setTimeout(e,0)},e.prototype.then=function(e,t){if("function"!=typeof e&&"function"!=typeof t)return this.promise;var o=new n(this._dispatcher,e,t);switch(this._state){case r.Pending:case r.ResolutionInProgress:this._stack.push(o);break;case r.Resolved:o.resolve(this._value,!0);break;case r.Rejected:o.reject(this._error,!0)}return o.result.promise},e.prototype.resolve=function(e){return this._state!==r.Pending?this:this._resolve(e)},e.prototype._resolve=function(e){var t,n=this,o=typeof e,i=!0;try{if(null===e||"object"!==o&&"function"!==o||"function"!=typeof(t=e.then))this._state=r.ResolutionInProgress,this._dispatcher(function(){n._state=r.Resolved,n._value=e;var t,o=n._stack.length;for(t=0;o>t;t++)n._stack[t].resolve(e,!1);n._stack.splice(0,o)});else{if(e===this.promise)throw new TypeError("recursive resolution");this._state=r.ResolutionInProgress,t.call(e,function(e){i&&(i=!1,n._resolve(e))},function(e){i&&(i=!1,n._reject(e))})}}catch(s){i&&this._reject(s)}return this},e.prototype.reject=function(e){return this._state!==r.Pending?this:this._reject(e)},e.prototype._reject=function(e){var t=this;return this._state=r.ResolutionInProgress,this._dispatcher(function(){t._state=r.Rejected,t._error=e;var n=t._stack.length,o=0;for(o=0;n>o;o++)t._stack[o].reject(e,!1);t._stack.splice(0,n)}),this},e}();e.Deferred=o;var i=function(){function e(e){this._deferred=e}return e.prototype.then=function(e,t){return this._deferred.then(e,t)},e.prototype.fail=function(e){return this._deferred.then(void 0,e)},e}();e.Promise=i}(Kurve||(Kurve={}));var Kurve;!function(e){!function(e){e[e.v1=1]="v1",e[e.v2=2]="v2"}(e.OAuthVersion||(e.OAuthVersion={}));var t=e.OAuthVersion,r=function(){function e(){}return e}();e.Error=r;var n=function(){function e(){}return e}(),o=function(){function e(){}return e}();e.IdToken=o;var i=function(){function i(e,n,o){var i=this;void 0===e&&(e=""),void 0===n&&(n=""),this.authContext=null,this.config=null,this.isCallback=!1,this.clientId=e,this.redirectUri=n,this.req=new XMLHttpRequest,this.tokenCache={},this.version=o?o:t.v1,window.addEventListener("message",function(e){if("id_token"===e.data.type)if(e.data.error){var t=new r;t.text=e.data.error,i.loginCallback(t)}else if(i.state!==e.data.state){var n=new r;n.statusText="Invalid state",i.loginCallback(n)}else i.decodeIdToken(e.data.token),i.loginCallback(null);else if("access_token"===e.data.type)if(e.data.error){var t=new r;t.text=e.data.error,i.getTokenCallback(null,t)}else{var o=e.data.token,s=document.getElementById("tokenIFrame");if(s.parentNode.removeChild(s),e.data.state!==i.state){var n=new r;n.statusText="Invalid state",i.getTokenCallback(null,n)}else i.getTokenCallback(o,null)}})}return i.prototype.decodeIdToken=function(e){var t=this,r=this.base64Decode(e.substring(e.indexOf(".")+1,e.lastIndexOf("."))),n=JSON.parse(r),i=new Date(new Date("01/01/1970 0:0 UTC").getTime()+1e3*parseInt(n.exp));this.idToken=new o,this.idToken.Token=e,this.idToken.Expiry=i,this.idToken.UPN=n.upn,this.idToken.TenantId=n.tid,this.idToken.FamilyName=n.family_name,this.idToken.GivenName=n.given_name,this.idToken.Name=n.name,this.idToken.PreferredUsername=n.preferred_username;var s=i.getTime()-(new Date).getTime()-3e5;this.refreshTimer=setTimeout(function(){t.renewIdToken()},s)},i.prototype.decodeAccessToken=function(e,t,r){var o,i=this.base64Decode(e.substring(e.indexOf(".")+1,e.lastIndexOf("."))),s=JSON.parse(i),a=new Date(new Date("01/01/1970 0:0 UTC").getTime()+1e3*parseInt(s.exp));o=t?t:r.join(" ");var c=new n;c.expiry=a,c.resource=t,c.scopes=r,c.token=e,c.id=o,this.tokenCache[o]=c},i.prototype.getIdToken=function(){return this.idToken},i.prototype.isLoggedIn=function(){return this.idToken?this.idToken.Expiry>new Date:!1},i.prototype.renewIdToken=function(){clearTimeout(this.refreshTimer),this.login(function(){})},i.prototype.getCurrentOauthVersion=function(){return this.version},i.prototype.getAccessTokenAsync=function(t){var r=new e.Deferred;return this.getAccessToken(t,function(e,t){t?r.reject(t):r.resolve(e)}),r.promise},i.prototype.getAccessToken=function(e,n){var o=this;if(this.version!==t.v1){var i=new r;return i.statusText="Currently this identity class is using v2 OAuth mode. You need to use getAccessTokenForScopes() method",void n(null,i)}var s=null,a=Object.keys(this.tokenCache);if(a.forEach(function(t){var r=o.tokenCache[t];if(r.expiry<=new Date((new Date).getTime()+6e4))delete o.tokenCache[t];else{r.resource==e&&(s=r)}}),s&&s.expiry>new Date((new Date).getTime()+6e4))return void n(s.token,null);this.getTokenCallback=function(t,r){r?n(null,r):(o.decodeAccessToken(t,e),n(t,null))},this.nonce="token"+this.generateNonce(),this.state="token"+this.generateNonce();var c=document.createElement("iframe");c.style.display="none",c.id="tokenIFrame",c.src=this.redirectUri+"?clientId="+encodeURIComponent(this.clientId)+"&resource="+encodeURIComponent(e)+"&redirectUri="+encodeURIComponent(this.redirectUri)+"&state="+encodeURIComponent(this.state)+"&version="+encodeURIComponent(this.version.toString())+"&nonce="+encodeURIComponent(this.nonce)+"&op=token",document.body.appendChild(c)},i.prototype.getAccessTokenForScopesAsync=function(t,r){void 0===r&&(r=!1);var n=new e.Deferred;return this.getAccessTokenForScopes(t,r,function(e,t){t?n.reject(t):n.resolve(e)}),n.promise},i.prototype.getAccessTokenForScopes=function(e,n,o){var i=this;if(void 0===n&&(n=!1),this.version!==t.v2){var s=new r;return s.statusText="Dynamic scopes require v2 mode. Currently this identity class is using v1",void o(null,s)}var a=null,c=Object.keys(this.tokenCache);if(c.forEach(function(t){var r=i.tokenCache[t];if(r.expiry<=new Date((new Date).getTime()+6e4))delete i.tokenCache[t];else{var n=!0;r.scopes&&e.forEach(function(e){r.scopes.indexOf(e)<0&&(n=!1)}),n&&(a=r)}}),a&&a.expiry>new Date((new Date).getTime()+6e4))return void o(a.token,null);if(this.getTokenCallback=function(t,r){r?n||!r.text?o(null,r):r.text.indexOf("AADSTS65001")>=0?i.getAccessTokenForScopes(e,!0,i.getTokenCallback):o(null,r):(i.decodeAccessToken(t,null,e),o(t,null))},this.nonce="token"+this.generateNonce(),this.state="token"+this.generateNonce(),n)window.open(this.redirectUri+"?clientId="+encodeURIComponent(this.clientId)+"&scopes="+encodeURIComponent(e.join(" "))+"&redirectUri="+encodeURIComponent(this.redirectUri)+"&version="+encodeURIComponent(this.version.toString())+"&state="+encodeURIComponent(this.state)+"&nonce="+encodeURIComponent(this.nonce)+"&op=token","_blank");else{var u=document.createElement("iframe");u.style.display="none",u.id="tokenIFrame",u.src=this.redirectUri+"?clientId="+encodeURIComponent(this.clientId)+"&scopes="+encodeURIComponent(e.join(" "))+"&redirectUri="+encodeURIComponent(this.redirectUri)+"&version="+encodeURIComponent(this.version.toString())+"&state="+encodeURIComponent(this.state)+"&nonce="+encodeURIComponent(this.nonce)+"&login_hint="+encodeURIComponent(this.idToken.PreferredUsername)+"&domain_hint="+encodeURIComponent("9188040d-6c67-4c5b-b112-36a304b66dad"===this.idToken.TenantId?"consumers":"organizations")+"&op=token",document.body.appendChild(u)}},i.prototype.loginAsync=function(t){var r=new e.Deferred;return this.login(function(e){e?r.reject(e):r.resolve(null)},t),r.promise},i.prototype.login=function(e,n){if(this.loginCallback=e,n&&this.version===t.v1){var o=new r;return o.text="Scopes can only be used with OAuth v2.",void e(o)}this.state="login"+this.generateNonce(),this.nonce="login"+this.generateNonce();var i=this.redirectUri+"?clientId="+encodeURIComponent(this.clientId)+"&redirectUri="+encodeURIComponent(this.redirectUri)+"&state="+encodeURIComponent(this.state)+"&nonce="+encodeURIComponent(this.nonce)+"&version="+encodeURIComponent(this.version.toString())+"&op=login";n&&(i+="&scopes="+encodeURIComponent(n.join(" "))),window.open(i,"_blank")},i.prototype.logOut=function(){var e="https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri="+encodeURI(window.location.href);window.location.href=e},i.prototype.base64Decode=function(e){var t,r,n,o,i={},s=0,a=0,c="",u=String.fromCharCode,l=e.length,p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";for(t=0;64>t;t++)i[p.charAt(t)]=t;for(n=0;l>n;n++)for(r=i[e.charAt(n)],s=(s<<6)+r,a+=6;a>=8;)((o=s>>>(a-=8)&255)||l-2>n)&&(c+=u(o));return c},i.prototype.generateNonce=function(){for(var e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",r=0;32>r;r++)e+=t.charAt(Math.floor(Math.random()*t.length));return e},i}();e.Identity=i}(Kurve||(Kurve={}));var Kurve;!function(e){var t;!function(e){var t=function(){function e(){}return e.rootUrl="https://graph.microsoft.com/",e}(),r=function(){function e(){}return e.OpenId="openid",e.OfflineAccess="offline_access",e}();e.General=r;var n=function(){function e(){}return e.Read=t.rootUrl+"User.Read",e.ReadWrite=t.rootUrl+"User.ReadWrite",e.ReadBasicAll=t.rootUrl+"User.ReadBasic.All",e.ReadAll=t.rootUrl+"User.Read.All",e.ReadWriteAll=t.rootUrl+"User.ReadWrite.All",e}();e.User=n;var o=function(){function e(){}return e.Read=t.rootUrl+"Contacts.Read",e.ReadWrite=t.rootUrl+"Contacts.ReadWrite",e}();e.Contacts=o;var i=function(){function e(){}return e.ReadAll=t.rootUrl+"Directory.Read.All",e.ReadWriteAll=t.rootUrl+"Directory.ReadWrite.All",e.AccessAsUserAll=t.rootUrl+"Directory.AccessAsUser.All",e}();e.Directory=i;var s=function(){function e(){}return e.ReadAll=t.rootUrl+"Group.Read.All",e.ReadWriteAll=t.rootUrl+"Group.ReadWrite.All",e.AccessAsUserAll=t.rootUrl+"Directory.AccessAsUser.All",e}();e.Group=s;var a=function(){function e(){}return e.Read=t.rootUrl+"Mail.Read",e.ReadWrite=t.rootUrl+"Mail.ReadWrite",e.Send=t.rootUrl+"Mail.Send",e}();e.Mail=a;var c=function(){function e(){}return e.Read=t.rootUrl+"Calendars.Read",e.ReadWrite=t.rootUrl+"Calendars.ReadWrite",e}();e.Calendars=c;var u=function(){function e(){}return e.Read=t.rootUrl+"Files.Read",e.ReadAll=t.rootUrl+"Files.Read.All",e.ReadWrite=t.rootUrl+"Files.ReadWrite",e.ReadWriteAppFolder=t.rootUrl+"Files.ReadWrite.AppFolder",e.ReadWriteSelected=t.rootUrl+"Files.ReadWrite.Selected",e}();e.Files=u;var l=function(){function e(){}return e.ReadWrite=t.rootUrl+"Tasks.ReadWrite",e}();e.Tasks=l;var p=function(){function e(){}return e.Read=t.rootUrl+"People.Read",e.ReadWrite=t.rootUrl+"People.ReadWrite",e}();e.People=p;var d=function(){function e(){}return e.Create=t.rootUrl+"Notes.Create",e.ReadWriteCreatedByApp=t.rootUrl+"Notes.ReadWrite.CreatedByApp",e.Read=t.rootUrl+"Notes.Read",e.ReadAll=t.rootUrl+"Notes.Read.All",e.ReadWriteAll=t.rootUrl+"Notes.ReadWrite.All",e}();e.Notes=d}(t=e.Scopes||(e.Scopes={}));var r=function(){function e(){}return e}();e.ProfilePhotoDataModel=r;var n=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.ProfilePhoto=n;var o=function(){function e(){}return e}();e.UserDataModel=o;var i=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e.prototype.memberOf=function(e,t,r){this.graph.memberOfForUser(this._data.userPrincipalName,e,r)},e.prototype.memberOfAsync=function(e){return this.graph.memberOfForUserAsync(this._data.userPrincipalName,e)},e.prototype.messages=function(e,t){this.graph.messagesForUser(this._data.userPrincipalName,e,t)},e.prototype.messagesAsync=function(e){return this.graph.messagesForUserAsync(this._data.userPrincipalName,e)},e.prototype.manager=function(e,t){this.graph.managerForUser(this._data.userPrincipalName,e,t)},e.prototype.managerAsync=function(e){return this.graph.managerForUserAsync(this._data.userPrincipalName,e)},e.prototype.profilePhoto=function(e){this.graph.profilePhotoForUser(this._data.userPrincipalName,e)},e.prototype.profilePhotoAsync=function(){return this.graph.profilePhotoForUserAsync(this._data.userPrincipalName)},e.prototype.profilePhotoValue=function(e){this.graph.profilePhotoValueForUser(this._data.userPrincipalName,e)},e.prototype.profilePhotoValueAsync=function(){return this.graph.profilePhotoValueForUserAsync(this._data.userPrincipalName)},e.prototype.calendar=function(e,t){this.graph.calendarForUser(this._data.userPrincipalName,e,t)},e.prototype.calendarAsync=function(e){return this.graph.calendarForUserAsync(this._data.userPrincipalName,e)},e}();e.User=i;var s=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.Users=s;var a=function(){function e(){}return e}();e.MessageDataModel=a;var c=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.Message=c;var u=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.Messages=u;var l=function(){function e(){}return e}();e.CalendarEvent=l;var p=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.CalendarEvents=p;var d=function(){function e(){}return e}();e.Contact=d;var h=function(){function e(){}return e}();e.GroupDataModel=h;var f=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.Group=f;var v=function(){function e(e,t){this.graph=e,this._data=t}return Object.defineProperty(e.prototype,"data",{get:function(){return this._data},enumerable:!0,configurable:!0}),e}();e.Groups=v;var y=function(){function r(e){this.req=null,this.accessToken=null,this.KurveIdentity=null,this.defaultResourceID="https://graph.microsoft.com",this.baseUrl="https://graph.microsoft.com/v1.0/",e.defaultAccessToken?this.accessToken=e.defaultAccessToken:this.KurveIdentity=e.identity}return r.prototype.scopesForV2=function(t){return this.KurveIdentity?this.KurveIdentity.getCurrentOauthVersion()===e.OAuthVersion.v1?null:t:null},r.prototype.meAsync=function(t){var r=new e.Deferred;return this.me(function(e,t){t?r.reject(t):r.resolve(e)},t),r.promise},r.prototype.me=function(e,r){var n=[t.User.Read],o=this.buildMeUrl()+"/";r&&(o+="?"+r),this.getUser(o,e,this.scopesForV2(n))},r.prototype.userAsync=function(t,r,n){void 0===n&&(n=!0);var o=new e.Deferred;return this.user(t,function(e,t){t?o.reject(t):o.resolve(e)},r,n),o.promise},r.prototype.user=function(e,r,n,o){void 0===o&&(o=!0);var i=[];i=o?[t.User.ReadBasicAll]:[t.User.ReadAll];var s=this.buildUsersUrl()+"/"+e;n&&(s+="?"+n),this.getUser(s,r,this.scopesForV2(i))},r.prototype.usersAsync=function(t,r){void 0===r&&(r=!0);var n=new e.Deferred;return this.users(function(e,t){t?n.reject(t):n.resolve(e)},t,r),n.promise},r.prototype.users=function(e,r,n){void 0===n&&(n=!0);var o=[];o=n?[t.User.ReadBasicAll]:[t.User.ReadAll];var i=this.buildUsersUrl()+"/";r&&(i+="?"+r),this.getUsers(i,e,this.scopesForV2(o))},r.prototype.groupAsync=function(t,r){var n=new e.Deferred;return this.group(t,function(e,t){t?n.reject(t):n.resolve(e)},r),n.promise},r.prototype.group=function(e,r,n){var o=[t.Group.ReadAll],i=this.buildGroupsUrl()+"/"+e;n&&(i+="?"+n),this.getGroup(i,r,this.scopesForV2(o))},r.prototype.groupsAsync=function(t){var r=new e.Deferred;return this.groups(function(e,t){t?r.reject(t):r.resolve(e)},t),r.promise},r.prototype.groups=function(e,r){var n=[t.Group.ReadAll],o=this.buildGroupsUrl()+"/";r&&(o+="?"+r),this.getGroups(o,e,r,this.scopesForV2(n))},r.prototype.messagesForUserAsync=function(t,r){var n=new e.Deferred;return this.messagesForUser(t,function(e,t){t?n.reject(t):n.resolve(e)},r),n.promise},r.prototype.messagesForUser=function(e,r,n){var o=[t.Mail.Read],i=this.buildUsersUrl()+"/"+e+"/messages";n&&(i+="?"+n),this.getMessages(i,function(e,t){r(e,t)},n,this.scopesForV2(o))},r.prototype.calendarForUser=function(e,t,r){},r.prototype.calendarForUserAsync=function(t,r){var n=new e.Deferred;return n.promise},r.prototype.memberOfForUserAsync=function(t,r){var n=new e.Deferred;return this.memberOfForUser(t,function(e,t){t?n.reject(t):n.resolve(e)},r),n.promise},r.prototype.memberOfForUser=function(e,r,n){var o=[t.Group.ReadAll],i=this.buildUsersUrl()+"/"+e+"/memberOf";n&&(i+="?"+n),this.getGroups(i,r,n,this.scopesForV2(o))},r.prototype.managerForUserAsync=function(t,r){var n=new e.Deferred;return this.managerForUser(t,function(e,t){t?n.reject(t):n.resolve(e)},r),n.promise},r.prototype.managerForUser=function(e,r,n){var o=[t.Directory.ReadAll],i=this.buildUsersUrl()+"/"+e+"/manager";n&&(i+="?"+n),this.getUser(i,r,this.scopesForV2(o))},r.prototype.directReportsForUserAsync=function(t,r){var n=new e.Deferred;return this.directReportsForUser(t,function(e,t){t?n.reject(t):n.resolve(e)},r),n.promise},r.prototype.directReportsForUser=function(e,r,n){var o=[t.Directory.ReadAll],i=this.buildUsersUrl()+"/"+e+"/directReports";n&&(i+="?"+n),this.getUsers(i,r,this.scopesForV2(o))},r.prototype.profilePhotoForUserAsync=function(t){var r=new e.Deferred;return this.profilePhotoForUser(t,function(e,t){t?r.reject(t):r.resolve(e)}),r.promise},r.prototype.profilePhotoForUser=function(e,r){var n=[t.User.ReadBasicAll],o=this.buildUsersUrl()+"/"+e+"/photo";this.getPhoto(o,r,this.scopesForV2(n))},r.prototype.profilePhotoValueForUserAsync=function(t){var r=new e.Deferred;return this.profilePhotoValueForUser(t,function(e,t){t?r.reject(t):r.resolve(e)}),r.promise},r.prototype.profilePhotoValueForUser=function(e,r){var n=[t.User.ReadBasicAll],o=this.buildUsersUrl()+"/"+e+"/photo/$value";this.getPhotoValue(o,r,this.scopesForV2(n))},r.prototype.getAsync=function(t){var r=new e.Deferred;return this.get(t,function(e,t){t?r.reject(t):r.resolve(e)}),r.promise},r.prototype.get=function(e,t,r,n){var o=this,i=new XMLHttpRequest;r&&(i.responseType=r),i.onreadystatechange=function(){4===i.readyState&&200===i.status?r?t(i.response,null):t(i.responseText,null):4===i.readyState&&200!==i.status&&t(null,o.generateError(i))},i.open("GET",e),this.addAccessTokenAndSend(i,function(e){e&&t(null,e)},n)},r.prototype.generateError=function(t){var r=new e.Error;return r.status=t.status,r.statusText=t.statusText,""===t.responseType||"text"===t.responseType?r.text=t.responseText:r.other=t.response,r},r.prototype.getUsers=function(t,r,n){var o=this;this.get(t,function(t,n){if(n)return void r(null,n);var s=JSON.parse(t);if(s.error){var a=new e.Error;return a.other=s.error,void r(null,a)}var c=s.value?s.value:[s],u=new e.Users(o,c.map(function(e){return new i(o,e)})),l=s["@odata.nextLink"];l&&(u.nextLink=function(t){var r=new e.Deferred;return o.getUsers(l,function(e,n){t?t(e,n):n?r.reject(n):r.resolve(e)}),r.promise}),r(u,null)},null,n)},r.prototype.getUser=function(t,r,n){var o=this;this.get(t,function(t,n){if(n)return void r(null,n);var s=JSON.parse(t);if(s.error){var a=new e.Error;return a.other=s.error,void r(null,a)}var c=new i(o,s);r(c,null)},null,n)},r.prototype.addAccessTokenAndSend=function(e,t,r){this.accessToken?(e.setRequestHeader("Authorization","Bearer "+this.accessToken),e.send()):r?this.KurveIdentity.getAccessTokenForScopes(r,!1,function(r,n){n?t(n):(e.setRequestHeader("Authorization","Bearer "+r),e.send(),t(null))}):this.KurveIdentity.getAccessToken(this.defaultResourceID,function(r,n){n?t(n):(e.setRequestHeader("Authorization","Bearer "+r),e.send(),t(null))})},r.prototype.getMessages=function(t,r,n,o){var i=this,s=t;n&&(t+="?"+n),this.get(s,function(t,n){if(n)return void r(null,n);var o=JSON.parse(t);if(o.error){var s=new e.Error;return s.other=o.error,void r(null,s)}var a=o.value?o.value:[o],u=new e.Messages(i,a.map(function(e){return new c(i,e)}));o["@odata.nextLink"]&&(u.nextLink=function(t,r){var n=new e.Deferred;return i.getMessages(o["@odata.nextLink"],function(e,r){t?t(e,r):r?n.reject(r):n.resolve(e)},r),n.promise}),r(u,null)},null,o)},r.prototype.getGroups=function(t,r,n,o){var i=this,s=t;n&&(t+="?"+n),this.get(s,function(t,n){if(n)return void r(null,n);var o=JSON.parse(t);if(o.error){var s=new e.Error;return s.other=o.error,void r(null,s)}var a=o.value?o.value:[o],c=new e.Groups(i,a.map(function(e){return new f(i,e)})),u=o["@odata.nextLink"];u&&(c.nextLink=function(t){var r=new e.Deferred;return i.getGroups(u,function(e,n){t?t(e,n):n?r.reject(n):r.resolve(e)}),r.promise}),r(c,null)},null,o)},r.prototype.getGroup=function(t,r,n){var o=this;this.get(t,function(t,n){if(n)return void r(null,n);var i=JSON.parse(t);if(i.error){var s=new e.Error;return s.other=i.error,void r(null,s)}var a=new e.Group(o,i);r(a,null)},null,n)},r.prototype.getPhoto=function(t,r,o){var i=this;this.get(t,function(t,o){if(o)return void r(null,o);var s=JSON.parse(t);if(s.error){var a=new e.Error;return a.other=s.error,void r(null,a)}var c=new n(i,s);r(c,null)},null,o)},r.prototype.getPhotoValue=function(e,t,r){this.get(e,function(e,r){return r?void t(null,r):void t(e,null)},"blob",r)},r.prototype.buildMeUrl=function(){return this.baseUrl+"me"},r.prototype.buildUsersUrl=function(){return this.baseUrl+"/users"},r.prototype.buildGroupsUrl=function(){return this.baseUrl+"/groups"},r}();e.Graph=y}(Kurve||(Kurve={})),("undefined"!=typeof window&&window.module||"undefined"!=typeof module)&&"undefined"!=typeof module.exports&&(module.exports=Kurve);