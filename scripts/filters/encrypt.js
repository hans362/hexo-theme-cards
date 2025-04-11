"use strict";

hexo.extend.filter.register("after_post_render", (data) => {
  if (data.content.includes(`class="encrypt card"`)) {
    data.content += `
    <script>
    async function sha384(msg) {
      const encoder = new TextEncoder();
      const data = encoder.encode(msg);
      const hash = await window.crypto.subtle.digest('SHA-384', data);
      return new Uint8Array(hash);
    }
    async function aes_decrypt(key, iv, cipher) {
      const algorithm = { name: 'AES-CBC', iv: iv };
      const cryptoKey = await window.crypto.subtle.importKey('raw', key, algorithm, false, ['decrypt']);
      const decrypted = await window.crypto.subtle.decrypt(algorithm, cryptoKey, cipher);
      return new TextDecoder().decode(decrypted);
    }
    async function decrypt(el) {
      const password = el.parentNode.querySelector('.password').value;
      const cipher = el.parentNode.querySelector('.cipher').value;
      const hash = await sha384(password);
      const key = hash.slice(0, 32);
      const iv = hash.slice(32, 48);
      const cipherBuffer = Uint8Array.from(cipher.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
      try {
        const decrypted = await aes_decrypt(key, iv, cipherBuffer);
        el.parentNode.style.textAlign = 'left';
        el.parentNode.classList.remove('card');
        el.parentNode.innerHTML = decrypted;
      } catch (e) {
        alert('密码错误！');
      }
    }
    </script>
    `;
  }
});
