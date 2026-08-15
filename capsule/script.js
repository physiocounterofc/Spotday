// ==========================================
// SPOTDAY
// CÁPSULA DO TEMPO
// ==========================================


// ==========================================
// ESTADO
// ==========================================

let selectedDays =
    15;


let currentData =
    null;


// ==========================================
// ELEMENTOS
// ==========================================

const setup =
    document.getElementById(
        "setup"
    );


const result =
    document.getElementById(
        "result"
    );


const generateButton =
    document.getElementById(
        "generate-button"
    );


const shareButton =
    document.getElementById(
        "share-button"
    );


const setupMessage =
    document.getElementById(
        "setup-message"
    );


const message =
    document.getElementById(
        "message"
    );


const preview =
    document.getElementById(
        "preview"
    );


const capsule =
    document.getElementById(
        "capsule"
    );


// ==========================================
// PERÍODO
// ==========================================

document
    .querySelectorAll(
        ".period-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".period-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    selectedDays =
                        Number(
                            button.dataset.days
                        );

                }
            );

        }
    );


// ==========================================
// GERAR
// ==========================================

generateButton.addEventListener(
    "click",
    generateCapsule
);


async function generateCapsule() {

    try {

        generateButton.disabled =
            true;


        showSetupMessage(
            "Buscando seu histórico musical..."
        );


        // ==================================
        // PEGAR HISTÓRICO
        // ==================================

        const history =
            await getRecentlyPlayed(
                selectedDays
            );


        const tracks =
            history.items || [];


        // ==================================
        // SEM DADOS
        // ==================================

        if (
            !tracks.length
        ) {

            showSetupMessage(
                "Não encontramos reproduções nesse período."
            );


            return;

        }


        // ==================================
        // CALCULAR
        // ==================================

        currentData =
            calculateStats(
                tracks
            );


        currentData.days =
            selectedDays;


        // ==================================
        // PREENCHER ARTE
        // ==================================

        renderCapsule(
            currentData
        );


        // ==================================
        // MOSTRAR RESULTADO
        // ==================================

        setup.classList.add(
            "hidden"
        );


        result.classList.remove(
            "hidden"
        );


        // Espera o navegador atualizar
        // o layout antes de calcular
        // o tamanho da arte.

        requestAnimationFrame(
            () => {

                requestAnimationFrame(
                    resizePreview
                );

            }
        );


    } catch (error) {

        console.error(
            "Erro ao criar cápsula:",
            error
        );


        showSetupMessage(
            getFriendlyError(
                error
            )
        );


    } finally {

        generateButton.disabled =
            false;

    }

}


// ==========================================
// CALCULAR ESTATÍSTICAS
// ==========================================

function calculateStats(
    items
) {

    const trackMap =
        new Map();


    const artistMap =
        new Map();


    let totalDuration =
        0;


    items.forEach(
        item => {

            const track =
                item.track;


            if (
                !track ||
                track.type !== "track"
            ) {

                return;

            }


            // ------------------------------
            // DURAÇÃO
            // ------------------------------

            totalDuration +=
                track.duration_ms ||
                0;


            // ------------------------------
            // MÚSICA
            // ------------------------------

            const trackId =
                track.id ||
                track.name;


            if (
                !trackMap.has(
                    trackId
                )
            ) {

                trackMap.set(
                    trackId,
                    {

                        track:
                            track,

                        plays:
                            0

                    }
                );

            }


            trackMap.get(
                trackId
            ).plays++;


            // ------------------------------
            // ARTISTA
            // ------------------------------

            const artists =
                track.artists || [];


            artists.forEach(
                artist => {

                    if (
                        !artist?.id
                    ) {

                        return;

                    }


                    if (
                        !artistMap.has(
                            artist.id
                        )
                    ) {

                        artistMap.set(
                            artist.id,
                            {

                                name:
                                    artist.name,

                                plays:
                                    0

                            }
                        );

                    }


                    artistMap.get(
                        artist.id
                    ).plays++;

                }
            );

        }
    );


    // ======================================
    // TOP MÚSICAS
    // ======================================

    const topTracks =
        Array.from(
            trackMap.values()
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.plays -
                    a.plays
            );


    // ======================================
    // TOP ARTISTA
    // ======================================

    const topArtists =
        Array.from(
            artistMap.values()
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.plays -
                    a.plays
            );


    // ======================================
    // TEMPO
    // ======================================

    const minutes =
        Math.round(
            totalDuration /
            60000
        );


    return {

        totalPlays:
            items.length,

        totalTracks:
            trackMap.size,

        totalArtists:
            artistMap.size,

        minutes:
            minutes,

        topTrack:
            topTracks[0] || null,

        topTracks:
            topTracks.slice(
                0,
                5
            ),

        topArtist:
            topArtists[0] || null

    };

}


