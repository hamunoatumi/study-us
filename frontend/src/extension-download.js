import './style.css'

const extensionDownloadUrl =
  import.meta.env.VITE_EXTENSION_DOWNLOAD_URL?.trim() ||
  '/extension/download'

const downloadLink = document.querySelector('#extension-download-link')
const copyButton = document.querySelector('#copy-extensions-url')
const copyResult = document.querySelector('#copy-result')

downloadLink.href = extensionDownloadUrl

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('chrome://extensions')
    copyResult.textContent = 'コピーしました。Chromeのアドレス欄へ貼り付けてください。'
  } catch {
    copyResult.textContent = 'コピーできませんでした。上の文字列を選択してコピーしてください。'
  }
})
