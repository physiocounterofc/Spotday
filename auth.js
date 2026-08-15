
const CLIENT_ID = "551a2178273b4113abc75c789acffeee";

const REDIRECT_URI =
    "https://physiocounterofc.github.io/Spotday/";

const SCOPES = [
    "user-read-private",
    "user-read-recently-played"
].join(" ");

/* ==============================
   PKCE
============================== */

function generateRandomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const values = crypto.getRandomValues(
        new Uint8Array(length)
    );

    return Array.from(values)
        .map(value => characters[value % characters.length])
        .join("");
}


async function sha256(plain) {

    const encoder = new TextEncoder();

    const data = encoder.encode(plain);

    return await crypto.subtle.digest(
        "SHA-256",
        data
    );
}


function base64UrlEncode(input) {

    return btoa(
        String.fromCharCode(...new Uint8Array(input))
    )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}


async function createCodeChallenge(codeVerifier) {

    const hashed = await sha256(codeVerifier);

    return base64UrlEncode(hashed);
}


/* ==============================
   LOGIN
============================== */

async function loginWithSpotify() {

    if (
        !CLIENT_ID ||
        CLIENT_ID === "COLOQUE_SEU_CLIENT_ID_AQUI"
    ) {

        alert(
            "Primeiro coloque o Client ID do Spotify no auth.js."
        );

        return;
    }

    const codeVerifier = generateRandomString(64);

    const codeChallenge =
        await createCodeChallenge(codeVerifier);

    localStorage.setItem(
        "spotday_code_verifier",
        codeVerifier
    );


    const state = generateRandomString(16);

    localStorage.setItem(
        "spotday_state",
        state
    );


    const authURL =
        new URL(
            "https://accounts.spotify.com/authorize"
        );


    authURL.search = new URLSearchParams({

        response_type: "code",

        client_id: CLIENT_ID,

        scope: SCOPES,

        redirect_uri: REDIRECT_URI,

        state: state,

        code_challenge_method: "S256",

        code_challenge: codeChallenge

    }).toString();


    window.location.href =
        authURL.toString();
}


/* ==============================
   TROCAR CODE POR TOKEN
============================== */

async function handleCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const code =
        params.get("code");

    const state =
        params.get("state");

    const error =
        params.get("error");


    if (error) {

        console.error(
            "Spotify recusou a autorização:",
            error
        );

        return false;
    }


    if (!code) {
        return false;
    }


    const savedState =
        localStorage.getItem(
            "spotday_state"
        );


    if (state !== savedState) {

        console.error(
            "State inválido."
        );

        return false;
    }


    const codeVerifier =
        localStorage.getItem(
            "spotday_code_verifier"
        );


    const response =
        await fetch(
            "https://accounts.spotify.com/api/token",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({

                    client_id:
                        CLIENT_ID,

                    grant_type:
                        "authorization_code",

                    code:
                        code,

                    redirect_uri:
                        REDIRECT_URI,

                    code_verifier:
                        codeVerifier

                })

            }
        );


    if (!response.ok) {

        console.error(
            "Erro ao conseguir token:",
            await response.text()
        );

        return false;
    }


    const data =
        await response.json();


    localStorage.setItem(
        "spotday_access_token",
        data.access_token
    );


    if (data.refresh_token) {

        localStorage.setItem(
            "spotday_refresh_token",
            data.refresh_token
        );

    }


    localStorage.setItem(
        "spotday_token_expires",
        String(
            Date.now() +
            data.expires_in * 1000
        )
    );


    localStorage.removeItem(
        "spotday_code_verifier"
    );

    localStorage.removeItem(
        "spotday_state"
    );


    window.history.replaceState(
        {},
        document.title,
        REDIRECT_URI
    );


    return true;
}


/* ==============================
   TOKEN
============================== */

function getAccessToken() {

    return localStorage.getItem(
        "spotday_access_token"
    );
}


/* ==============================
   LOGOUT
============================== */

function logout() {

    localStorage.removeItem(
        "spotday_access_token"
    );

    localStorage.removeItem(
        "spotday_refresh_token"
    );

    localStorage.removeItem(
        "spotday_token_expires"
    );

    window.location.reload();
}