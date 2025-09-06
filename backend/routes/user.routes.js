import {Router} from 'express';
import {    
    registerUser,
    registerOauthUser,
    loginUser,
    logoutUser,
    generateNewTokens,
    verifyUser,
    forgotPassword,
    changePassword,
    resendVerificationToken,
    changeEmail,
    updateEmail,
    forgotUserName,
    forgotEmail,
    changeUserName,
    updateAvatar,
    handleGoogleOauthCallback,
    handleGithubOauthCallback,
    handleSpotifyOauthCallback,
    handleFacebookOauthCallback,
    handleMicrosoftOauthCallback,
    getUserDetails,
    handleSlackOauthCallback
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { uploadFile } from '../middlewares/multer.middleware.js';
<<<<<<< HEAD
import { 
    connector, 
    getGmailOnly, 
    getDriveOnly, 
    getCalendarOnly 
} from '../webhooks/integrations.js';
import { verifyJWTOPT } from '../middlewares/auth.opt.middleware.js';
=======
>>>>>>> fafb721 (fresh frontend)

const router=Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/generateNewTokens").post(generateNewTokens)
<<<<<<< HEAD
router.route("/oauth").get(verifyJWTOPT,registerOauthUser)
=======
router.route("/oauth").get(registerOauthUser)
>>>>>>> fafb721 (fresh frontend)
router.route("/auth/oauth/google/callback").get(handleGoogleOauthCallback);
router.route("/auth/oauth/github/callback").get(handleGithubOauthCallback);
router.route("/auth/oauth/spotify/callback").get(handleSpotifyOauthCallback);
router.route("/auth/oauth/facebook/callback").get(handleFacebookOauthCallback);
router.route("/auth/oauth/microsoft/callback").get(handleMicrosoftOauthCallback);
router.route("/auth/oauth/slack/callback").get(handleSlackOauthCallback);

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/verify").post(verifyJWT,verifyUser)
router.route("/forgotPassword").get(verifyJWT,forgotPassword)
router.route("/changePassword").post(verifyJWT, changePassword)
router.route("/resendVerificationToken").get(verifyJWT, resendVerificationToken)
router.route("/changeEmail").get(verifyJWT, changeEmail)
router.route("/updateEmail").post(verifyJWT, updateEmail)
router.route("/forgotUserName").post(verifyJWT, forgotUserName)
router.route("/forgotEmail").post(verifyJWT, forgotEmail)
router.route("/changeUserName").post(verifyJWT, changeUserName)
router.route("/updateAvatar").patch(verifyJWT, uploadFile.single("avatar"),updateAvatar)
router.route("/getUserDetails").get(verifyJWT,getUserDetails)

<<<<<<< HEAD
// Integration routes
router.route("/connect").get(verifyJWT,connector)
router.route("/connect/gmail").get(verifyJWT, getGmailOnly)
router.route("/connect/drive").get(verifyJWT, getDriveOnly)
router.route("/connect/calendar").get(verifyJWT, getCalendarOnly)

=======
>>>>>>> fafb721 (fresh frontend)
export default router