// ==========================================
// RENDER
// ==========================================

function renderCapsule(
    data
) {

    const period =
        `${data.days} DIAS`;


    document.getElementById(
        "result-period"
    ).textContent =
        period;


    document.getElementById(
        "capsule-period"
    ).textContent =
        period;


    // ======================================
    // MÚSICA
    // ======================================

    if (
        data.topTrack
    ) {

        const track =
            data.topTrack.track;


        document.getElementById(
            "track-name"
        ).textContent =
            track.name;


        document.getElementById(
            "artist-name"
        ).textContent =
            track.artists
                ?.map(
                    artist =>
                        artist.name
                )
                .join(
                    ", "
                )
            || "Artista desconhecido";


        document.getElementById(
            "play-count"
        ).textContent =
            data.topTrack.plays;


        const image =
            track.album
                ?.images?.[0]
                ?.url;


        const cover =
            document.getElementById(
                "cover"
            );


        if (
            image
        ) {

            cover.src =
                image;

        } else {

            cover.removeAttribute(
                "src"
            );

        }

    }


    // ======================================
    // ESTATÍSTICAS
    // ======================================

    document.getElementById(
        "tracks"
    ).textContent =
        data.totalTracks;


    document.getElementById(
        "artists"
    ).textContent =
        data.totalArtists;


    document.getElementById(
        "minutes"
    ).textContent =
        formatListeningTime(
            data.minutes
        );


    // ======================================
    // ARTISTA
    // ======================================

    document.getElementById(
        "top-artist"
    ).textContent =
        data.topArtist
            ?.name
        ||
        "Nenhum artista";


    // ======================================
    // RANKING
    // ======================================

    renderRanking(
        data.topTracks
    );

}


// ==========================================
// TEMPO
// ==========================================

