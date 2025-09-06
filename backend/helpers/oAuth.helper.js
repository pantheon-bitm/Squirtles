import {AuthorizationCode} from "simple-oauth2"
import {  GithubClient, GoogleClient, SpotifyClient, SlackClient } from "../oauth.secrets.js"
import {User} from "../models/user.model.js"

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
const registerUserRedirectUri = async (provider, integration, userId) => {
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

    const builderScopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.activity.readonly",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/documents.readonly"
    ];

    switch (provider) {
        case "google":
            // Use Set to avoid duplicates
            const scopeSet = new Set();
            
            // Always add basic scopes
            scopeSet.add("https://www.googleapis.com/auth/userinfo.email");
            scopeSet.add("https://www.googleapis.com/auth/userinfo.profile");
            
            // Add integration-specific scope if provided
            if (integration) {
                const integrationScope = integrationScopes.find(s => s.name === integration)?.scope;
                if (integrationScope) {
                    scopeSet.add(integrationScope);
                }
            }
            
            // Add existing user scopes if userId is provided
            if (userId) {
                try {
                    console.log("Looking for user with ID:", userId);
                    const user = await User.findById(userId).select("oauth.providers");
                    console.log("User found:", !!user);
                    
                    if (user) {
                        console.log("User oauth providers:", JSON.stringify(user.oauth?.providers, null, 2));
                        
                        const existingProvider = user.oauth?.providers?.find(
                            (provider) => provider.providerName === "google"
                        );
                        
                        console.log("Existing Google provider found:", !!existingProvider);
                        
                        if (existingProvider && existingProvider.scopes) {
                            console.log("Existing scopes found:", existingProvider.scopes);
                            console.log("Builder scopes to check against:", builderScopes);
                            
                            for (const scope of existingProvider.scopes) {
                                console.log(`Checking scope: ${scope}, included: ${builderScopes.includes(scope)}`);
                                if (builderScopes.includes(scope)) {
                                    console.log("✅ Adding existing scope: ", scope);
                                    scopeSet.add(scope);
                                } else {
                                    console.log("❌ Skipping scope (not in builderScopes): ", scope);
                                }
                            }
                        } else {
                            console.log("No existing Google provider or no scopes found");
                            if (existingProvider) {
                                console.log("Provider exists but scopes:", existingProvider.scopes);
                            }
                        }
                    } else {
                        console.log("User not found with ID:", userId);
                    }
                } catch (error) {
                    console.error("Error fetching user scopes:", error);
                }
            } else {
                console.log("No userId provided");
            }
            
            // Convert Set back to space-separated string
            scopes = Array.from(scopeSet).join(' ');
            console.log("Final Scopes: ", scopes);
            return generateAuthUri(GoogleClient, scopes, "google");

        case "facebook":
            scopes = ['email'];
            return generateAuthUri(FacebookClient, scopes, "facebook");
            
        case "github":
            scopes = ['user', 'user:email'];
            return generateAuthUri(GithubClient, scopes, "github");
            
        case "microsoft":
            scopes = ['User.Read'];
            return generateAuthUri(MicrosoftClient, scopes, "microsoft");
            
        case "spotify":
            scopes = ['user-read-private', 'user-read-email'];
            return generateAuthUri(SpotifyClient, scopes, "spotify");
            
        case "slack":
            scopes = ['identity.basic', 'identity.email', 'identity.avatar'];
            return generateAuthUri(SlackClient, scopes, "slack");
            
        default:
            return undefined;
    }
}
export {registerUserRedirectUri}