let pipWindow = null;

export async function openSubWindow(participants) {
    pipWindow = await documentPictureInPicture.requestWindow({ width: 400, height: 250});

    pipWindow.document.body.innerHTML = `
    <main class="pip-container">
        <div id="participants"></div>
    </main>
    `

    renderParticipants(participants)
}

function renderParticipants(participants) {
    // サブウィンドウのDOM要素を取得
    const sannkasyayouso = pipWindow.document.querySelector('#participants');

    const participantHtml = participants.map((participant) => {
        return `
        <div class="participant">
            <div class="avatar">👤</div>
            <div class="name">${participant.name}</div>
        </div>
        `
    }).join('')
    sannkasyayouso.innerHTML = participantHtml;
}