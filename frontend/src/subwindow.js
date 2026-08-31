let pipWindow = null;

export async function openSubWindow() {
    pipWindow = await documentPictureInPicture.requestWindow({ width: 400, height: 250});

    pipWindow.document.body.innerHTML = `
    <main>
        <h1>Sub Window</h1>
        <p>サブウィンドウ</p>
    </main>
    `
}