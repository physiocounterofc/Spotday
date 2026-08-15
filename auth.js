// ==========================================
// SPOTDAY - AUTENTICAÇÃO SPOTIFY
// Authorization Code + PKCE
// ==========================================


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const CLIENT_ID =
    "551a2178273b4113abc75c789acffeee";

const REDIRECT_URI =
    "https://physiocounterofc.github.io/Spotday/";


// Permissões do Spotday

const SCOPES = [
    "user-read-private",
    "user-read-recently-played",
    "user-read-currently-playing"
].join(" ");


// ==========================================
// GERAR STRING ALEATÓRIA
// ==========================================

function generateRandomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const values =
        crypto.getRandomValues(
            new Uint8Array(length)
        );

    return Array.from(values)
        .map(
            value =>
                characters[value % characters.length]
        )
        .join("");
}


// ==========================================
// SHA-256
// ==========================================

async function sha256(plain) {

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(plain);

    return await crypto.subtle.digest(
        "SHA-256",
        data
    );
}


// ==========================================
// BASE64 URL SAFE
// ==========================================

function base64UrlEncode(input) {

    return btoa(
        String.fromCharCode(
            ...new Uint8Array(input)
        )
    )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}


// ==========================================
// CRIAR CODE CHALLENGE
// ==========================================

async function createCodeChallenge(
    codeVerifier
) {

    const hashed =
        await sha256(codeVerifier);

    return base64UrlEncode(hashed);
}


// ==========================================
// LOGIN COM SPOTIFY
// ==========================================

async function loginWithSpotify() {

    // Verificar Client ID

    if (
        !CLIENT_ID
    ) {

        alert(
            "Client ID do Spotify não encontrado."
        );

        return;
    }


    // ======================================
    // GERAR PKCE VERIFIER
    // ======================================

    const codeVerifier =
        generateRandomString(64);


    // ======================================
    // GERAR PKCE CHALLENGE
    // ======================================

    const codeChallenge =
        await createCodeChallenge(
            codeVerifier
        );


    // Guardar verifier

    localStorage.setItem(
        "spotday_code_verifier",
        codeVerifier
    );


    // ======================================
    // GERAR STATE
    // ======================================

    const state =
        generateRandomString(32);


    localStorage.setItem(
        "spotday_state",
        state
    );


    // ======================================
    // CRIAR URL DO SPOTIFY
    // ======================================

    const authURL =
        new URL(
            "https://accounts.spotify.com/authorize"
        );


    const params =
        new URLSearchParams({

            response_type:
                "code",

            client_id:
                CLIENT_ID,

            scope:
                SCOPES,

            redirect_uri:
                REDIRECT_URI,

            state:
                state,

            // Força a tela de autorização

            show_dialog:
                "true",

            // PKCE

            code_challenge_method:
                "S256",

            code_challenge:
                codeChallenge

        });


    authURL.search =
        params.toString();


    // ======================================
    // IR PARA O SPOTIFY
    // ======================================

    window.location.href =
        authURL.toString();
}


// ==========================================
// PROCESSAR CALLBACK DO SPOTIFY
// ==========================================

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


    // ======================================
    // USUÁRIO NEGOU
    // ======================================

    if (error) {

        console.error(
            "Spotify authorization error:",
            error
        );


        localStorage.removeItem(
            "spotday_code_verifier"
        );

        localStorage.removeItem(
            "spotday_state"
        );


        return false;
    }


    // ======================================
    // NÃO É CALLBACK
    // ======================================

    if (!code) {

        return false;
    }


    // ======================================
    // VALIDAR STATE
    // ======================================

    const savedState =
        localStorage.getItem(
            "spotday_state"
        );


    if (
        !state ||
        state !== savedState
    ) {

        console.error(
            "State inválido."
        );

        return false;
    }


    // ======================================
    // PEGAR CODE VERIFIER
    // ======================================

    const codeVerifier =
        localStorage.getItem(
            "spotday_code_verifier"
        );


    if (!codeVerifier) {

        console.error(
            "Code verifier não encontrado."
        );

        return false;
    }


    // ======================================
    // TROCAR CODE POR TOKEN
    // ======================================

    try {

        const response =
            await fetch(
                "https://accounts.spotify.com/api/token",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body:
                        new URLSearchParams({

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


        // ==================================
        // ERRO
        // ==================================

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Erro ao conseguir token:",
                errorText
            );

            return false;
        }


        // ==================================
        // RESPOSTA
        // ==================================

        const data =
            await response.json();


        // ==================================
        // ACCESS TOKEN
        // ==================================

        localStorage.setItem(
            "spotday_access_token",
            data.access_token
        );


        // ==================================
        // REFRESH TOKEN
        // ==================================

        if (
            data.refresh_token
        ) {

            localStorage.setItem(
                "spotday_refresh_token",
                data.refresh_token
            );

        }


        // ==================================
        // EXPIRAÇÃO
        // ==================================

        if (
            data.expires_in
        ) {

            localStorage.setItem(
                "spotday_token_expires",
                String(
                    Date.now() +
                    data.expires_in * 1000
                )
            );

        }


        // ==================================
        // SCOPES CONCEDIDOS
        // ==================================

        if (
            data.scope
        ) {

            localStorage.setItem(
                "spotday_scopes",
                data.scope
            );


            console.log(
                "Scopes concedidos:",
                data.scope
            );

        }


        // ==================================
        // LIMPAR DADOS TEMPORÁRIOS
        // ==================================

        localStorage.removeItem(
            "spotday_code_verifier"
        );

        localStorage.removeItem(
            "spotday_state"
        );


        // ==================================
        // LIMPAR CODE DA URL
        // ==================================

        window.history.replaceState(
            {},
            document.title,
            REDIRECT_URI
        );


        console.log(
            "Spotify conectado com sucesso!"
        );


        return true;

    } catch (error) {

        console.error(
            "Erro durante autenticação:",
            error
        );

        return false;
    }
}


// ==========================================
// PEGAR ACCESS TOKEN
// ==========================================

function getAccessToken() {

    return localStorage.getItem(
        "spotday_access_token"
    );
}


// ==========================================
// VERIFICAR LOGIN
// ==========================================

function isLoggedIn() {

    return Boolean(
        getAccessToken()
    );
}


// ==========================================
// LOGOUT
// ==========================================

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

    localStorage.removeItem(
        "spotday_scopes"
    );

    localStorage.removeItem(
        "spotday_code_verifier"
    );

    localStorage.removeItem(
        "spotday_state"
    );


    window.location.reload();
}
