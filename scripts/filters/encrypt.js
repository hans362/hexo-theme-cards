"use strict";
const crypto = require("crypto");
const cheerio = require("cheerio");

function aes_encrypt(key, iv, msg) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(msg, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function sha384(msg) {
  const hash = crypto.createHash("sha384");
  hash.update(msg);
  return hash.digest("hex");
}

hexo.extend.filter.register("after_post_render", (data) => {
  const $ = cheerio.load(data.content);
  $("encrypt").each((i, elem) => {
    const password = elem.attribs.password;
    const hint = elem.attribs.hint;
    const hash = Buffer.from(sha384(password), "hex");
    const key = hash.subarray(0, 32);
    const iv = hash.subarray(32, 48);
    const cipher = aes_encrypt(key, iv, $(elem).html());
    $(elem).replaceWith(`
    <div class="encrypt card" style="text-align:center;">
      <div style="font-size:1.1rem;">🔐 内容受密码保护</div>
      <p style="font-size:0.8rem;">密码提示：${hint}</p>
      <form class="search-form" onsubmit="decrypt(this.querySelector('a'));return false;">
        <input type="password" class="password search-input" placeholder="请输入密码" />
        <input type="hidden" class="cipher" value="${cipher}" />
        <a onclick="decrypt(this)" style="margin-left: .35em; margin-right: .35em">解密</a>
      </form>
    </div>
    `);
  });
  data.content = $.html();
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
        el.parentNode.parentNode.style.textAlign = 'left';
        el.parentNode.parentNode.classList.remove('card');
        el.parentNode.parentNode.innerHTML = decrypted;
      } catch (e) {
        alert('密码错误！');
      }
    }
    </script>
    `;
  }
});
