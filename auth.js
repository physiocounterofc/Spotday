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


const SCOPES = [
    "user-read-private",
    "user-read-recently-played",
    "user-read-currently-playing"
].join(" ");


// ==========================================
// CHAVES DO LOCAL STORAGE
// ==========================================

const ACCESS_TOKEN_KEY =
    "spotday_access_token";

const REFRESH_TOKEN_KEY =
    "spotday_refresh_token";

const EXPIRES_KEY =
    "spotday_token_expires";

const SCOPES_KEY =
    "spotday_scopes";

const VERIFIER_KEY =
    "spotday_code_verifier";

const STATE_KEY =
    "spotday_state";


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
                characters[
                    value % characters.length
                ]
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
        await sha256(
            codeVerifier
        );

    return base64UrlEncode(
        hashed
    );
}


// ==========================================
// LOGIN COM SPOTIFY
// ==========================================

async function loginWithSpotify() {

    if (!CLIENT_ID) {

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
    // GERAR CODE CHALLENGE
    // ======================================

    const codeChallenge =
        await createCodeChallenge(
            codeVerifier
        );


    localStorage.setItem(
        VERIFIER_KEY,
        codeVerifier
    );


    // ======================================
    // GERAR STATE
    // ======================================

    const state =
        generateRandomString(32);


    localStorage.setItem(
        STATE_KEY,
        state
    );


    // ======================================
    // URL DE AUTORIZAÇÃO
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

            // Força nova autorização
            // durante os testes

            show_dialog:
                "false",

            // PKCE

            code_challenge_method:
                "S256",

            code_challenge:
                codeChallenge

        });


    authURL.search =
        params.toString();


    // ======================================
    // REDIRECIONAR PARA SPOTIFY
    // ======================================

    window.location.href =
        authURL.toString();
}


// ==========================================
// PROCESSAR CALLBACK
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
    // ERRO / USUÁRIO NEGOU
    // ======================================

    if (error) {

        console.error(
            "Spotify authorization error:",
            error
        );


        localStorage.removeItem(
            VERIFIER_KEY
        );

        localStorage.removeItem(
            STATE_KEY
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
            STATE_KEY
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
            VERIFIER_KEY
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


        const data =
            await response.json();


        // ==================================
        // ERRO
        // ==================================

        if (!response.ok) {

            console.error(
                "Erro ao conseguir token:",
                data
            );

            return false;
        }


        // ==================================
        // SALVAR TOKENS
        // ==================================

        saveTokenData(
            data
        );


        // ==================================
        // LIMPAR DADOS TEMPORÁRIOS
        // ==================================

        localStorage.removeItem(
            VERIFIER_KEY
        );

        localStorage.removeItem(
            STATE_KEY
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
// SALVAR DADOS DO TOKEN
// ==========================================

function saveTokenData(
    data
) {

    if (
        data.access_token
    ) {

        localStorage.setItem(
            ACCESS_TOKEN_KEY,
            data.access_token
        );

    }


    // ======================================
    // EXPIRAÇÃO
    // ======================================

    if (
        data.expires_in
    ) {

        const expiresAt =
            Date.now() +
            (
                data.expires_in *
                1000
            );


        localStorage.setItem(
            EXPIRES_KEY,
            String(
                expiresAt
            )
        );

    }


    // ======================================
    // REFRESH TOKEN
    // ======================================

    if (
        data.refresh_token
    ) {

        localStorage.setItem(
            REFRESH_TOKEN_KEY,
            data.refresh_token
        );

    }


    // ======================================
    // SCOPES
    // ======================================

    if (
        data.scope
    ) {

        localStorage.setItem(
            SCOPES_KEY,
            data.scope
        );


        console.log(
            "Scopes concedidos:",
            data.scope
        );

    }

}


// ==========================================
// RENOVAR ACCESS TOKEN
// ==========================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem(
            REFRESH_TOKEN_KEY
        );


    if (!refreshToken) {

        return null;
    }


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

                            grant_type:
                                "refresh_token",

                            refresh_token:
                                refreshToken,

                            client_id:
                                CLIENT_ID

                        })

                }
            );


        const data =
            await response.json();


        // ==================================
        // REFRESH TOKEN INVÁLIDO
        // ==================================

        if (!response.ok) {

            console.error(
                "Erro ao renovar token:",
                data
            );


            if (
                data.error ===
                "invalid_grant"
            ) {

                clearAuthData();

            }


            return null;
        }


        // ==================================
        // SALVAR NOVO ACCESS TOKEN
        // ==================================

        saveTokenData(
            data
        );


        console.log(
            "Access token renovado."
        );


        return data.access_token;


    } catch (error) {

        console.error(
            "Erro ao renovar access token:",
            error
        );


        return null;
    }
}


// ==========================================
// PEGAR ACCESS TOKEN
// ==========================================

async function getValidAccessToken() {

    const accessToken =
        localStorage.getItem(
            ACCESS_TOKEN_KEY
        );


    const expiresAt =
        Number(
            localStorage.getItem(
                EXPIRES_KEY
            )
        );


    // ======================================
    // SEM TOKEN
    // ======================================

    if (!accessToken) {

        return null;
    }


    // ======================================
    // TOKEN AINDA VÁLIDO
    //
    // Margem de 60 segundos
    // ======================================

    if (
        expiresAt &&
        Date.now() <
        expiresAt - 60000
    ) {

        return accessToken;
    }


    // ======================================
    // TOKEN EXPIRADO
    // ======================================

    console.log(
        "Access token expirado. Renovando..."
    );


    const newToken =
        await refreshAccessToken();


    return newToken;
}


// ==========================================
// PEGAR ACCESS TOKEN
// ==========================================
//
// Mantém compatibilidade com o restante
// do Spotday.

function getAccessToken() {

    return localStorage.getItem(
        ACCESS_TOKEN_KEY
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
// LIMPAR AUTENTICAÇÃO
// ==========================================

function clearAuthData() {

    localStorage.removeItem(
        ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
        REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
        EXPIRES_KEY
    );

    localStorage.removeItem(
        SCOPES_KEY
    );

    localStorage.removeItem(
        VERIFIER_KEY
    );

    localStorage.removeItem(
        STATE_KEY
    );
}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    clearAuthData();

    window.location.reload();
}
