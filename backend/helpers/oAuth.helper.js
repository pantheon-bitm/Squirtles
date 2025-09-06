import {AuthorizationCode} from "simple-oauth2"
import {  GithubClient, GoogleClient, SpotifyClient, SlackClient } from "../oauth.secrets.js"


const generateAuthUri=(provider,scopes,providerName)=>{
   
    const state = '';
    const client=new AuthorizationCode(provider)
                const authorizationUri = client.authorizeURL({
                    redirect_uri: `http://localhost:3000/api/v1/users/auth/oauth/${providerName}/callback`,
                    scope: scopes,
                    user_scope: scopes,
                    state: state,
                  });
                  return authorizationUri;
}
const registerUserRedirectUri=(provider,integration)=>{
    let scopes;
   const integrationScopes = [
    {
        name: "drive",
        scope: "https://www.googleapis.com/auth/drive.readonly"
    },
    {
        name: "driveActivity",
        scope: "https://www.googleapis.com/auth/drive.activity.readonly"
    },
    {
        name: "gmail",
        scope: "https://www.googleapis.com/auth/gmail.readonly"
    },
    {
        name: "calendar",
        scope: "https://www.googleapis.com/auth/calendar.readonly"
    },
    {
        name: "calendarFull",
        scope: "https://www.googleapis.com/auth/calendar"
    },
    {
        name: "docs",
        scope: "https://www.googleapis.com/auth/documents.readonly"
    }
];

        switch(provider){
            case "google":
                scopes = `https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile ${integration ? integrationScopes.find(s => s.name === integration)?.scope || '' : ''}`;
               return generateAuthUri(GoogleClient,scopes,"google") 
            case "facebook":
                scopes = ['email'];
                return generateAuthUri(FacebookClient,scopes,"facebook") 
            case "github":
                scopes = ['user', 'user:email'];
                return generateAuthUri(GithubClient,scopes,"github") 
            case "microsoft":
                scopes = ['User.Read']; 
                return generateAuthUri(MicrosoftClient,scopes,"microsoft") 
            case "spotify":
                scopes = ['user-read-private', 'user-read-email'];
                return generateAuthUri(SpotifyClient,scopes,"spotify") 
            case "slack" :
                scopes = ['identity.basic', 'identity.email', 'identity.avatar'];
                return generateAuthUri(SlackClient,scopes,"slack")
            default:
                return undefined;
        }
}
export {registerUserRedirectUri}