function formatListeningTime(
    minutes
) {

    if (
        minutes < 60
    ) {

        return `${minutes}m`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    const remaining =
        minutes % 60;


    if (
        remaining === 0
    ) {

        return `${hours}h`;

    }


    return `${hours}h ${remaining}m`;

}


// ==========================================
// RANKING
// ==========================================

function renderRanking(
    tracks
) {

    const container =
        document.getElementById(
            "ranking-list"
        );


    container.innerHTML =
        "";


    tracks.forEach(
        (
            item,
            index
        ) => {

            const track =
                item.track;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "ranking-item";


            element.innerHTML = `

                <span class="rank">

                    ${String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    )}

                </span>


                <div class="ranking-info">

                    <strong>
                        ${escapeHTML(
                            track.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            track.artists
                                ?.map(
                                    artist =>
                                        artist.name
                                )
                                .join(
                                    ", "
                                )
                            || ""
                        )}
                    </span>

                </div>


                <span class="ranking-plays">

                    ${item.plays}x

                </span>

            `;


            container.appendChild(
                element
            );

        }
    );

}


// ==========================================
// PREVIEW
// ==========================================

function resizePreview() {

    if (
        !preview ||
        !capsule ||
        result.classList.contains("hidden")
    ) {

        return;

    }


    const previewWidth =
        preview.clientWidth;


    if (
        previewWidth <= 0
    ) {

        return;

    }


    // ======================================
    // ESCALA BASEADA NA LARGURA
    // ======================================

    let scale =
        Math.min(
            previewWidth / 1080,
            1
        );


    // ======================================
    // ALTURA DISPONÍVEL DA TELA
    // ======================================

    const viewportHeight =
        window.innerHeight;


    const header =
        document.querySelector(
            ".result-header"
        );


    const actions =
        document.querySelector(
            ".actions"
        );


    const headerHeight =
        header?.getBoundingClientRect()
            ?.height || 50;


    const actionsHeight =
        actions?.getBoundingClientRect()
            ?.height || 50;


    const availableHeight =
        viewportHeight -
        headerHeight -
        actionsHeight -
        45;


    // ======================================
    // SE PRECISAR, REDUZ A ARTE
    // PARA ELA CABER NA TELA
    // ======================================

    if (
        availableHeight > 0
    ) {

        const heightScale =
            availableHeight /
            1350;


        scale =
            Math.min(
                scale,
                heightScale
            );

    }


    capsule.style.transform =
        `scale(${scale})`;


    preview.style.height =
        `${1350 * scale}px`;

}


// ==========================================
// EXPORTAR PARA COMPARTILHAMENTO
// ==========================================

async function createExportCanvas() {

    const clone =
        capsule.cloneNode(
            true
        );


    clone.id =
        "capsule-export";


    clone.style.position =
        "fixed";


    clone.style.left =
        "-20000px";


    clone.style.top =
        "0";


    clone.style.width =
        "1080px";


    clone.style.height =
        "1350px";


    clone.style.transform =
        "none";


    clone.style.margin =
        "0";


    clone.style.borderRadius =
        "0";


    document.body.appendChild(
        clone
    );


    const images =
        clone.querySelectorAll(
            "img"
        );


    await Promise.all(

        Array.from(
            images
        ).map(
            img => {

                if (
                    img.complete
                ) {

                    return Promise.resolve();

                }


                return new Promise(
                    resolve => {

                        img.onload =
                            resolve;

                        img.onerror =
                            resolve;

                    }
                );

            }
        )

    );


    const canvas =
        await html2canvas(
            clone,
            {

                width:
                    1080,

                height:
                    1350,

                scale:
                    1,

                useCORS:
                    true,

                allowTaint:
                    false,

                backgroundColor:
                    "#05080c"

            }
        );


    clone.remove();


    return canvas;

}


// ==========================================
// COMPARTILHAR
// ==========================================

shareButton.addEventListener(
    "click",
    async () => {

        try {

            shareButton.disabled =
                true;


            showMessage(
                "Preparando imagem..."
            );


            const canvas =
                await createExportCanvas();


            const blob =
                await canvasToBlob(
                    canvas
                );


            const file =
                new File(
                    [
                        blob
                    ],
                    "spotday-capsula-do-tempo.png",
                    {
                        type:
                            "image/png"
                    }
                );


            // ==================================
            // COMPARTILHAMENTO NATIVO
            // ==================================

            if (

                navigator.share &&

                navigator.canShare &&

                navigator.canShare({
                    files:
                        [file]
                })

            ) {

                await navigator.share({

                    title:
                        "Minha Cápsula do Tempo",

                    text:
                        "Minha retrospectiva musical no Spotday 🎵",

                    files:
                        [file]

                });


                showMessage(
                    "Compartilhado! ✨"
                );

            } else {

                showMessage(
                    "Seu navegador não suporta compartilhamento de imagens."
                );

            }


        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                return;

            }


            console.error(
                "Erro ao compartilhar:",
                error
            );


            showMessage(
                "Não foi possível compartilhar a imagem."
            );


        } finally {

            shareButton.disabled =
                false;

        }

    }
);


// ==========================================
// VOLTAR PARA O SPOTDAY
// ==========================================

document.getElementById(
    "back-button"
).addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);


// ==========================================
// VOLTAR DA CÁPSULA
// ==========================================

document.getElementById(
    "result-back"
).addEventListener(
    "click",
    () => {

        result.classList.add(
            "hidden"
        );


        setup.classList.remove(
            "hidden"
        );


        capsule.style.transform =
            "none";


        preview.style.height =
            "auto";

    }
);


// ==========================================
// UTILITÁRIOS
// ==========================================

function canvasToBlob(
    canvas
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            canvas.toBlob(
                blob => {

                    if (
                        blob
                    ) {

                        resolve(
                            blob
                        );

                    } else {

                        reject(
                            new Error(
                                "PNG não criado."
                            )
                        );

                    }

                },
                "image/png"
            );

        }
    );

}


function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


function showSetupMessage(
    text
) {

    setupMessage.textContent =
        text;

}


function showMessage(
    text
) {

    message.textContent =
        text;


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                message.textContent =
                    "";

            },
            3500
        );

}


function getFriendlyError(
    error
) {

    const text =
        String(
            error?.message || ""
        );


    if (
        text.includes("401")
    ) {

        return "Sua sessão do Spotify expirou. Volte ao Spotday e conecte sua conta novamente.";

    }


    if (
        text.includes("429")
    ) {

        return "O Spotify pediu para esperar um pouco antes de tentar novamente.";

    }


    if (
        text.includes("403")
    ) {

        return "O Spotify recusou o acesso a esse recurso.";

    }


    return "Não foi possível buscar seu histórico. Tente novamente.";

}


// ==========================================
// RESIZE
// ==========================================

window.addEventListener(
    "resize",
    resizePreview
);
